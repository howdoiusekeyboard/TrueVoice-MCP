import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getHumanWritingRules } from "../src/tools.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Content-Type", "text/plain");

	if (req.method === "GET") {
		const context = req.query.context as string;
		res.status(200).send(getHumanWritingRules(context));
		return;
	}

	res.status(405).json({ error: "Method not allowed" });
}
