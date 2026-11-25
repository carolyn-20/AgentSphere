import os, re, asyncio
from typing import Literal
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
import httpx

app=FastAPI(title="AgentSphere Processing Gateway",version="1.0.0")
MAX_BYTES=int(os.getenv("UPLOAD_MAX_MB","10"))*1024*1024
ALLOWED={".txt",".md",".csv"}
class ModelRequest(BaseModel):
    prompt: str=Field(min_length=1,max_length=12000)
    system: str="You are a helpful assistant."
    model: str="gpt-4o-mini"
    provider: Literal["mock","openai"]="mock"
    timeout_seconds: int=Field(default=25,ge=1,le=60)
class ModelResponse(BaseModel):
    output: str
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
@app.get("/health")
def health(): return {"status":"ok","service":"processor"}
def chunk_text(text:str,size:int=900,overlap:int=120):
    if size<1 or overlap<0 or overlap>=size: raise ValueError("Invalid chunk configuration")
    words=text.split()
    chunks=[]
    start=0
    while start<len(words):
        chunks.append(" ".join(words[start:start+size]))
        if start+size>=len(words): break
        start+=size-overlap
    return chunks
@app.post("/ingest")
async def ingest(file:UploadFile=File(...)):
    name=file.filename or "upload.txt"
    ext="."+name.rsplit(".",1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED: raise HTTPException(415,"Unsupported file type; use txt, md or csv")
    raw=await file.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES: raise HTTPException(413,"File exceeds configured size limit")
    try: text=raw.decode("utf-8")
    except UnicodeDecodeError: raise HTTPException(400,"File must be UTF-8 text")
    chunks=chunk_text(text)
    return {"filename":name,"status":"PROCESSED","characters":len(text),"chunk_count":len(chunks),"chunks":[{"ordinal":i,"content":c} for i,c in enumerate(chunks)]}
@app.post("/generate",response_model=ModelResponse)
async def generate(req:ModelRequest):
    if req.provider=="mock":
        output=f"[MOCK MODEL RESPONSE] {req.prompt[:500]}"
        return ModelResponse(output=output,provider="mock",model=req.model,prompt_tokens=len(req.prompt.split()),completion_tokens=len(output.split()))
    key=os.getenv("OPENAI_API_KEY")
    if not key: raise HTTPException(503,"OpenAI provider is not configured")
    try:
        async with httpx.AsyncClient(timeout=req.timeout_seconds) as client:
            response=await client.post("https://api.openai.com/v1/chat/completions",headers={"Authorization":f"Bearer {key}"},json={"model":req.model,"messages":[{"role":"system","content":req.system},{"role":"user","content":req.prompt}]})
            response.raise_for_status()
            data=response.json()
        usage=data.get("usage",{})
        return ModelResponse(output=data["choices"][0]["message"]["content"],provider="openai",model=req.model,prompt_tokens=usage.get("prompt_tokens",0),completion_tokens=usage.get("completion_tokens",0))
    except httpx.TimeoutException: raise HTTPException(504,"Model provider timed out")
    except httpx.HTTPError: raise HTTPException(502,"Model provider request failed")
