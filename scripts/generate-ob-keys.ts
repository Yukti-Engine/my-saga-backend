import { Ed25519VerificationKey2020 } from "@digitalcredentials/ed25519-verification-key-2020";
import crypto from "crypto";

const keyPair = await Ed25519VerificationKey2020.generate({
  id: "https://api.mysaga.in/ob/issuer#key-1",
  controller: "https://api.mysaga.in/ob/issuer",
});

const exported = await keyPair.export({ publicKey: true, privateKey: true });

console.log("=== OB Keypair ===");
console.log(JSON.stringify(exported, null, 2));
console.log("\n=== Environment Variables ===");
console.log(`OB_PUBLIC_KEY=${exported.publicKeyMultibase}`);
console.log(`OB_PRIVATE_KEY=${exported.privateKeyMultibase}`);
console.log(`OB_RECIPIENT_SALT=${crypto.randomBytes(16).toString("hex")}`);
