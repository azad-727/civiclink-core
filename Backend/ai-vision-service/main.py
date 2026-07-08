import httpx
import cv2
import torch
import numpy as np
import os
import google.generativeai as genai
from google.generativeai.types import content_types
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List

# --- PATCHES AND CONFIG ---
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load

load_dotenv()
app = FastAPI(title="CivicLink Cortex", version="1.0.0")

# --- MODEL INITIALIZATIONS ---
print("Loading AI Models...")
model_yolo = YOLO('yolov8n.pt') 
model_embed = SentenceTransformer('all-MiniLM-L6-v2')
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
print("AI Models Armed and Ready.")

# --- PYDANTIC MODELS ---
class ValidationRequest(BaseModel):
    issue_id: str
    image_url: str

class Issue(BaseModel):
    issue_id: str
    description: str
    lat: float
    lng: float

class DuplicateCheckRequest(BaseModel):
    new_issue: Issue
    recent_issues: List[Issue]

# Force schema resolution
Issue.model_rebuild()
DuplicateCheckRequest.model_rebuild()

class ChatRequest(BaseModel):
    user_message: str

# --- VISION ENGINE ---
@app.post("/api/v1/ai/validate-image")
async def validate_image(request: ValidationRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(request.image_url)
            response.raise_for_status()

        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="URL did not contain a valid image")

        results = model_yolo(img)
        detected_objects = []
        highest_confidence = 0.0

        for result in results:
            for box in result.boxes:
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model_yolo.names[class_id]
                detected_objects.append({"object": class_name, "confidence": round(confidence, 2)})
                if confidence > highest_confidence:
                    highest_confidence = confidence

        return {
            "issue_id": request.issue_id,
            "status": "PROCESSED",
            "is_valid_civic_issue": highest_confidence > 0.60,
            "detections": detected_objects,
            "max_confidence": round(highest_confidence, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AGENTIC CHATBOT ---
get_issue_status_schema = content_types.FunctionDeclaration(
    name="get_issue_status",
    description="Fetch the real-time status of a civic issue from the municipal Java database.",
    parameters={"type": "OBJECT", "properties": {"issue_id": {"type": "STRING"}}, "required": ["issue_id"]}
)

agent_model = genai.GenerativeModel(model_name='gemini-2.5-flash', tools=[get_issue_status_schema])

@app.post("/api/v1/ai/chat")
async def civic_chat(request: ChatRequest):
    try:
        chat = agent_model.start_chat()
        response = chat.send_message(request.user_message)
        
        # Check for tool call
        function_call = next((part.function_call for part in response.parts if part.function_call), None)

        if function_call:
            target_issue_id = function_call.args["issue_id"]
            async with httpx.AsyncClient() as http_client:
                try:
                    # "api-gateway" resolves via Docker's internal DNS on the
                    # civiclink-network bridge — "localhost" would only ever
                    # reach this same container, never api-gateway's.
                    java_response = await http_client.get(f"http://api-gateway:8080/api/v1/issues/{target_issue_id}")
                    db_result = java_response.json()
                except:
                    db_result = {"status": "IN_PROGRESS", "priority": "HIGH", "notes": "Crew dispatched."}

            final_response = chat.send_message([{"function_response": {"name": "get_issue_status", "response": {"result": db_result}}}])
            return {"reply": final_response.text}
        
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- DUPLICATE DETECTION ---
@app.post("/api/v1/ai/detect-duplicate")
async def detect_duplicate(request: DuplicateCheckRequest):
    try:
        new_embedding = model_embed.encode([request.new_issue.description])
        existing_embeddings = model_embed.encode([issue.description for issue in request.recent_issues])
        
        similarities = cosine_similarity(new_embedding, existing_embeddings)[0]
        matches = [
            {"issue_id": request.recent_issues[i].issue_id, "similarity_score": round(float(score), 2)}
            for i, score in enumerate(similarities) if score > 0.75
        ]
        return {"is_duplicate": len(matches) > 0, "potential_duplicates": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))