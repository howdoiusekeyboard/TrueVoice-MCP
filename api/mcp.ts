import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { registerTools } from "../src/tools.js";

function createServer(): McpServer {
	const server = new McpServer({
		name: "truevoice-mcp",
		version: "1.0.0",
	});

	registerTools(server);

	return server;
}

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
) {
	// CORS headers - required for browser-based MCP clients
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		res.status(200).end();
		return;
	}

	// Only POST requests are supported in stateless mode
	if (req.method === "POST") {
		try {
			// Validate that we have a request body
			if (!req.body || typeof req.body !== "object") {
				res.status(400).json({
					jsonrpc: "2.0",
					error: {
						code: -32_700,
						message: "Parse error: Invalid or missing request body",
					},
					id: null,
				});
				return;
			}

			// In stateless mode, create a new instance of transport and server for each request
			// to ensure complete isolation. A single instance would cause request ID collisions
			// when multiple clients connect concurrently.
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined, // Stateless mode - no session management
			});

			const server = createServer();

			// Clean up on request close
			res.on("close", () => {
				transport.close();
				server.close();
			});

			// Connect server to transport
			await server.connect(transport);

			// Handle the MCP request
			await transport.handleRequest(req, res, req.body);
		} catch (error: any) {
			// Only send error response if headers haven't been sent yet
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: "2.0",
					error: {
						code: -32_603,
						message: error.message || "Internal server error",
					},
					id: req.body?.id || null,
				});
			}
		}
		return;
	}

	// SSE notifications not supported in stateless mode
	if (req.method === "GET") {
		res.status(405).json({
			jsonrpc: "2.0",
			error: {
				code: -32_000,
				message:
					"Method not allowed. This server runs in stateless mode and does not support SSE notifications.",
			},
			id: null,
		});
		return;
	}

	// Session termination not needed in stateless mode
	if (req.method === "DELETE") {
		res.status(405).json({
			jsonrpc: "2.0",
			error: {
				code: -32_000,
				message:
					"Method not allowed. This server runs in stateless mode without session management.",
			},
			id: null,
		});
		return;
	}

	res.status(405).json({
		error: "Method not allowed. Only POST requests are supported.",
	});
}
