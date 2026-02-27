import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSlopExamples } from "../src/tools.js";

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
  const raw = req.query.category;
  const category = (Array.isArray(raw) ? raw[0] : raw) || "all";

  res.status(200).send(getSlopExamples(category));
}
