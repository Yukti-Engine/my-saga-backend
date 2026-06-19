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

const storage = new Storage();

/**
 * V4 signed URLs are signed via the IAM credentials `signBlob` API whenever the
 * runtime has no local private key (e.g. Cloud Run's default compute service
 * account). That network call occasionally fails with a transient
 * "Premature close" / 5xx, so retry a few times with small backoff before
 * giving up. Signing itself is idempotent, so retrying is safe.
 */
async function getSignedUrlWithRetry(
  file: File,
  options: GetSignedUrlConfig,
  attempts = 3,
): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const [url] = await file.getSignedUrl(options);
      return url;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw lastErr;
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
 * Generates a short-lived (10 min) signed PUT URL so a client can upload
 * a KYC document directly to GCS without proxying through the API server.
 */
export async function generateKycUploadUrl(
  kycFolder: string,
  fileName: string,
  contentType: string,
) {
  const file = kycBucket.file(`${kycFolder}/${fileName}`);
  const url = await getSignedUrlWithRetry(file, {
    version: "v4",
    action: "write",
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    contentType,
  });
  return { uploadUrl: url, filePath: file.name };
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

  const url = await getSignedUrlWithRetry(file, {
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  return {
    uploadUrl: url,
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
