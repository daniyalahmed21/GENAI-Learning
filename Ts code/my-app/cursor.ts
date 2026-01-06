import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const system_prompt = `
You are an helpfull AI Assistant who is specialized in resolving user query.
    You work on start, plan, action, observe mode.
    For the given user query and available tools, plan the step by step execution, based on the planning,
    select the relevant tool from the available tool. and based on the tool selection you perform an action to call the tool.
    Wait for the observation and based on the observation from the tool call resolve the user query.

    Rules:
    - Follow the Output JSON Format.
    - Always perform one step at a time and wait for next input
    - Carefully analyse the user query

    Output JSON Format:
    {{
        "step": "string",
        "content": "string",
        "function": "The name of function if the step is action",
        "input": "The input parameter for the function",
    }}

    Available Tools:
    - get_weather: Takes a city name as an input and returns the current weather for the city
    - run_command: Takes a command as input to execute on system and returns ouput
    
    Example:
    User Query: What is the weather of new york?
    Output: {{ "step": "plan", "content": "The user is interseted in weather data of new york" }}
    Output: {{ "step": "plan", "content": "From the available tools I should call get_weather" }}
    Output: {{ "step": "action", "function": "get_weather", "input": "new york" }}
    Output: {{ "step": "observe", "output": "12 Degree Cel" }}
    Output: {{ "step": "output", "content": "The weather for new york seems to be 12 degrees." }}
`;

// 1. Tool Implementations
const get_weather = async (city: string) => {
  console.log("🔨 Tool Called: get_weather", city);
  const response = await fetch(`https://wttr.in/${city}?format=%C+%t`);
  return response.ok
    ? `The weather in ${city} is ${await response.text()}.`
    : "Weather data unavailable.";
};

const run_command = async (command: string) => {
  console.log("🔨 Tool Called: run_command", command);
  // Implementation for Node.js
  const { execSync } = require("child_process");
  try {
    return execSync(command).toString();
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
};

const availableTools: Record<string, Function> = { get_weather, run_command };

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    history: [],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          step: {
            type: "string",
            enum: ["plan", "action", "observe", "output"],
          },
          content: { type: "string" },
          function: { type: "string" },
          input: { type: "string" },
        },
        required: ["step"],
      },
      systemInstruction: system_prompt,
    },
  });

  let user_input = prompt("> ") || "Hello";

  let isFinished = false;
  let nextMessage = user_input;

  while (!isFinished) {
    const response = await chat.sendMessage({
      message: nextMessage,
    });

    const parsed = JSON.parse(response.text as string);

    console.log(`[${parsed.step.toUpperCase()}]:`, parsed.content || "");

    // 1️⃣ PLAN → move forward
    if (parsed.step === "plan") {
      nextMessage = "Proceed to the next step.";
    }

    // 2️⃣ ACTION → execute tool
    else if (parsed.step === "action") {
      const toolFn = availableTools[parsed.function];

      if (!toolFn) {
        nextMessage = JSON.stringify({
          step: "observe",
          content: `Tool ${parsed.function} not found`,
        });
        continue;
      }

      const result = await toolFn(parsed.input);

      // Send observation back to model
      nextMessage = JSON.stringify({
        step: "observe",
        content: result,
      });
    }

    // 3️⃣ OUTPUT → finish
    else if (parsed.step === "output") {
      console.log("✅ Final Answer:", parsed.content);
      isFinished = true;
    }
  }
}

main();
