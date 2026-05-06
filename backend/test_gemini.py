import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

print("API KEY:", api_key[:10] if api_key else "NOT FOUND")

genai.configure(api_key=api_key)

models = genai.list_models()

for m in models:
    print(m.name)