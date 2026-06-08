import "server-only";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type StoredMarketplaceImage = {
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
};

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  if (mimeType === "image/gif") {
    return ".gif";
  }

  return "";
}

function uploadDirectoryFromEnv() {
  return process.env.UPLOAD_DIR || "public/uploads";
}

function uploadPublicPathFromEnv() {
  return process.env.UPLOAD_PUBLIC_PATH || "/uploads";
}

function resolveUploadPaths(filename: string) {
  const uploadDir = uploadDirectoryFromEnv();
  const uploadPublicPath = uploadPublicPathFromEnv().replace(/\/+$/, "");
  const absoluteDirectory = path.join(process.cwd(), uploadDir, "items");
  const absoluteFilePath = path.join(absoluteDirectory, filename);
  const publicUrl = path.posix.join(uploadPublicPath || "/uploads", "items", filename);

  return {
    absoluteDirectory,
    absoluteFilePath,
    storagePath: path.relative(process.cwd(), absoluteFilePath),
    publicUrl: publicUrl.startsWith("/") ? publicUrl : `/${publicUrl}`
  };
}

export async function storeMarketplaceImage(file: File): Promise<StoredMarketplaceImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("只接受圖片檔案格式。");
  }

  const extension = path.extname(file.name) || extensionFromMimeType(file.type);
  const filename = `${randomUUID()}${extension.toLowerCase()}`;
  const paths = resolveUploadPaths(filename);

  await mkdir(paths.absoluteDirectory, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(paths.absoluteFilePath, buffer);

  return {
    storagePath: paths.storagePath,
    publicUrl: paths.publicUrl,
    mimeType: file.type,
    fileSize: buffer.byteLength
  };
}

export async function removeStoredMarketplaceImage(storagePath: string) {
  const absolutePath = path.join(process.cwd(), storagePath);

  try {
    await unlink(absolutePath);
  } catch {
    // Best-effort cleanup after failed item creation.
  }
}
