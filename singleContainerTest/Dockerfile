# Use a lighter Python image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    gcc \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js without npm
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs --no-install-recommends \
    && apt-get remove -y npm \
    && rm -rf /var/lib/apt/lists/*

# Install a minimal Rust toolchain
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Create a directory for temporary files
RUN mkdir /app/temp

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run app.py when the container launches
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]