import { Storage } from "@google-cloud/storage";
const storage = new Storage();
const bucket = storage.bucket("my-saga");
export async function generateUploadUrl(fileName, contentType, adventureId, fileNumber) {
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
    };
}
export async function generateDownloadUrl(fileName, adventureId, fileNumber) {
    const file = bucket.file(`files/${adventureId}/${fileNumber}/${fileName}`);
    const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 5 * 60 * 1000,
        responseDisposition: `attachment; filename="${fileName}"`
    });
    return url;
}
//# sourceMappingURL=bucketService.js.map