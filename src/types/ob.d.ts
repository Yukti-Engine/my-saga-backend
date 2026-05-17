declare module "@digitalcredentials/ed25519-signature-2020" {
  export class Ed25519Signature2020 {
    constructor(options: { key: unknown });
  }
}

declare module "@digitalcredentials/vc" {
  export function issue(options: {
    credential: object;
    suite: unknown;
    documentLoader: unknown;
  }): Promise<object>;
}
