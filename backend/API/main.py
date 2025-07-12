from fastapi import FastAPI, HTTPException, WebSocket
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from dotenv import load_dotenv
import os
import sys
import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from chatbot.src.main import assistant

# Supabase config
load_dotenv()

PROJECT_URL = os.getenv("PROJECT_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(PROJECT_URL, SUPABASE_KEY)

api = FastAPI()

# Models

class AskSamRequest(BaseModel):
    message: str

class ChatMessage(BaseModel):
    user_id: str
    message: str
    role: str
    created_at: Optional[str] = None

# Routes

@api.get("/")
def index():
    return {"message": "Hello from the samAPI"}


@api.websocket("/api/v1/ask-sam")
async def ask_sam(websocket: WebSocket):
    await websocket.accept()
    store_id = websocket.query_params.get("store_id")

    async def send(text):
        await websocket.send_text(text)

    async def receive():
        return await websocket.receive_text()
    
    if not store_id:
        await send("Please scan the QR")
        return

    result = supabase.from_("stores_data").select("*").eq("id", store_id).execute()
    csv_url = result.data[0]["csv_file"]

    if not csv_url.strip():
        await send("Please scan the QR")
        await websocket.close()
    else:
        await assistant(send, receive, csv_url)
        await websocket.close(1000)


@api.get("/api/v1/ask-sam/messages")
def get_all_chats(user_id: str):
    try:
        result = (
            supabase
            .from_("User_chats")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api.post("/api/v1/ask-sam/messages")
def add_chats(message: ChatMessage):
    try:
        message_data = message.model_dump()
        if not message_data.get("created_at"):
            message_data["created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        result = supabase.from_("User_chats").insert(message_data).execute()
        return {"status": "success", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

