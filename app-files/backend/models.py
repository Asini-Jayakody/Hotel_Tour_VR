from langchain_google_genai import ChatGoogleGenerativeAI
import os
from langchain.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
from google import genai
from google.genai import types
import wave

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY is None:
    raise ValueError("GEMINI_API_KEY environment variable not set")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-preview-05-20",
    google_api_key=GEMINI_API_KEY,
    temperature=0.1
)


embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=GEMINI_API_KEY
)


genai_client = genai.Client(api_key=GEMINI_API_KEY)

vectorestore_dir = "../hotel_details/v1_faiss"
index_name = "v1"

vectorstore = FAISS.load_local(vectorestore_dir, embeddings, index_name, allow_dangerous_deserialization=True)

