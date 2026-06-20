/**
 * bucketService.ts
 *
 * Wraps all Google Cloud Storage operations for the My Saga platform.
 * Provides helpers for:
 *   - Badge, category, and theme icon uploads (base64 → PNG)
 *   - Profile icon uploads (base64 → JPEG) and deletion
 *   - KYC document management: signed upload/download URLs, file listing, folder deletion
 *   - Adventure file uploads/downloads and archiving
 *
 */
import { Storage, type File, type GetSignedUrlConfig } from "@google-cloud/storage";

// V4 signing needs a private key. Cloud Run's default compute service account
// has none locally, so the client signs via the IAM `signBlob` API over the
// network — which intermittently fails with "Premature close". If a dedicated
// signer key is provided (GCS_SIGNER_CLIENT_EMAIL + GCS_SIGNER_PRIVATE_KEY,
// e.g. from Secret Manager), use it so signing happens in-process with no
// network call, eliminating the error entirely. Otherwise fall back to the
// keyless default and lean on getSignedUrlWithRetry below.
const signerEmail = process.env.GCS_SIGNER_CLIENT_EMAIL;
// Secret Manager / env vars store newlines escaped as "\n"; restore them.
const signerKey = process.env.GCS_SIGNER_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storage =
  signerEmail && signerKey
    ? new Storage({ credentials: { client_email: signerEmail, private_key: signerKey } })
    : new Storage();
const localSigning = Boolean(signerEmail && signerKey);

/**
 * Runs `fn`, retrying transient GCS failures with exponential backoff
 * (300ms, 600ms, 1.2s, 2.4s). Used to ride out the intermittent IAM `signBlob`
 * "Premature close" errors. The operations here are idempotent, so retry is safe.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        console.warn(`${label} attempt ${i + 1}/${attempts} failed, retrying:`, (err as Error)?.message);
        await new Promise((r) => setTimeout(r, 300 * 2 ** i));
      }
    }
  }
  throw lastErr;
}

/**
 * Generates a V4 signed URL (used for downloads). When signing happens over the
 * network (keyless default service account) the IAM `signBlob` call can fail
 * transiently, so retry. With a local signer key there is no network call, so a
 * single attempt is enough.
 */
async function getSignedUrlWithRetry(file: File, options: GetSignedUrlConfig): Promise<string> {
  return withRetry("getSignedUrl", async () => {
    const [url] = await file.getSignedUrl(options);
    return url;
  }, localSigning ? 1 : 5);
}

/**
 * Creates a resumable upload session URI for direct client upload. Unlike a
 * signed write URL this is authenticated with the runtime's OAuth token (the
 * metadata server on Cloud Run) — there is NO `signBlob` call and no private
 * key needed, so it sidesteps the "Premature close" failure entirely. The
 * client uploads by issuing a single PUT of the file bytes to this URI with the
 * matching Content-Type (no Authorization header). Sessions are valid ~7 days.
 */
async function createUploadSession(file: File, contentType: string): Promise<string> {
  return withRetry("createResumableUpload", async () => {
    const [uri] = await file.createResumableUpload({ metadata: { contentType } });
    return uri;
  });
}
// Separate GCS buckets per content type to allow independent access controls and lifecycle rules
const bucket = storage.bucket("my-saga-adventures");
const archiveBucket = storage.bucket("my-saga-archive");
const profilesBucket = storage.bucket("my-saga-profiles");
const kycBucket = storage.bucket("my-saga-kyc");
const badgeIconsBucket = storage.bucket("my-saga-badge-icons");
const categoryIconsBucket = storage.bucket("my-saga-category-icons");
const themeIconsBucket = storage.bucket("my-saga-theme-icons");
const legalBucket = storage.bucket("my-saga-legal");

/** Decodes a base64 PNG string and uploads it as the icon for the given badge. */
export async function uploadBadgeIcon(base64: string, badgeId: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const file = badgeIconsBucket.file(`${badgeId}`);
  await file.save(buffer, { contentType: "image/png", resumable: false });
  return `https://storage.googleapis.com/my-saga-badge-icons/${badgeId}`;
}

/** Decodes a base64 PNG string and uploads it as the icon for the given category. */
export async function uploadCategoryIcon(base64: string, categoryId: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const file = categoryIconsBucket.file(`${categoryId}`);
  await file.save(buffer, { contentType: "image/png", resumable: false });
  return `https://storage.googleapis.com/my-saga-category-icons/${categoryId}`;
}

