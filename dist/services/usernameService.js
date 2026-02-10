const adjectives = [
    "anonymous",
    "brave",
    "happy",
    "silly",
    "fast",
    "tiny",
    "cool"
];
const nouns = [
    "whale",
    "kid",
    "carrot",
    "lion",
    "robot",
    "panda",
    "gamer"
];
export function generateRandomUsername() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective} ${noun}`;
}
//# sourceMappingURL=usernameService.js.map