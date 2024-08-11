import psutil
import os
import time
import asyncio
import logging
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from statistics import mean, median

logging.basicConfig(level=logging.DEBUG)
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configuration from JSON file
with open('/app/containers.json', 'r') as config_file:
    config = json.load(config_file)

LANGUAGES = config['languages']

# Create a thread pool executor
thread_pool = ThreadPoolExecutor(max_workers=10)

@app.post("/execute")
async def execute_code(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file part")

    language = get_language_from_extension(file.filename)
    if not language:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_path = os.path.join('/app/temp', file.filename)

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        logging.debug(f"File saved to: {file_path}")

        result = await run_subprocess(language, file_path)

        return JSONResponse(result)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return JSONResponse({
            'language': language,
            'output': f"An unexpected error occurred: {str(e)}",
            'compilation_time': 0,
            'compilation_memory_bytes': 0,
            'execution_time': 0,
            'execution_memory_bytes': 0,
            'success': False
        }, status_code=500)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def get_language_from_extension(filename):
    file_extension = os.path.splitext(filename)[1]
    for lang, info in LANGUAGES.items():
        if info['extension'] == file_extension:
            return lang
    return None

async def run_subprocess(language, file_path):
    file_name = os.path.basename(file_path)

    language_config = LANGUAGES[language]
    compile_command = language_config['compile']
    execute_command = language_config['execute']

    logging.debug(f"Running subprocess for {language}")

    try:
        loop = asyncio.get_running_loop()
        
        compilation_time = 0
        compilation_memory = 0
        if compile_command:
            compile_command = [part.format(filename=file_name) if isinstance(part, str) else part for part in compile_command]
            compilation_start = time.time()
            compile_result = await loop.run_in_executor(thread_pool, run_command, compile_command)
            compilation_time = time.time() - compilation_start
            compilation_memory = compile_result['max_memory_bytes']
            if compile_result['returncode'] != 0:
                return {
                    'language': language,
                    'output': compile_result['output'],
                    'compilation_time': compilation_time,
                    'compilation_memory_bytes': compilation_memory,
                    'execution_time': 0,
                    'execution_memory_bytes': 0,
                    'success': False
                }

        execute_command = [part.format(filename=file_name) if isinstance(part, str) else part for part in execute_command]
        execution_start = time.time()
        execute_result = await asyncio.wait_for(
            loop.run_in_executor(thread_pool, run_command, execute_command),
            timeout=200.0  # 200 seconds timeout
        )
        execution_time = time.time() - execution_start

        return {
            'language': language,
            'output': execute_result['output'],
            'compilation_time': compilation_time,
            'compilation_memory_bytes': compilation_memory,
            'execution_time': execution_time,
            'execution_memory_bytes': execute_result['max_memory_bytes'],
            'success': execute_result['returncode'] == 0
        }

    except asyncio.TimeoutError:
        logging.error(f"Execution of {language} code timed out after 200 seconds")
        raise HTTPException(status_code=504, detail="Execution timed out")
    except Exception as e:
        logging.error(f"Error running command: {str(e)}")
        raise HTTPException(status_code=500, detail="Error executing code")

def run_command(command, num_runs=3):
    results = []
    for _ in range(num_runs):
        try:
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd='/app/temp')
            
            # Start monitoring memory usage
            memory_samples = []
            while process.poll() is None:
                try:
                    # Get detailed memory info
                    memory_info = psutil.Process(process.pid).memory_full_info()
                    memory_samples.append(memory_info.uss)  # Unique Set Size
                except psutil.NoSuchProcess:
                    # Process has already terminated
                    break
                time.sleep(0.001)  # Check every 10ms
            
            # Get the output
            stdout, stderr = process.communicate(timeout=200)
            
            results.append({
                'output': stdout + stderr,
                'returncode': process.returncode,
                'max_memory_bytes': max(memory_samples) if memory_samples else 0,
                'avg_memory_bytes': mean(memory_samples) if memory_samples else 0,
                'median_memory_bytes': median(memory_samples) if memory_samples else 0
            })
        except subprocess.TimeoutExpired:
            results.append({
                'output': "Command execution timed out",
                'returncode': -1,
                'max_memory_bytes': 0,
                'avg_memory_bytes': 0,
                'median_memory_bytes': 0
            })

    # Aggregate results from multiple runs
    return {
        'output': results[0]['output'],  # Use output from the first run
        'returncode': results[0]['returncode'],  # Use return code from the first run
        'max_memory_bytes': max(r['max_memory_bytes'] for r in results),
        'avg_memory_bytes': mean(r['avg_memory_bytes'] for r in results),
        'median_memory_bytes': median(r['median_memory_bytes'] for r in results)
    }

if __name__ == 'main':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)