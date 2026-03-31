import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyzeSlop, MAX_TEXT_LENGTH } from "../src/tools.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text } = req.body;

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "No text provided for analysis" });
    return;
  }

  if (text.length > MAX_TEXT_LENGTH) {
    res
      .status(413)
      .json({ error: "Text too large. Maximum 100,000 characters." });
    return;
  }

  try {
    const { findings } = analyzeSlop(text);

    res.status(200).json({
      hasSlop: findings.length > 0,
      findings,
      message:
        findings.length > 0
          ? "AI slop detected. Revise the text to sound more human and natural."
          : "No obvious AI slop detected. Text appears human-like.",
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}
