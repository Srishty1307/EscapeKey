import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the chat model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Create a chat session service
export async function startChatSession() {
  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello, I'm using the EscapeKey app and might need assistance."}]
        },
        {
          role: "model",
          parts: [{ text: "I'm here to help you. If you're in an emergency situation, please use the SOS button or contact emergency services immediately. How can I assist you today?"}]
        },
      ],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });
    
    return chat;
  } catch (error) {
    console.error("Error starting chat session:", error);
    throw error;
  }
}

// Send a message to the chat session
export async function sendChatMessage(chat, message) {
  try {
    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}