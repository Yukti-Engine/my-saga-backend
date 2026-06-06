import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

/** Shared helper — sends a single-turn prompt and returns trimmed text or null. */
async function ask(prompt: string, maxTokens: number): Promise<string | null> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  if (!block || block.type !== "text") return null;
  const text = block.text.trim();
  return text.length > 0 ? text : null;
}

// ── Badge roadmap ────────────────────────────────────────────────────────────

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
  return ask(`You are designing a practical group activity roadmap for 5 to 20 people working together to earn the following badge:

Title: ${badge.title}
Description: ${badge.description ?? "N/A"}
League (difficulty, 1=hardest, 100=easiest): ${badge.league ?? "N/A"}

Create a roadmap with exactly 4 to 5 checkpoints. Rules:
- Every checkpoint must be a group activity — something the whole group does together, not individually
- Each checkpoint must state a concrete task, problem to solve, or measurable goal — not vague descriptions of what the group "explores" or "discusses"
- Write actionable instructions: what they build, what they solve, what the deliverable is, and how success is measured
- Activities should build progressively towards earning the badge, each one harder than the last
- Be specific and creative — no generic advice like "brainstorm ideas" or "reflect on learnings"
- Keep each checkpoint to 2-3 sentences max. Be direct and dense — no filler, no elaboration

Respond with ONLY the roadmap as plain text. No JSON, no lists, no extra formatting, no heading or title. Just write the roadmap directly.`, 512);
}

async function generateClimaticChallenge(badge: {
  title: string;
  description: string | null;
  league: number | null;
}, roadmap: string): Promise<string | null> {
  return ask(`You are designing the final climactic challenge for a group of 5 to 20 people who have completed the following roadmap to earn a badge.

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
- Keep it to 3-5 sentences. Be direct and dense — no filler

Respond with ONLY the challenge as plain text. No JSON, no lists, no extra formatting, no heading or title. Just write the challenge directly.`, 256);
}

// ── Story generation ─────────────────────────────────────────────────────────

export type EventSummary = {
  activity: string;
  timing: Date;
  adventureName: string;
  guideId: number;
  expertId: number | null;
  otherUserIds: number[];
  chatExcerpt: string | null;
  attended: boolean;
};

function formatEvents(uid: number, events: EventSummary[]): string {
  if (events.length === 0) return "No new events recorded.";
  return events.map((e) => {
    const date = e.timing.toDateString();
    const others = e.otherUserIds.length
      ? `Other adventurers: ${e.otherUserIds.map((id) => `@u${id}`).join(", ")}`
      : "No other adventurers";
    const expert = e.expertId ? `\n  Expert: @e${e.expertId}` : "";
    const chat = e.chatExcerpt ? `\n  Chat excerpt:\n${e.chatExcerpt.split("\n").map(l => `    ${l}`).join("\n")}` : "";
    const attendance = e.attended
      ? `@u${uid} was present at this event`
      : `@u${uid} was NOT present at this event — they missed out`;
    return `Adventure: "${e.adventureName}" (${date})\n  Guide: @g${e.guideId}${expert}\n  Activity: ${e.activity}\n  ${attendance}\n  ${others}${chat}`;
  }).join("\n\n");
}

export type Theme = { name: string; description: string | null };

const TONE = "Write in simple, casual English — like you're telling a story to a 20-year-old. No fancy vocabulary, no poetic fluff";
const TAGS = "Mention tags: @u{id} for adventurers, @g{id} for guides, @e{id} for experts";

export async function generateIntroduction(uid: number, bookTitle: string, theme: Theme): Promise<string | null> {
  return ask(`Write the introduction/prologue for an adventure chronicle titled "${bookTitle}", following the journey of @u${uid}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

Write 3-4 paragraphs that:
- Introduce @u${uid} as a budding adventurer stepping into this world
- Paint the world they inhabit with atmosphere rooted in the ${theme.name} setting
- End on a note of anticipation — adventures are on the horizon

Rules:
- Refer to the adventurer as @u${uid} throughout
- Third-person narrative style consistent with the ${theme.name} world
- ${TONE}
- Only output the prose, nothing else`, 600);
}

export async function generateChapterOpening(params: {
  uid: number;
  bookTitle: string;
  chapter: number;
  previousConclusion: string;
  theme: Theme;
}): Promise<string | null> {
  const { uid, bookTitle, chapter, previousConclusion, theme } = params;
  return ask(`You are beginning Chapter ${chapter} of "${bookTitle}", the adventure chronicle of @u${uid}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

The previous chapter just ended with:
---
${previousConclusion}
---

Write the opening 2-3 sentences of Chapter ${chapter} — a fresh scene that flows naturally from the chapter that just closed.

Rules:
- Refer to the adventurer as @u${uid}
- ${TAGS}
- Third-person narrative style consistent with the ${theme.name} world
- ${TONE}
- Only output the sentences, nothing else`, 200);
}

export async function generateProceedChunk(params: {
  uid: number;
  bookTitle: string;
  chapter: number;
  priorStory: string;
  events: EventSummary[];
  theme: Theme;
}): Promise<string | null> {
  const { uid, bookTitle, chapter, priorStory, events, theme } = params;
  return ask(`You are continuing Chapter ${chapter} of "${bookTitle}", the adventure chronicle of @u${uid}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

Story so far:
---
${priorStory}
---

New events since the last entry (real-world data to be reinterpreted):
${formatEvents(uid, events)}

Continue the story in 2-3 paragraphs, weaving in these events naturally.

Rules:
- Refer to this adventurer as @u${uid}
- ${TAGS} (these tags are already used in the event data above — keep them as-is)
- If @u${uid} was NOT present at the event, write the story from their perspective hearing about it later — they missed out, the others went ahead without them
- Third-person narrative style consistent with the ${theme.name} world
- Reinterpret every real-world activity as a ${theme.name}-equivalent (e.g. a hackathon becomes a cyber-heist or arcane tournament depending on the world) — never use mundane real-world labels in the prose
- Keep dates accurate; transform everything else through the ${theme.name} lens
- Build on what came before — maintain tone and continuity
- ${TONE}`, 700);
}

export async function generateChapterConclusion(params: {
  uid: number;
  bookTitle: string;
  chapter: number;
  priorStory: string;
  theme: Theme;
}): Promise<string | null> {
  const { uid, bookTitle, chapter, priorStory, theme } = params;
  return ask(`You are writing the closing paragraph of Chapter ${chapter} in "${bookTitle}", the adventure chronicle of @u${uid}.

World setting — ${theme.name}: ${theme.description ?? theme.name}

The full story so far (Chapter ${chapter} is the current chapter at the end):
---
${priorStory || "(chapter just begun)"}
---

Write a single satisfying closing paragraph (3-5 sentences) that concludes Chapter ${chapter} — a moment of reflection or a hint of what's ahead. Do NOT write a heading or label.

Rules:
- Refer to this adventurer as @u${uid}
- ${TAGS} (keep any tags from the story as-is)
- Third-person narrative style consistent with the ${theme.name} world
- ${TONE}
- Only output the paragraph, nothing else`, 250);
}

// ── Adventure name ───────────────────────────────────────────────────────────

export async function generateAdventureName(roadmap: string): Promise<string | null> {
  return ask(`Given the following group activity roadmap, generate a short, catchy adventure title (5 words or fewer). Respond with ONLY the title, nothing else.

Roadmap:
${roadmap}`, 64);
}
