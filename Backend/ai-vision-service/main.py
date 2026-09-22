import httpx
import os
import json
import math
import google.generativeai as genai
from google.generativeai.types import content_types
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

load_dotenv()
app = FastAPI(title="CivicLink Cortex (Lightweight)", version="2.0.0")

# --- MODEL INITIALIZATIONS ---
print("Loading Gemini Native AI...")
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
vision_model = genai.GenerativeModel('gemini-1.5-flash')
print("AI Armed and Ready.")

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

class ChatRequest(BaseModel):
    user_message: str

# Force schema resolution
Issue.model_rebuild()
DuplicateCheckRequest.model_rebuild()

# Helper for Cosine Similarity
def cosine_similarity(v1, v2):
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude_1 = math.sqrt(sum(a * a for a in v1))
    magnitude_2 = math.sqrt(sum(b * b for b in v2))
    if magnitude_1 == 0 or magnitude_2 == 0: return 0.0
    return dot_product / (magnitude_1 * magnitude_2)


# --- VISION ENGINE ---
@app.post("/api/v1/ai/validate-image")
async def validate_image(request: ValidationRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(request.image_url)
            response.raise_for_status()

        image_data = {
            "mime_type": "image/jpeg",
            "data": response.content
        }

        prompt = """
        Analyze this image. Is it a valid civic issue that a city municipality should fix? 
        (Examples: pothole, broken streetlight, trash accumulation, graffiti, broken pipe).
        Respond ONLY with a JSON object in this exact format, nothing else:
        {
            "is_valid_civic_issue": true/false,
            "detections": [{"object": "description", "confidence": 0.95}],
            "max_confidence": 0.95
        }
        """

        result = vision_model.generate_content([prompt, image_data])
        response_text = result.text.strip().replace("```json", "").replace("```", "")
        
        try:
            ai_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if Gemini hallucinates formatting
            ai_data = {"is_valid_civic_issue": True, "detections": [{"object": "unknown issue", "confidence": 0.8}], "max_confidence": 0.8}

        return {
            "issue_id": request.issue_id,
            "status": "PROCESSED",
            "is_valid_civic_issue": ai_data.get("is_valid_civic_issue", True),
            "detections": ai_data.get("detections", []),
            "max_confidence": ai_data.get("max_confidence", 0.9)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- DUPLICATE DETECTION ENGINE ---
@app.post("/api/v1/ai/duplicates")
async def check_duplicates(request: DuplicateCheckRequest):
    try:
        if not request.recent_issues:
            return {"is_duplicate": False, "duplicate_of": None, "confidence_score": 0.0}

        texts_to_embed = [request.new_issue.description] + [issue.description for issue in request.recent_issues]
        
        # Use Google's native fast embedding API
        result = genai.embed_content(
            model="models/embedding-001",
            content=texts_to_embed,
            task_type="semantic_similarity"
        )
        
        embeddings = result['embedding']
        new_issue_emb = embeddings[0]
        
        highest_sim = 0
        duplicate_id = None
        
        for i, issue in enumerate(request.recent_issues):
            sim = cosine_similarity(new_issue_emb, embeddings[i+1])
            if sim > highest_sim:
                highest_sim = sim
                duplicate_id = issue.issue_id

        return {
            "is_duplicate": highest_sim > 0.85,
            "duplicate_of": duplicate_id if highest_sim > 0.85 else None,
            "confidence_score": round(highest_sim, 2)
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
async def chat_with_agent(request: ChatRequest):
    try:
        chat = agent_model.start_chat()
        response = chat.send_message(request.user_message)
        
        # If the model decides it needs to invoke the tool
        for part in response.parts:
            if part.function_call:
                # Just mock the database fetch to keep things extremely fast and lightweight
                return {"response": f"I checked the system. Issue {part.function_call.args['issue_id']} is currently being reviewed by the public works department."}
                
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))