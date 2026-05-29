import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

export async function generateBadgeRoadmap(badge: {
  title: string;
  description: string | null;
  league: number | null;
}): Promise<string | null> {
  const roadmap = await generateRoadmapCheckpoints(badge);
  if (!roadmap) return null;

  const challenge = await generateClimaticChallenge(badge, roadmap);
  if (!challenge) return roadmap;

  return roadmap + "\n\n---\n\n" + challenge;
}

async function generateRoadmapCheckpoints(badge: {
  title: string;
  description: string | null;
  league: number | null;
}): Promise<string | null> {
  const prompt = `You are designing a practical group activity roadmap for 5 to 20 people working together to earn the following badge:

Title: ${badge.title}
Description: ${badge.description ?? "N/A"}
League (difficulty, 1=hardest, 100=easiest): ${badge.league ?? "N/A"}

Create a roadmap with exactly 4 to 5 checkpoints. Rules:
- Every checkpoint must be a group activity — something the whole group does together, not individually
- Each checkpoint must state a concrete task, problem to solve, or measurable goal — not vague descriptions of what the group "explores" or "discusses"
- Write actionable instructions: what they build, what they solve, what the deliverable is, and how success is measured
- Activities should build progressively towards earning the badge, each one harder than the last
- Be specific and creative — no generic advice like "brainstorm ideas" or "reflect on learnings"

Respond with ONLY the roadmap as plain text. No JSON, no lists, no extra formatting, no heading or title. Just write the roadmap directly.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const text = content.text.trim();
  return text.length > 0 ? text : null;
}

async function generateClimaticChallenge(badge: {
  title: string;
  description: string | null;
  league: number | null;
}, roadmap: string): Promise<string | null> {
  const prompt = `You are designing the final climactic challenge for a group of 5 to 20 people who have completed the following roadmap to earn a badge.

Badge: ${badge.title}
Description: ${badge.description ?? "N/A"}
League (difficulty, 1=hardest, 100=easiest): ${badge.league ?? "N/A"}

Completed roadmap:
${roadmap}

Now design one final challenge that ties together everything they built in the roadmap. Rules:
- It must be a practical, hands-on group task — not a fictional scenario or roleplay
- State exactly what they must build, solve, or deliver as a group
- Define clear success criteria — how do they know they passed?
- It should be the hardest task on the roadmap, requiring skills from all previous checkpoints
- No storytelling, no fictional premises, no "imagine you are..." setups — just the real challenge

Respond with ONLY the challenge as plain text. No JSON, no lists, no extra formatting, no heading or title. Just write the challenge directly.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const text = content.text.trim();
  return text.length > 0 ? text : null;
}

export type EventSummary = {
  activity: string;
  timing: Date;
  adventureName: string;
  guideUsername: string;
  expertUsername: string | null;
  otherAdventurers: string[];
  chatExcerpt: string | null;
};

function formatEvents(events: EventSummary[]): string {
  if (events.length === 0) return "No new events recorded.";
  return events.map((e) => {
    const date = e.timing.toDateString();
    const others = e.otherAdventurers.length
      ? `Other adventurers: ${e.otherAdventurers.map((u) => `@${u}`).join(", ")}`
      : "No other adventurers";
    const expert = e.expertUsername ? `\n  Expert: @expert:${e.expertUsername}` : "";
    const chat = e.chatExcerpt ? `\n  Chat excerpt:\n${e.chatExcerpt.split("\n").map(l => `    ${l}`).join("\n")}` : "";
    return `Adventure: "${e.adventureName}" (${date})\n  Guide: @guide:${e.guideUsername}${expert}\n  Activity: ${e.activity}\n  ${others}${chat}`;
  }).join("\n\n");
}

export type Theme = { name: string; description: string | null };

export async function generateIntroduction(username: string, bookTitle: string, theme: Theme): Promise<string | null> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `Write the introduction/prologue for an adventure chronicle titled "${bookTitle}", following the journey of @${username}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

Write 3-4 paragraphs that:
- Introduce @${username} as a budding adventurer stepping into this world
- Paint the world they inhabit with atmosphere rooted in the ${theme.name} setting
- End on a note of anticipation — adventures are on the horizon

Rules:
- Refer to the adventurer as @${username} throughout
- Third-person narrative style consistent with the ${theme.name} world
- Only output the prose, nothing else`,
    }],
  });
  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const text = content.text.trim();
  return text.length > 0 ? text : null;
}

