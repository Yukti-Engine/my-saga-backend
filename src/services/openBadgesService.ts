import { Ed25519VerificationKey2020 } from "@digitalcredentials/ed25519-verification-key-2020";
import { Ed25519Signature2020 } from "@digitalcredentials/ed25519-signature-2020";
import * as vc from "@digitalcredentials/vc";
import jsonld from "jsonld";

// @ts-expect-error jsonld types don't expose documentLoaders.node()
const nodeDocLoader: (url: string) => Promise<{ documentUrl: string; document: object }> = jsonld.documentLoaders.node();
import { createHash } from "crypto";

const ISSUER_URL = "https://api.mysaga.in/ob/issuer";
const BADGE_ICON_BUCKET = "https://storage.googleapis.com/my-saga-badge-icons";

let suite: Ed25519Signature2020 | null = null;

async function getSuite(): Promise<Ed25519Signature2020> {
  if (suite) return suite;
  const keyPair = await Ed25519VerificationKey2020.from({
    id: `${ISSUER_URL}#key-1`,
    controller: ISSUER_URL,
    type: "Ed25519VerificationKey2020",
    publicKeyMultibase: process.env.OB_PUBLIC_KEY!,
    privateKeyMultibase: process.env.OB_PRIVATE_KEY!,
  });
  suite = new Ed25519Signature2020({ key: keyPair });
  return suite;
}

function buildIssuerDocument() {
  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: ISSUER_URL,
    type: "Profile",
    name: "Yukti Engine LLP",
    url: "https://mysaga.in",
    email: "support@mysaga.in",
    verificationMethod: [
      {
        id: `${ISSUER_URL}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: ISSUER_URL,
        publicKeyMultibase: process.env.OB_PUBLIC_KEY!,
      },
    ],
  };
}

const documentLoader = async (url: string) => {
  if (url === ISSUER_URL || url === `${ISSUER_URL}#key-1`) {
    return {
      documentUrl: url,
      document: buildIssuerDocument(),
    };
  }
  return nodeDocLoader(url);
};

function hashEmail(email: string, salt: string): string {
  return "sha256$" + createHash("sha256").update(email + salt).digest("hex");
}

export async function issueOpenBadge(params: {
  assertionId: string;
  recipientEmail: string;
  badgeId: number;
  badgeName: string;
  badgeDescription: string;
  issuedOn: Date;
}): Promise<object> {
  const { assertionId, recipientEmail, badgeId, badgeName, badgeDescription, issuedOn } = params;
  const salt = process.env.OB_RECIPIENT_SALT!;

  const credential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: `https://api.mysaga.in/ob/assertions/${assertionId}`,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: { id: ISSUER_URL, type: "Profile", name: "Yukti Engine LLP" },
    issuanceDate: issuedOn.toISOString(),
    credentialSubject: {
      type: "AchievementSubject",
      identifier: {
        type: "IdentityObject",
        identityType: "emailAddress",
        hashed: true,
        salt,
        identity: hashEmail(recipientEmail, salt),
      },
      achievement: {
        id: `https://api.mysaga.in/ob/badges/${badgeId}`,
        type: "Achievement",
        name: badgeName,
        description: badgeDescription || "My Saga badge achievement.",
        image: { id: `${BADGE_ICON_BUCKET}/${badgeId}`, type: "Image" },
        criteria: {
          narrative:
            "Awarded by an Expert upon successful completion of a My Saga Adventure assessment.",
        },
        issuer: { id: ISSUER_URL, type: "Profile", name: "Yukti Engine LLP" },
      },
    },
  };

  const signedVC = await vc.issue({ credential, suite: await getSuite(), documentLoader });
  return signedVC;
}

export { buildIssuerDocument, ISSUER_URL, BADGE_ICON_BUCKET };
