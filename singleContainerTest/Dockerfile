FROM public.ecr.aws/lambda/python:3.9

# Install system dependencies and Node.js
RUN yum update -y && yum install -y gcc && \
    curl -sL https://rpm.nodesource.com/setup_14.x | bash - && \
    yum install -y nodejs && \
    yum clean all && \
    node --version && npm --version

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Set the working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy function code and dependencies
COPY app.py ${LAMBDA_TASK_ROOT}
COPY containers.json ${LAMBDA_TASK_ROOT}
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create a directory for temporary files
RUN mkdir ${LAMBDA_TASK_ROOT}/temp

# Set the CMD to your handler
CMD [ "app.lambda_handler" ]