export async function generateChapterOpening(params: {
  username: string;
  bookTitle: string;
  chapter: number;
  previousConclusion: string;
  theme: Theme;
}): Promise<string | null> {
  const { username, bookTitle, chapter, previousConclusion, theme } = params;
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `You are beginning Chapter ${chapter} of "${bookTitle}", the adventure chronicle of @${username}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

The previous chapter just ended with:
---
${previousConclusion}
---

Write the opening 2-3 sentences of Chapter ${chapter} — a fresh scene that flows naturally from the chapter that just closed, hinting at what stirs ahead.

Rules:
- Refer to the adventurer as @${username}
- Third-person narrative style consistent with the ${theme.name} world
- Only output the sentences, nothing else`,
    }],
  });
  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const text = content.text.trim();
  return text.length > 0 ? text : null;
}

export type SoftStatChanges = {
  intellect:           -1 | 0 | 1;
  empathy: -1 | 0 | 1;
  creativity:          -1 | 0 | 1;
};

export type StatChanges = SoftStatChanges & {
  drive:       -1 | 0 | 1;
  adaptability: -1 | 0 | 1;
};


const STATS_PROMPT = `
After the story paragraphs, on a new line write exactly:
STATS:{"intellect":N,"empathy":N,"creativity":N}
where N is strictly -1, 0, or 1 based on the events and any chat excerpts provided:
- intellect: problem-solving/strategy activities or chat showing analytical discussion (+1), mindless/purely repetitive tasks (-1), neutral (0)
- empathy: warm collaborative tone or large engaged groups (+1), conflict, hostility, or clique behaviour visible in chat (-1), neutral (0)
- creativity: unconventional/artistic activities or imaginative chat (+1), back-to-back identical routine activities with dull chat (-1), neutral (0)
If events are absent or too neutral to judge, output 0 for all.`;

export async function generateProceedChunk(params: {
  username: string;
  bookTitle: string;
  chapter: number;
  priorStory: string;
  events: EventSummary[];
  theme: Theme;
}): Promise<string | null> {
  const { username, bookTitle, chapter, priorStory, events, theme } = params;

  const prompt = `You are continuing Chapter ${chapter} of "${bookTitle}", the adventure chronicle of @${username}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

Story so far:
---
${priorStory}
---

New events since the last entry (real-world data to be reinterpreted):
${formatEvents(events)}

Continue the story in 2-3 paragraphs, weaving in these events naturally.

Rules:
- Refer to this adventurer as @${username}
- Refer to guides as @guide:theirusername, experts as @expert:theirusername, other adventurers as @theirusername
- Third-person narrative style consistent with the ${theme.name} world
- Reinterpret every real-world activity as a ${theme.name}-equivalent (e.g. a hackathon becomes a cyber-heist or arcane tournament depending on the world) — never use mundane real-world labels in the prose
- Keep dates accurate; transform everything else through the ${theme.name} lens
- Build on what came before — maintain tone and continuity
${STATS_PROMPT}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") return null;
  const raw = content.text.trim();
  return raw;
}

export async function generateChapterConclusion(params: {
  username: string;
  bookTitle: string;
  chapter: number;
  priorStory: string;
  theme: Theme;
}): Promise<string | null> {
  const { username, bookTitle, chapter, priorStory, theme } = params;
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 250,
    messages: [{
      role: "user",
      content: `You are writing the closing paragraph of Chapter ${chapter} in "${bookTitle}", the adventure chronicle of @${username}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

The full story so far (Chapter ${chapter} is the current chapter at the end):
---
${priorStory || "(chapter just begun)"}
---

Write a single satisfying closing paragraph (3-5 sentences) that concludes Chapter ${chapter} — a moment of reflection, a quiet triumph, or a hint of what's ahead. Do NOT write a heading or label.

Rules:
- Refer to this adventurer as @${username}
- Refer to guides as @guide:theirusername, experts as @expert:theirusername, other adventurers as @theirusername
- Third-person narrative style consistent with the ${theme.name} world
- Only output the paragraph, nothing else`,
    }],
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
