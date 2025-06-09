from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from models import llm, vectorstore, genai_client
from prompts import prompt_template
from langchain.chains import RetrievalQA
from google.genai import types
from fastapi.responses import StreamingResponse
from utils import l16_to_wav
from google.cloud import speech
from fastapi.responses import JSONResponse
import base64

app = FastAPI()


class AvatarRequest(BaseModel):
    question: str

class UserSpeechRequest(BaseModel):
    blob: bytes


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
    try:
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

        audio_bytes = wav_stream.read()  

        return audio_bytes

        # return StreamingResponse(wav_stream, media_type="audio/wav")
    
    except Exception as e:
        print(f"Error generating audio response: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    


async def speech_to_text(request):
    audio_bytes = await request

    if not audio_bytes or len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio data is missing or too small.")

    client = speech.SpeechClient.from_service_account_json(
        r"E:\Exe\Hotel System\test\project-title\hotel-tour-vr-72a845e2967a.json"
    )

    audio = speech.RecognitionAudio(content=audio_bytes)
    config = speech.RecognitionConfig(
        # encoding=speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
        # sample_rate_hertz=48000,
        language_code="en-US",
        enable_automatic_punctuation=True
    )

    try:
        response = client.recognize(config=config, audio=audio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech recognition failed: {str(e)}")

    transcript = " ".join(result.alternatives[0].transcript for result in response.results)

    if not transcript.strip():
        raise HTTPException(status_code=422, detail="No speech detected or not understandable.")

    print("Transcription result:", transcript.strip())
    # return JSONResponse({"transcribed_text": transcript.strip()})
    return transcript.strip()



@app.post("/avatar_message")
async def avatar_response_to_message(request: AvatarRequest):
    try:
        # Generate text response
        text_response = await generate_avatar_text_response(request.question)
        print(f"Generated text response: {text_response}")
        # Generate audio response
        audio_response = await generate_audio_response(text_response)
        
        return audio_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.post("/avatar_speech")
async def avatar_response_to_speech(request: Request):
    try:
        # Convert speech to text
        transcribed_text = await speech_to_text(request.body())
        print(f"Transcribed text: {transcribed_text}")

        # Generate text response
        text_response = await generate_avatar_text_response(transcribed_text)
        print(f"Generated text response: {text_response}")

        # Generate audio response
        # audio_response = await generate_audio_response(text_response)
        audio_bytes = await generate_audio_response(text_response)
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        # return audio_response
        return JSONResponse({
            "text_response": text_response,
            "audio_response": audio_base64
        })
    
    except HTTPException as e:
        raise e


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8080"],  # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)