import json
import os
import time
import asyncio
import logging
import subprocess
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from mangum import Mangum

logging.basicConfig(level=logging.DEBUG)
app = FastAPI()

# Load configuration from JSON file
with open('containers.json', 'r') as config_file:
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

    file_path = os.path.join('/tmp', file.filename)
    
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
            'output': f"An unexpected error occurred: {str(e)}",
            'compilation_time': 0,
            'execution_time': 0,
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
        if compile_command:
            compile_command = [part.format(filename=file_name) if isinstance(part, str) else part for part in compile_command]
            compilation_start = time.time()
            compile_result = await loop.run_in_executor(thread_pool, run_command, compile_command)
            compilation_time = time.time() - compilation_start
            if compile_result['returncode'] != 0:
                return {
                    'language': language,
                    'output': compile_result['output'],
                    'compilation_time': compilation_time,
                    'execution_time': 0,
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
            'output': execute_result['output'],
            'compilation_time': compilation_time,
            'execution_time': execution_time,
            'success': execute_result['returncode'] == 0
        }

    except asyncio.TimeoutError:
        logging.error(f"Execution of {language} code timed out after 200 seconds")
        raise HTTPException(status_code=504, detail="Execution timed out")
    except Exception as e:
        logging.error(f"Error running command: {str(e)}")
        raise HTTPException(status_code=500, detail="Error executing code")
    
def run_command(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=200, cwd='/tmp')
        return {
            'output': result.stdout + result.stderr,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'output': "Command execution timed out",
            'returncode': -1
        }

# Wrap the FastAPI app with Mangum for AWS Lambda compatibility
handler = Mangum(app)