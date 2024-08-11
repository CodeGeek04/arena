import uuid
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
from mangum import Mangum
import json
import base64
from fastapi import UploadFile
from io import BytesIO
from pydantic import BaseModel
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
with open('containers.json', 'r') as config_file:
    config = json.load(config_file)

LANGUAGES = config['languages']

# Create a thread pool executor
thread_pool = ThreadPoolExecutor(max_workers=10)

class CodeExecution(BaseModel):
    file_path: str
    language: str

async def execute_code(execution: CodeExecution):
    print("Event received in execute_code")
    if not os.path.exists(execution.file_path):
        raise HTTPException(status_code=400, detail="File not found")
    
    if not execution.language or execution.language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="Invalid or unsupported language")

    try:
        result = await run_subprocess(execution.language, execution.file_path)
        return result
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return {
            'language': execution.language,
            'output': f"An unexpected error occurred: {str(e)}",
            'compilation_time': 0,
            'compilation_memory_bytes': 0,
            'execution_time': 0,
            'execution_memory_bytes': 0,
            'success': False
        }
    finally:
        if os.path.exists(execution.file_path):
            os.remove(execution.file_path)

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

def run_command(command):
    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd='/tmp')
        
        # Start monitoring memory usage
        max_memory = 0
        while process.poll() is None:
            try:
                # Get memory info
                memory_info = psutil.Process(process.pid).memory_info()
                max_memory = max(max_memory, memory_info.rss)
            except psutil.NoSuchProcess:
                # Process has already terminated
                break
            time.sleep(0.1)  # Check every 100ms
        
        # Get the output
        stdout, stderr = process.communicate(timeout=200)

        return {
            'output': stdout + stderr,
            'returncode': process.returncode,
            'max_memory_bytes': max_memory
        }
    except subprocess.TimeoutExpired:
        return {
            'output': "Command execution timed out",
            'returncode': -1,
            'max_memory_bytes': 0
        }

def lambda_handler(event, context):
    print("Received event: ", event)
    
    if event['httpMethod'] == 'POST':
        body = json.loads(event['body'])
        
        code_b64 = body['code']
        language = body['language']
        extension = LANGUAGES[language]['extension']
        
        # Decode base64 code
        code = base64.b64decode(code_b64).decode('utf-8')
        
        # Generate a unique filename
        filename = f"{language}_{uuid.uuid4()}"
        file_path = f"/tmp/{filename}" + extension

        
        # Save the code to a file
        with open(file_path, 'w') as f:
            f.write(code)
        print("File saved to: ", file_path)
        
        # Create a CodeExecution instance
        execution = CodeExecution(file_path=file_path, language=language)
        
        # Call the FastAPI route directly
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(execute_code(execution))
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    else:
        return {
            'statusCode': 405,
            'body': 'Method Not Allowed'
        }
