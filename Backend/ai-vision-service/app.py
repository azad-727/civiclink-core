import os
import gradio as gr
from main import app as fastapi_app

# Create a simple Gradio UI to satisfy HuggingFace's free tier requirement
def health_check():
    return "CivicLink AI Vision Service is perfectly active and running!"

demo = gr.Interface(
    fn=health_check,
    inputs=[],
    outputs="text",
    title="CivicLink AI Vision Backend",
    description="This is the AI microservice for CivicLink. It handles YOLOv8 image analysis via FastAPI."
)

# Mount the Gradio UI onto our existing FastAPI application
# This keeps all our /api/v1/... routes intact while giving HF the UI it wants
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
