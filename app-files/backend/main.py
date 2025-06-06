from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from models import llm, vectorstore, genai_client
from prompts import prompt_template
from langchain.chains import RetrievalQA
from google.genai import types
from fastapi.responses import StreamingResponse
from utils import l16_to_wav

app = FastAPI()


class AvatarRequest(BaseModel):
    question: str


@app.get('/greet')
async def hello():
    return {"message": "Hello, World"}


async def generate_avatar_text_response(query):
    qa_chain = RetrievalQA.from_llm(
        llm=llm,
        prompt=prompt_template,
        retriever=vectorstore.as_retriever(),
        return_source_documents=True
    )
    response = qa_chain({"query": query})
    response_text = response['result']

    return response_text


async def generate_audio_response(text):
    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name='Kore',
                    )
                )
            ),
        )
        )

    raw_pcm = response.candidates[0].content.parts[0].inline_data.data
    wav_stream = l16_to_wav(raw_pcm)
    
    return StreamingResponse(wav_stream, media_type="audio/wav")



@app.post("/avatar")
async def avatar_response(request: AvatarRequest):
    try:
        # Generate text response
        text_response = await generate_avatar_text_response(request.question)
        print(f"Generated text response: {text_response}")
        # Generate audio response
        audio_response = await generate_audio_response(text_response)
        
        return audio_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8080"],  # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)