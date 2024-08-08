from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  # Add this import
import os
import time
import asyncio
import logging
import json
import docker
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.DEBUG)
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
# Load configuration from JSON file
with open('containers.json', 'r') as config_file:
    config = json.load(config_file)

UPLOAD_DIRECTORY = "/app/uploads"
LANGUAGES = config['languages']

os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# Initialize Docker client
docker_client = docker.from_env()

# Create a thread pool executor
thread_pool = ThreadPoolExecutor(max_workers=10)

@app.post("/execute")
async def execute_code(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file part")
    
    language = get_language_from_extension(file.filename)
    if not language:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logging.debug(f"File saved to: {file_path}")

        result = await run_in_container(language, file_path)

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

async def run_in_container(language, file_path):
    container_name = f"arena-{language}-runner-1"
    file_name = os.path.basename(file_path)

    language_config = LANGUAGES[language]
    compile_command = language_config['compile']
    execute_command = language_config['execute']

    logging.debug(f"Running in container {container_name}")
    
    try:
        loop = asyncio.get_running_loop()
        
        compilation_time = 0
        if compile_command:
            compile_command = [part.format(filename=file_name) if isinstance(part, str) else part for part in compile_command]
            compilation_start = time.time()
            compile_result = await loop.run_in_executor(thread_pool, execute_docker_command, container_name, compile_command)
            compilation_time = time.time() - compilation_start
            if compile_result.exit_code != 0:
                return {
                    'language': language,
                    'output': compile_result.output.decode('utf-8', errors='replace'),
                    'compilation_time': compilation_time,
                    'execution_time': 0,
                    'success': False
                }

        execute_command = [part.format(filename=file_name) if isinstance(part, str) else part for part in execute_command]
        execution_start = time.time()
        execute_result = await asyncio.wait_for(
            loop.run_in_executor(thread_pool, execute_docker_command, container_name, execute_command),
            timeout=200.0  # 200 seconds timeout
        )
        execution_time = time.time() - execution_start

        return {
            'output': execute_result.output.decode('utf-8', errors='replace'),
            'compilation_time': compilation_time,
            'execution_time': execution_time,
            'success': execute_result.exit_code == 0
        }

    except asyncio.TimeoutError:
        logging.error(f"Execution in container {container_name} timed out after 30 seconds")
        raise HTTPException(status_code=504, detail="Execution timed out")
    except docker.errors.NotFound:
        logging.error(f"Container {container_name} not found")
        raise HTTPException(status_code=500, detail=f"Container {container_name} not found")
    except Exception as e:
        logging.error(f"Error running command in container: {str(e)}")
        raise HTTPException(status_code=500, detail="Error executing code")
    
def execute_docker_command(container_name, command):
    container = docker_client.containers.get(container_name)
    result = container.exec_run(command)
    return result

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)