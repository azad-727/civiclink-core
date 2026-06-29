import httpx
import cv2
import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel

_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load

app = FastAPI(title="CivicLink", version="1.0.0")

# torch.serialization.add_safe_globals([DetectionModel])

# 1. Load the AI Model globally so it stays in RAM and doesn't reload on every request
print("Loading AI Model...")
model = YOLO('yolov8n.pt') 
print("AI Model Armed and Ready.")

class ValidationRequest(BaseModel):
    issue_id: str
    image_url: str

@app.post("/api/v1/ai/validate-image")
async def validate_image(request: ValidationRequest):
    try:
        # 2. Fetch the image directly from the AWS S3 URL asynchronously
        async with httpx.AsyncClient() as client:
            response = await client.get(request.image_url)
            response.raise_for_status()

        # 3. Convert the downloaded bytes directly into an OpenCV matrix in RAM
        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="URL did not contain a valid image")

        # 4. RUN AI INFERENCE
        results = model(img)
        
        # 5. Extract the AI's findings
        detected_objects = []
        highest_confidence = 0.0

        for result in results:
            boxes = result.boxes
            for box in boxes:
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model.names[class_id]

                detected_objects.append({
                    "object": class_name,
                    "confidence": round(confidence, 2)
                })
                
                if confidence > highest_confidence:
                    highest_confidence = confidence

        # 6. The Business Logic Verdict
        # If the AI is at least 60% confident it saw something recognizable, we flag it for review
        is_valid = highest_confidence > 0.60

        return {
            "issue_id": request.issue_id,
            "status": "PROCESSED",
            "is_valid_civic_issue": is_valid,
            "detections": detected_objects,
            "max_confidence": round(highest_confidence, 2)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))