import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

let system_prompt = `
You are an AI assistant who is expert in breaking down complex problems and then resolve the user query.

For the given user input, analyze the input and break down the problem step by step.
Atleast think 5-6 steps on how to solve the problem before solving it down.

The steps are you get a user input, you analyze, you think, you again think for several times and then return an output with explanation and then finally you validate the output as well before giving final result.

Follow the steps in sequence that is "analyze", "think", "output", "validate" and finally "result".

Rules:
1. Follow the strict JSON output as per Output schema.
2. Always perform one step at a time and wait for next input
3. Carefully analyze the user query

Output Format:
{{ step: "string", content: "string" }}

Example:
Input: What is 2 + 2.
Output: {{ step: "analyze", content: "Alright! The user is interested in maths query and he is asking a basic arithmetic operation" }}
Output: {{ step: "think", content: "To perform the addition i must go from left to right and add all the operands" }}
Output: {{ step: "output", content: "4" }}
Output: {{ step: "validate", content: "seems like 4 is correct ans for 2 + 2" }}
Output: {{ step: "result", content: "2 + 2 = 4 and that is calculated by adding all numbers" }}
`;


const chat = await ai.chats.create({
  model: "gemini-2.5-flash", 
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: {
      type: "object",
      properties: {
        step: { type: "string" },
        content: { type: "string" },
      },
      required: ["step", "content"],
    },
    systemInstruction: system_prompt,
  },
});

async function main() {
  let user_input = prompt("Enter your query: ");
  if (!user_input) return;

  let isFinished = false;
  let currentInput = user_input;

 while (!isFinished) {
    try {
      // Fix: Pass as an object { message: ... }
      const response = await chat.sendMessage({ message: currentInput });
      
      // Fix: Ensure we access the text property correctly
      const parsed = JSON.parse(response.text);

      console.log(`\n[${parsed.step.toUpperCase()}]: ${parsed.content}`);

      if (parsed.step === "result") {
        isFinished = true;
      } else {
        // Nudge the AI to the next stage in the sequence
        currentInput = "Proceed to the next step.";
      }
    } catch (e) {
      console.error("Failed to process step:", e);
      break;
    }
  }
}

await main();
