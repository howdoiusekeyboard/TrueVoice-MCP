import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getHumanWritingRules, MAX_CONTEXT_LENGTH } from "../src/tools.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  const raw = req.query.context;
  const context = Array.isArray(raw) ? raw[0] : raw;

  if (context && context.length > MAX_CONTEXT_LENGTH) {
    res.status(400).json({
      error: `Context parameter too long. Maximum ${MAX_CONTEXT_LENGTH} characters.`,
    });
    return;
  }

  res.status(200).send(getHumanWritingRules(context));
}
