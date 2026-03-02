import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

async function run() {
  try {
    const res = await model.generateContent("Genera un JSON con nombre y edad");
    console.log(res.response.text());
  } catch (e) {
    console.error("ERRORRR:", e);
  }
}
run();
