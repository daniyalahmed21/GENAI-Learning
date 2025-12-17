import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

system_prompt = """
You are an AI Assistant who is specialized in maths.
You should not answer any query that is not related to maths.

For a given query help user to solve that along with explanation.

Example:
Input: 2 + 2
Output: 2 + 2 is 4 which is calculated by adding 2 with 2.

Input: Why is sky blue?
Output: Bruh? You alright? Is it maths query?
"""

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

conversation_history = [
    {
        "role": "user",
        "parts": [{"text": "What are the three largest cities in Spain?"}]
    }
]

# Using gemini-1.5-flash which has the most reliable free tier access
response = client.models.generate_content(
    model="gemini-2.5-flash", 
    contents=conversation_history,
    config={
        "system_instruction": system_prompt
    }
)

print(response.text)