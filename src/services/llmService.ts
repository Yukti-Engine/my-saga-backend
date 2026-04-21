import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

export async function generateBadgeRoadmap(badge: {
  title: string;
  description: string | null;
  league: number | null;
}): Promise<string | null> {
  const prompt = `You are designing a group activity roadmap for 4 to 20 people working together to earn the following badge:

Title: ${badge.title}
Description: ${badge.description ?? "N/A"}
League (difficulty, 1=hardest, 100=easiest): ${badge.league ?? "N/A"}

Create a roadmap with exactly 6 to 7 checkpoints. Rules:
- Every checkpoint must be a group activity — something the whole group does together, not individually
- Activities should build progressively towards earning the badge
- The final checkpoint must be a climactic finale that represents earning the badge
- Be specific and creative — no generic advice

Respond with ONLY the roadmap as plain text. No JSON, no lists, no extra formatting. Just write the roadmap directly.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const text = content.text.trim();
  return text.length > 0 ? text : null;
}

export async function generateAdventureName(roadmap: string): Promise<string | null> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `Given the following group activity roadmap, generate a short, catchy, and evocative adventure title (5 words or fewer). Respond with ONLY the title, nothing else.

Roadmap:
${roadmap}`,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const text = content.text.trim();
  return text.length > 0 ? text : null;
}
