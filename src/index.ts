#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools, VERSION } from "./tools.js";

const server = new McpServer({
  name: "truevoice-mcp",
  version: VERSION,
});

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TrueVoice MCP server running on stdio");

  const shutdown = async () => {
    try {
      await server.close();
    } catch (err) {
      console.error("Shutdown error:", err);
      process.exit(1);
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
