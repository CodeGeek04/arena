from flask import Flask, request, jsonify
import os
import time
import subprocess
import logging

logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)

UPLOAD_DIRECTORY = "/app/uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@app.route('/execute', methods=['POST'])
def execute_code():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    language = get_language_from_extension(file.filename)
    if not language:
        return jsonify({'error': 'Unsupported file type'}), 400

    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    file.save(file_path)
    
    logging.debug(f"File saved to: {file_path}")
    with open(file_path, 'r') as f:
        logging.debug(f"File contents:\n{f.read()}")

    try:
        start_time = time.time()
        result = run_in_container(language, file_path)
        execution_time = time.time() - start_time

        return jsonify({
            'output': result,
            'execution_time': execution_time
        })
    finally:
        os.remove(file_path)

def get_language_from_extension(filename):
    extensions = {'.py': 'python', '.js': 'javascript', '.rs': 'rust'}
    return extensions.get(os.path.splitext(filename)[1])

def run_in_container(language, file_path):
    container_name = f"arena-{language}-runner-1"
    file_name = os.path.basename(file_path)

    commands = {
        'python': f"python /code/{file_name}",
        'javascript': f"node /code/{file_name}",
        'rust': f"rustc /code/{file_name} -o /code/script && ls -l /code && /code/script"
    }

    docker_command = f"docker exec {container_name} sh -c '{commands[language]}'"
    
    logging.debug(f"Running docker command: {docker_command}")
    
    result = subprocess.run(docker_command, shell=True, capture_output=True, text=True)
    logging.debug(f"Docker command output: {result.stdout}")
    logging.debug(f"Docker command error: {result.stderr}")
    
    return result.stdout + result.stderr

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)