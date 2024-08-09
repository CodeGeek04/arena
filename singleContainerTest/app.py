import json
import subprocess
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from mangum import Mangum
import tempfile

app = FastAPI()

def execute_code(language: str, code: str):
    file_extension = {
        'python': 'py',
        'javascript': 'js',
        'rust': 'rs',
        'cpp': 'cpp'
    }.get(language, 'txt')
    
    with tempfile.NamedTemporaryFile(suffix=f'.{file_extension}', mode='w+', delete=False) as temp_file:
        temp_file.write(code)
        filename = temp_file.name
    
    try:
        if language == 'python':
            cmd = ['python', filename]
        elif language == 'javascript':
            cmd = ['node', filename]
        elif language == 'rust':
            compile_cmd = ['rustc', filename, '-o', f'{filename}.out']
            run_cmd = [f'{filename}.out']
            return compile_and_run(compile_cmd, run_cmd)
        elif language == 'cpp':
            compile_cmd = ['g++', filename, '-o', f'{filename}.out']
            run_cmd = [f'{filename}.out']
            return compile_and_run(compile_cmd, run_cmd)
        else:
            raise HTTPException(status_code=400, detail="Unsupported language")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return {
            'output': result.stdout,
            'error': result.stderr,
            'exit_code': result.returncode
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Execution timed out")
    finally:
        os.unlink(filename)
        if language in ['rust', 'cpp']:
            os.unlink(f'{filename}.out')

def compile_and_run(compile_cmd, run_cmd):
    try:
        compile_result = subprocess.run(compile_cmd, capture_output=True, text=True)
        if compile_result.returncode != 0:
            return {
                'compile_error': compile_result.stderr,
                'output': '',
                'error': '',
                'exit_code': compile_result.returncode
            }
        
        run_result = subprocess.run(run_cmd, capture_output=True, text=True, timeout=10)
        return {
            'output': run_result.stdout,
            'error': run_result.stderr,
            'exit_code': run_result.returncode
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Execution timed out")

@app.post("/execute")
async def execute(file: UploadFile = File(...), language: str = None):
    if not language:
        raise HTTPException(status_code=400, detail="Language must be specified")
    
    content = await file.read()
    code = content.decode('utf-8')
    
    try:
        result = execute_code(language, code)
        return JSONResponse(content=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mangum handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)