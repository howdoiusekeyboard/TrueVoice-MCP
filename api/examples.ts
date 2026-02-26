import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSlopExamples } from "../src/tools.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Content-Type", "text/plain");

	if (req.method !== "GET") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const category = (req.query.category as string) || "all";

	res.status(200).send(getSlopExamples(category));
}
