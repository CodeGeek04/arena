import requests
import json
import base64
import os

def read_file(file_path):
    with open(file_path, 'r') as file:
        return file.read()

def test_lambda_function(file_path, language):
    url = "https://5ahzbs3hue.execute-api.ap-south-1.amazonaws.com/prod"
    
    # Read code from file
    code = read_file(file_path)
    
    # Encode code to base64
    code_b64 = base64.b64encode(code.encode('utf-8')).decode('utf-8')
    
    # Get file extension
    _, extension = os.path.splitext(file_path)
    
    payload = {
        "httpMethod": "POST",
        "body": json.dumps({
            "code": code_b64,
            "language": language,
            "extension": extension
        })
    }
    
    response = requests.post(url, json=payload)
    
    print(f"Testing {language} code from {file_path}")
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
    print("\n" + "="*50 + "\n")

# Test cases
test_cases = [
    {
        "language": "python",
        "file": "../examples/python-ex.py"
    },
    {
        "language": "javascript",
        "file": "../examples/javascript-ex.js"
    },
    {
        "language": "rust",
        "file": "../examples/rust-ex.rs"
    },
    {
        "language": "cpp",
        "file": "../examples/cpp-ex.cpp"
    }
]

for case in test_cases:
    if os.path.exists(case['file']):
        test_lambda_function(case['file'], case['language'])
    else:
        print(f"File not found: {case['file']}")
        print("\n" + "="*50 + "\n")