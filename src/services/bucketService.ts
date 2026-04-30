import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-adventures");
const archiveBucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-archive");
const profilesBucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-profiles");
const kycBucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-kyc");
const badgeIconsBucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-badge-icons");
const categoryIconsBucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-category-icons");
const themeIconsBucket = storage.bucket((process.env.NODE_ENV=="staging"?"staging-":"")+"my-saga-theme-icons");

export async function uploadBadgeIcon(base64: string, badgeId: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const prefix = process.env.NODE_ENV === "staging" ? "staging-" : "";
  const file = badgeIconsBucket.file(`${badgeId}`);
  await file.save(buffer, { contentType: "image/png", resumable: false });
  return `https://storage.googleapis.com/${prefix}my-saga-badge-icons/${badgeId}`;
}

export async function uploadCategoryIcon(base64: string, categoryId: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const prefix = process.env.NODE_ENV === "staging" ? "staging-" : "";
  const file = categoryIconsBucket.file(`${categoryId}`);
  await file.save(buffer, { contentType: "image/png", resumable: false });
  return `https://storage.googleapis.com/${prefix}my-saga-category-icons/${categoryId}`;
}

export async function uploadThemeIcon(base64: string, themeId: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const prefix = process.env.NODE_ENV === "staging" ? "staging-" : "";
  const file = themeIconsBucket.file(`${themeId}`);
  await file.save(buffer, { contentType: "image/png", resumable: false });
  return `https://storage.googleapis.com/${prefix}my-saga-theme-icons/${themeId}`;
}

export async function generateKycUploadUrl(
  kycFolder: string,
  fileName: string,
  contentType: string,
) {
  const file = kycBucket.file(`${kycFolder}/${fileName}`);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 10 * 60 * 1000,
    contentType,
  });
  return { uploadUrl: url, filePath: file.name };
}

export async function generateKycDownloadUrl(
  kycFolder: string,
  fileName: string,
) {
  const file = kycBucket.file(`${kycFolder}/${fileName}`);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 5 * 60 * 1000,
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

export async function uploadProfileIcon(base64: string, role: string, key: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const prefix = process.env.NODE_ENV === "staging" ? "staging-" : "";
  const file = profilesBucket.file(`${role}/${key}`);
  await file.save(buffer, { contentType: "image/jpeg", resumable: false });
  return `https://storage.googleapis.com/${prefix}my-saga-profiles/${role}/${key}`;
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

  const [url] = await file.getSignedUrl({
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

  const [url] = await file.getSignedUrl({
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
