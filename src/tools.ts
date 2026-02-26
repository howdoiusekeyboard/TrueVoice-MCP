import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ANTI_SLOP_RULES } from "./rules.js";

/** Match a phrase in text. Single words use word boundaries to avoid partial matches. */
function matchesPhrase(textLower: string, phrase: string): boolean {
  if (phrase.includes(" ")) {
    return textLower.includes(phrase);
  }
  return new RegExp(`\\b${phrase}\\b`).test(textLower);
}

/**
 * Returns the human writing rules, optionally with context-specific guidance appended.
 */
export function getHumanWritingRules(context?: string): string {
  let rules = ANTI_SLOP_RULES;

  if (context) {
    rules += `\n\n## Context-Specific Guidance\n\nYou are writing: ${context}\n\nAdapt these rules to fit this context while maintaining human-like writing.`;
  }

  return rules;
}

/**
 * Analyzes text for AI slop indicators. Returns findings and a formatted result string.
 */
export function analyzeSlop(text: string): {
  findings: string[];
  resultText: string;
} {
  const findings: string[] = [];
  const textLower = text.toLowerCase();
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // 1. AI cliché phrases (union of both stdio and HTTP lists)
  const slopPhrases = [
    "it's worth noting",
    "it's important to note",
    "as previously mentioned",
    "in conclusion",
    "in summary",
    "delve into",
    "dive into",
    "dive deep",
    "let's explore",
    "unpack",
    "multifaceted",
    "holistic approach",
    "holistic",
    "leverage",
    "paradigm shift",
    "synergy",
    "robust solution",
    "robust",
    "cutting-edge",
    "state-of-the-art",
    "in today's digital age",
    "game changer",
    "unlock the potential",
    "landscape",
    "utilize",
    "seamless",
    "ecosystem",
    "journey",
    "revolutionize",
    "transform",
    "empower",
    "facilitate",
  ];

  const foundPhrases = slopPhrases.filter((phrase) =>
    matchesPhrase(textLower, phrase)
  );
  if (foundPhrases.length > 0) {
    findings.push(
      `Overused Phrases: Found AI clichés - ${foundPhrases.join(", ")}`
    );
  }

  // 2. Repetitive sentence starts (threshold >= 3, filter words > 3 chars)
  const startCounts: Record<string, number> = sentences.reduce(
    (acc, sentence) => {
      const firstWord = sentence.trim().split(/\s+/)[0]?.toLowerCase();
      if (firstWord && firstWord.length > 3) {
        acc[firstWord] = (acc[firstWord] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const repetitiveStarts = Object.entries(startCounts)
    .filter(([_, count]) => (count as number) >= 3)
    .map(([word]) => word);

  if (repetitiveStarts.length > 0) {
    findings.push(
      `Repetition: Formulaic sentence starts - ${repetitiveStarts.join(", ")}`
    );
  }

  // 3. Verbosity check (avg words per sentence, with guard)
  if (sentences.length > 0) {
    const avgWordsPerSentence = words.length / sentences.length;
    if (avgWordsPerSentence > 25) {
      findings.push(
        `Verbosity: Average ${avgWordsPerSentence.toFixed(1)} words/sentence (target: 15-20)`
      );
    }
  }

  // 4. Hedging language (8 words, threshold > 2)
  const hedgingWords = [
    "perhaps",
    "possibly",
    "might",
    "could potentially",
    "somewhat",
    "fairly",
    "relatively",
    "generally",
  ];
  const foundHedging = hedgingWords.filter((word) =>
    matchesPhrase(textLower, word)
  );
  if (foundHedging.length > 2) {
    findings.push(
      `Hedging: Excessive uncertainty language - ${foundHedging.join(", ")}`
    );
  }

  // 5. Word complexity pairs (simple replacements)
  const complexityPairs = [
    { complex: "utilize", simple: "use" },
    { complex: "facilitate", simple: "help" },
    { complex: "demonstrate", simple: "show" },
    { complex: "indicate", simple: "show" },
    { complex: "commence", simple: "start" },
  ];

  const foundComplex = complexityPairs
    .filter((pair) => matchesPhrase(textLower, pair.complex))
    .map((pair) => `"${pair.complex}" → "${pair.simple}"`);

  if (foundComplex.length > 0) {
    findings.push(
      `Word Complexity: Unnecessarily formal - ${foundComplex.join(", ")}`
    );
  }

  // 6. Formal connectives (threshold >= 2)
  const formalConnectives = [
    "furthermore",
    "moreover",
    "thus",
    "hence",
    "whereby",
    "wherein",
    "heretofore",
    "aforementioned",
    "notwithstanding",
  ];
  const foundFormal = formalConnectives.filter((word) =>
    matchesPhrase(textLower, word)
  );
  if (foundFormal.length >= 2) {
    findings.push(
      `Formal Connectives: Unnecessarily formal - ${foundFormal.join(", ")}`
    );
  }

  // 7. Lexical density (< 0.4 unique-word ratio)
  const uniqueWords = new Set(words.map((w: string) => w.toLowerCase()));
  const lexicalDensity = uniqueWords.size / words.length;
  if (lexicalDensity < 0.4) {
    findings.push(
      `Density: Low information content (${(lexicalDensity * 100).toFixed(0)}% unique words)`
    );
  }

  // 8. List-heavy structure (bullets > 5 or numbered > 5)
  const bulletPoints = (text.match(/^[\s]*[-•*]/gm) || []).length;
  const numberedLists = (text.match(/^[\s]*\d+\./gm) || []).length;
  if (bulletPoints > 5 || numberedLists > 5) {
    findings.push(
      `Structure: List-heavy (${bulletPoints} bullets, ${numberedLists} numbered)`
    );
  }

  // 9. Bias/generic language (5 phrases, threshold >= 3)
  const genericPhrases = [
    "in general",
    "typically",
    "usually",
    "often",
    "sometimes",
  ];
  const foundGeneric = genericPhrases.filter((phrase) =>
    matchesPhrase(textLower, phrase)
  );
  if (foundGeneric.length >= 3) {
    findings.push(
      `Bias: Over-standardized language - ${foundGeneric.join(", ")}`
    );
  }

  const resultText =
    findings.length > 0
      ? `## AI Slop Analysis\n\n${findings.map((f) => `- ${f}`).join("\n")}\n\n**Recommendation:** Revise to be more concise, direct, and natural. Categories based on research (β=0.05-0.06 correlation with human perception).`
      : "No AI slop detected. Text appears natural and concise.";

  return { findings, resultText };
}

/**
 * Returns slop examples for the given category (or all).
 */
export function getSlopExamples(category?: string): string {
  const cat = category || "all";
  let examples = "# AI Slop Examples to Avoid\n\n";

  if (cat === "phrases" || cat === "all") {
    examples += "## Overused AI Phrases\n\n";
    examples += "Never use:\n";
    examples += `- "delve into" → use "explore" or "examine"\n`;
    examples += `- "leverage" → use "use"\n`;
    examples += `- "utilize" → use "use"\n`;
    examples += `- "it's important to note that" → just state it\n`;
    examples += `- "in today's digital age" → be specific or omit\n`;
    examples += `- "game changer" → be specific about impact\n`;
    examples += `- "robust" → use concrete descriptors\n`;
    examples += `- "seamless" → describe actual experience\n`;
    examples += `- "ecosystem" → unless discussing biology\n\n`;
  }

  if (cat === "structure" || cat === "all") {
    examples += "## Structural Patterns to Avoid\n\n";
    examples += "Don't:\n";
    examples += "- Start every sentence the same way\n";
    examples += `- Use "Firstly, Secondly, Thirdly" unless truly needed\n`;
    examples += "- Make everything a bulleted list\n";
    examples += `- Begin with "Certainly!" or "Absolutely!"\n`;
    examples += "- End with summary of what you just said\n\n";
    examples += "Do:\n";
    examples += "- Vary sentence structure naturally\n";
    examples += "- Mix short and long sentences\n";
    examples += "- Use paragraphs for flow, lists when truly helpful\n";
    examples += "- Get straight to the point\n\n";
  }

  if (cat === "tone" || cat === "all") {
    examples += "## Tone Issues\n\n";
    examples += "Too AI-like:\n";
    examples += `"It's worth noting that one should carefully consider..."\n\n`;
    examples += "Human-like:\n";
    examples += `"Consider..."\n\n`;
    examples += "Over-hedging:\n";
    examples += `"This might potentially be somewhat useful in certain scenarios..."\n\n`;
    examples += "Direct:\n";
    examples += `"This is useful when..."\n\n`;
  }

  if (cat === "all") {
    examples += "## The Golden Test\n\n";
    examples += `Ask yourself: "Would a human actually write this?"\n`;
    examples +=
      "If it sounds like corporate jargon or a press release, revise it.\n";
  }

  return examples;
}

/**
 * Registers all 3 TrueVoice tools on the given MCP server instance.
 */
export function registerTools(server: McpServer): void {
  server.registerTool(
    "get_human_writing_rules",
    {
      title: "Get Human Writing Rules",
      description:
        "Get comprehensive rules for writing like a human and avoiding AI slop. Use these rules as system-level instructions for any text generation task.",
      inputSchema: {
        context: z
          .string()
          .optional()
          .describe(
            "Optional: The context or type of writing (e.g., 'technical documentation', 'casual email', 'blog post')"
          ),
      },
    },
    async ({ context }) => {
      return {
        content: [{ type: "text", text: getHumanWritingRules(context) }],
      };
    }
  );

  server.registerTool(
    "check_for_slop",
    {
      title: "Check for AI Slop",
      description:
        "Analyze text for AI slop indicators across three categories: Information Utility, Style Quality, and Structure. Returns specific patterns to avoid.",
      inputSchema: {
        text: z.string().describe("The text to analyze for AI slop indicators"),
      },
    },
    async ({ text }) => {
      const { resultText } = analyzeSlop(text);
      return {
        content: [{ type: "text", text: resultText }],
      };
    }
  );

  server.registerTool(
    "get_slop_examples",
    {
      title: "Get Slop Examples",
      description:
        "Get examples of common AI slop phrases and patterns to avoid, categorized by type.",
      inputSchema: {
        category: z
          .enum(["phrases", "structure", "tone", "all"])
          .optional()
          .describe("The category of slop examples to retrieve"),
      },
    },
    async ({ category }) => {
      return {
        content: [{ type: "text", text: getSlopExamples(category) }],
      };
    }
  );
}
