import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSlopExamples, SLOP_CATEGORIES } from "../src/tools.js";

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

  if (!SLOP_CATEGORIES.includes(category as (typeof SLOP_CATEGORIES)[number])) {
    res.status(400).json({
      error: `Invalid category "${category}". Must be one of: ${SLOP_CATEGORIES.join(", ")}`,
    });
    return;
  }

  res.status(200).send(getSlopExamples(category));
}
