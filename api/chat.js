
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect the public endpoint with a private access code.
  const accessCode = process.env.JARVIS_ACCESS_CODE;

  if (
    !accessCode ||
    req.headers["x-jarvis-access-code"] !== accessCode
  ) {
    return res.status(401).json({ error: "Access denied" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "AI is not configured" });
  }

  try {
    const messages = req.body?.messages;

    if (
      !Array.isArray(messages) ||
      messages.length < 1 ||
      messages.length > 12
    ) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    for (const m of messages) {
      if (
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length > 4000
      ) {
        return res.status(400).json({ error: "Invalid message format" });
      }
    }

    const ai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await ai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-astra",
      instructions: `
        You are JARVIS, a professional personal AI assistant.
        Speak naturally in Hindi or English.
        Be intelligent, friendly and concise.
        Never pretend to execute computer commands.
        Never request passwords or secret keys.
        Ask for confirmation before sensitive actions.
      `,
      input: messages
    });

    return res.status(200).json({
      text: response.output_text
    });

  } catch (error) {
    console.error("JARVIS error:", error.message);

    return res.status(500).json({
      error: "JARVIS AI is temporarily unavailable."
    });
  }
}
