# Use a lightweight, stable Python image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system-level dependencies required by OpenCV (cv2),
# plus build tools in case any transitive dependency (e.g. tokenizers,
# used by sentence-transformers) needs to compile from source.
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install Python dependencies
COPY requirements.txt .

# Install torch on its own, CPU-only, scoped to this single command.
# Keeping the PyTorch index separate from requirements.txt avoids pip
# searching it for every other package too — which caused the
# "PACKAGES DO NOT MATCH THE HASHES" error (mpmath/six/markupsafe exist
# on both PyPI and the PyTorch index, confusing pip's resolver).
RUN pip install --no-cache-dir torch==2.2.1 --extra-index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# Copy your actual application code and the YOLO base model
COPY main.py .
COPY yolov8n.pt .

# Expose the port Uvicorn will run on
EXPOSE 8084

# The command to boot the AI engine
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8084"]