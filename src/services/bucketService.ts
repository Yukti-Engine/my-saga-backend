import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucket = storage.bucket("my-saga");
const archiveBucket = storage.bucket("my-saga-archive");
const profilesBucket = storage.bucket("my-saga-profiles");
const kycBucket = storage.bucket("my-saga-kyc");

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

export async function uploadProfileIcon(base64: string, role: string, id: number): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const file = profilesBucket.file(`${role}/${id}`);
  await file.save(buffer, { contentType: "image/jpeg", resumable: false });
  await file.makePublic();
  return `https://storage.googleapis.com/my-saga-profiles/${role}/${id}`;
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
