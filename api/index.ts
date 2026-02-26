import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Root endpoint - server info
  if (req.method === "GET") {
    res.status(200).json({
      name: "TrueVoice MCP Server",
      version: "1.0.0",
      status: "running",
      description: "Eliminates AI slop based on academic research",
      tools: ["get_human_writing_rules", "check_for_slop", "get_slop_examples"],
      usage: {
        get_rules: "GET /api/rules",
        check_text: 'POST /api/check with {"text": "your text"}',
        get_examples: "GET /api/examples?category=phrases",
      },
      github: "https://github.com/howdoiusekeyboard/truevoice-mcp",
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
