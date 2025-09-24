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
// Function to generate random username
export function generateRandomUsername() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective} ${noun}`;
}
// // Test the function
console.log("Random username:", generateRandomUsername());
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log(generateRandomUsername());
}
//# sourceMappingURL=usernameService.js.map