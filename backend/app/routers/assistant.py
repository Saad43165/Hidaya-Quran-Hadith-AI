import time
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.auth import get_current_user_id
from ..core.config import get_settings

router = APIRouter(prefix="/assistant", tags=["assistant"])
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

BASE_SYSTEM_PROMPT = """You are KitaabAI — a warm, deeply knowledgeable Islamic reading companion.
You help users understand what they are currently reading in the Quran, Hadith, and Islamic texts.

Core guidelines:
- Be concise, clear, and mobile-friendly. Avoid walls of text.
- When the user is reading a specific Surah or Hadith chapter, your responses should be grounded in that context.
- For Quranic verses: explain meaning, historical context (asbab al-nuzul where known), and practical lessons.
- For Hadith: explain what the hadith teaches, its grade if known, and how scholars apply it.
- Never fabricate specific verse numbers, hadith numbers, or scholar quotes you are not confident about.
- For fiqh rulings: give scholarly background but always recommend consulting a local qualified scholar for personal decisions.
- You are a reading companion and teacher, not a mufti issuing fatwas.
- When asked about Arabic words or grammar, explain the root and meaning clearly.
- Respond in the same language the user writes in (English, Urdu, or Arabic).
"""

def build_context_prompt(reading_context: Optional[dict]) -> str:
    """Build a context block telling the AI what the user is currently reading."""
    if not reading_context:
        return ""
    ctx_type = reading_context.get("type")
    if ctx_type == "surah":
        surah_num = reading_context.get("surahNumber", "")
        surah_name = reading_context.get("surahName", "")
        ayah_num = reading_context.get("ayahNumber", "")
        ayah_text = reading_context.get("arabicText", "")
        translation = reading_context.get("translation", "")
        parts = [f"\n\n[READING CONTEXT — The user is currently reading:]",
                 f"Surah: {surah_name} (Surah {surah_num})"]
        if ayah_num:
            parts.append(f"Ayah: {ayah_num}")
        if ayah_text:
            parts.append(f"Arabic text: {ayah_text}")
        if translation:
            parts.append(f"Translation: {translation}")
        parts.append("\nTailor your response to help them understand THIS specific content. "
                     "If they ask a general question, connect it back to this surah/ayah where relevant.")
        return "\n".join(parts)
    elif ctx_type == "hadith":
        collection = reading_context.get("collectionName", "")
        chapter = reading_context.get("chapterName", "")
        hadith_num = reading_context.get("hadithNumber", "")
        hadith_text = reading_context.get("hadithText", "")
        parts = [f"\n\n[READING CONTEXT — The user is currently reading:]",
                 f"Hadith Collection: {collection}"]
        if chapter:
            parts.append(f"Chapter/Kitab: {chapter}")
        if hadith_num:
            parts.append(f"Hadith Number: {hadith_num}")
        if hadith_text:
            parts.append(f"Hadith text: {hadith_text[:300]}...")
        parts.append("\nHelp them understand this specific hadith, its chain, application, and lessons.")
        return "\n".join(parts)
    return ""


class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    createdAt: int


class ReadingContext(BaseModel):
    type: str                          # "surah" | "hadith" | "juz" | "dua"
    surahNumber: Optional[int] = None
    surahName: Optional[str] = None
    ayahNumber: Optional[int] = None
    arabicText: Optional[str] = None
    translation: Optional[str] = None
    collectionName: Optional[str] = None
    chapterName: Optional[str] = None
    hadithNumber: Optional[int] = None
    hadithText: Optional[str] = None


class ChatRequest(BaseModel):
    history: list[ChatMessage]
    message: str
    context: Optional[ReadingContext] = None   # what the user is currently reading
    language: Optional[str] = "en"


def _build_messages(history: list[ChatMessage], message: str, context: Optional[ReadingContext]) -> list[dict]:
    context_block = build_context_prompt(context.model_dump() if context else None)
    system = BASE_SYSTEM_PROMPT + context_block
    msgs = [{"role": "system", "content": system}]
    for m in history[-20:]:
        msgs.append({"role": "assistant" if m.role == "assistant" else "user", "content": m.content})
    msgs.append({"role": "user", "content": message})
    return msgs


@router.post("/chat", response_model=ChatMessage)
async def chat(request: ChatRequest, uid: str = Depends(get_current_user_id)) -> ChatMessage:
    settings = get_settings()
    if not settings.groq_api_key:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,
                            detail="GROQ_API_KEY is not set in backend/.env. Get a free key at console.groq.com.")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_CHAT_URL,
                headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
                json={"model": settings.groq_model,
                      "messages": _build_messages(request.history, request.message, request.context),
                      "temperature": 0.4, "max_tokens": 1024},
            )
        response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="The assistant took too long. Please try again.")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=502, detail="Invalid Groq API key.")
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limited. Please wait a moment.")
        raise HTTPException(status_code=502, detail=f"AI provider error ({e.response.status_code}).")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach the AI provider.")

    try:
        reply_text = response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected response from AI provider.")

    return ChatMessage(id=str(uuid.uuid4()), role="assistant",
                       content=reply_text, createdAt=int(time.time() * 1000))


# ── Contextual prompts — called when user OPENS a page ──────────────────────

class ContextPromptRequest(BaseModel):
    context: ReadingContext


class ContextPromptResponse(BaseModel):
    prompt: str


@router.post("/context-prompt", response_model=ContextPromptResponse)
async def get_context_prompt(request: ContextPromptRequest, uid: str = Depends(get_current_user_id)):
    """
    Returns a suggested opening question/insight for the AI to show
    when the user opens a new Surah or Hadith — proactive, not reactive.
    """
    settings = get_settings()
    if not settings.groq_api_key:
        return ContextPromptResponse(prompt="")

    ctx = request.context
    if ctx.type == "surah" and ctx.surahName:
        user_msg = (f"I just opened Surah {ctx.surahName} ({ctx.surahNumber}). "
                    f"In 2 sentences max, give me one fascinating insight about this surah "
                    f"that will make me want to read it carefully. Be direct, no preamble.")
    elif ctx.type == "hadith" and ctx.chapterName:
        user_msg = (f"I just opened the chapter on '{ctx.chapterName}' in {ctx.collectionName}. "
                    f"In 2 sentences, tell me why this topic matters and what I should look for as I read.")
    else:
        return ContextPromptResponse(prompt="")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GROQ_CHAT_URL,
                headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
                json={"model": settings.groq_model,
                      "messages": [{"role": "system", "content": BASE_SYSTEM_PROMPT},
                                   {"role": "user", "content": user_msg}],
                      "temperature": 0.6, "max_tokens": 120},
            )
        response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"]
        return ContextPromptResponse(prompt=text)
    except Exception:
        return ContextPromptResponse(prompt="")