/** Decodes a base64 PNG string and uploads it as the icon for the given theme. */
export async function uploadThemeIcon(base64: string, themeId: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const file = themeIconsBucket.file(`${themeId}`);
  await file.save(buffer, { contentType: "image/png", resumable: false });
  return `https://storage.googleapis.com/my-saga-theme-icons/${themeId}`;
}

/**
 * Decodes a base64 PDF and uploads it as a versioned legal document.
 * `docType` is the bucket sub-path ("terms-and-conditions" | "privacy-policy").
 * Path matches what authController serves to clients: <app>/<docType>/<version>.pdf
 */
export async function uploadLegalPdf(
  base64: string,
  app: string,
  docType: string,
  version: number,
): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const file = legalBucket.file(`${app}/${docType}/${version}.pdf`);
  await file.save(buffer, { contentType: "application/pdf", resumable: false });
  return `https://storage.googleapis.com/my-saga-legal/${app}/${docType}/${version}.pdf`;
}

/**
 * Returns a resumable upload session URI so a client can upload a KYC document
 * directly to GCS without proxying through the API server. Keyless (no signBlob).
 */
export async function generateKycUploadUrl(
  kycFolder: string,
  fileName: string,
  contentType: string,
) {
  const file = kycBucket.file(`${kycFolder}/${fileName}`);
  const uploadUrl = await createUploadSession(file, contentType);
  return { uploadUrl, filePath: file.name };
}

/**
 * Generates a short-lived (5 min) signed GET URL for downloading a KYC document.
 * The response disposition forces a file download in the browser.
 */
export async function generateKycDownloadUrl(
  kycFolder: string,
  fileName: string,
) {
  const file = kycBucket.file(`${kycFolder}/${fileName}`);
  const url = await getSignedUrlWithRetry(file, {
    version: "v4",
    action: "read",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    responseDisposition: `attachment; filename="${fileName}"`,
  });
  return url;
}

export async function listKycFiles(kycFolder: string): Promise<string[]> {
  const [files] = await kycBucket.getFiles({ prefix: `${kycFolder}/` });
  return files.map((f: { name: string }) => f.name);
}

export async function deleteKycFolder(kycFolder: string): Promise<void> {
  const [files] = await kycBucket.getFiles({ prefix: `${kycFolder}/` });
  await Promise.all(files.map((f: { delete: (opts: any) => Promise<any> }) => f.delete({ ignoreNotFound: true })));
}

/** Decodes a base64 JPEG string and uploads it as the profile icon for the given role+key. */
export async function uploadProfileIcon(base64: string, role: string, key: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const file = profilesBucket.file(`${role}/${key}`);
  await file.save(buffer, { contentType: "image/jpeg", resumable: false });
  return `https://storage.googleapis.com/my-saga-profiles/${role}/${key}`;
}

export async function deleteProfileIcon(role: string, key: string): Promise<void> {
  await profilesBucket.file(`${role}/${key}`).delete({ ignoreNotFound: true });
}
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  adventureId: number,
  fileNumber: number,
) {
  const file = bucket.file(`files/${adventureId}/${fileNumber}/${fileName}`);

  const uploadUrl = await createUploadSession(file, contentType);

  return {
    uploadUrl,
    filePath: file.name,
    fileNumber: fileNumber
  };
}
export async function generateDownloadUrl(
  fileName: string,
  adventureId: number,
  fileNumber: number,
) {
  const file = bucket.file(`files/${adventureId}/${fileNumber}/${fileName}`);

  const url = await getSignedUrlWithRetry(file, {
    version: "v4",
    action: "read",
    expires: Date.now() + 5 * 60 * 1000,
    responseDisposition: `attachment; filename="${fileName}"`
  });

  return url;
}

export async function deleteAdventureFiles(adventureId: number) {
  const [files] = await bucket.getFiles({ prefix: `files/${adventureId}/` });
  if (files.length === 0) return false;
  await Promise.all(files.map((file: { delete: () => any; }) => file.delete()));
  return true;
}

export async function archiveFile(
  filePath: string,
  destination: string,
  contentType?: string,
) {
  
  await archiveBucket.upload(filePath, {
    destination,
    contentType,
  });

  return true;
}
