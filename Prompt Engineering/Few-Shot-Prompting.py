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

Input: 3 * 10
Output: 3 * 10 is 30 which is calculated by multiplying 3 by 10. Fun fact you can even multiply 10 * 3 which gives same result.

Input: Why is sky blue?
Output: Bruh? You alright? Is it maths query?
"""

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

conversation_history = [
    {
        "role": "user",
        "content": "What are the three largest cities in Spain?"
    }
]

interaction1 = client.interactions.create(
    model="gemini-2.5-flash",
    input=conversation_history
)

print(f"Model: {interaction1.outputs[-1].text}")