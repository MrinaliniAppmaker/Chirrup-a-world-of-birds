import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";

const SIDECAR = "http://127.0.0.1:1106";
// Replit's standard sidecar authentication. No service-account keys are needed.
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export const MAX_PORTRAIT_BYTES = 8 * 1024 * 1024;
export const validBirdId = (id: string) => /^[A-Za-z0-9_-]{1,128}$/.test(id);

function location(path: string) {
  const root = process.env.PRIVATE_OBJECT_DIR?.replace(/^\/|\/$/g, "");
  if (!root) throw new Error("Private portrait storage is not configured.");
  const [bucket, ...prefix] = root.split("/");
  const object = [...prefix, path].join("/");
  return { bucket, object, file: storage.bucket(bucket).file(object) };
}

export function ownsPortrait(installationId: string, birdId: string, path: string) {
  const prefix = `journal-portraits/${installationId}/${birdId}/`;
  return validBirdId(birdId) && path.startsWith(prefix)
    && /^[0-9a-f-]{36}$/.test(path.slice(prefix.length));
}

async function sign(path: string, method: "GET" | "PUT") {
  const { bucket, object } = location(path);
  const response = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucket, object_name: object, method,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Portrait authorization is temporarily unavailable.");
  const result = await response.json() as { signed_url?: unknown };
  if (typeof result.signed_url !== "string") throw new Error("Portrait authorization returned an invalid response.");
  return result.signed_url;
}

export async function authorizePortrait(installationId: string, birdId: string) {
  const portraitPath = `journal-portraits/${installationId}/${birdId}/${randomUUID()}`;
  return { portraitPath, uploadUrl: await sign(portraitPath, "PUT") };
}

export const portraitReadUrl = (path: string) => sign(path, "GET");

export async function validatePortrait(path: string): Promise<void> {
  const { file } = location(path);
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isFinite(size) || size < 1 || size > MAX_PORTRAIT_BYTES) {
    throw new Error("Portrait must be smaller than 8 MB.");
  }
  const [head] = await file.download({ start: 0, end: 15 });
  const png = head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = head[0] === 255 && head[1] === 216 && head[2] === 255;
  const webp = head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP";
  const expected = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : null;
  if (!expected || metadata.contentType !== expected) throw new Error("A PNG, JPEG or WebP portrait is required.");
}

export async function deletePortrait(path: string) {
  await location(path).file.delete({ ignoreNotFound: true });
}

/** Evidence stays private and separate from both saved and shared birds. */
export async function storeReportPortrait(reportId: string, mimeType: string, bytes: Buffer) {
  if (!/^[0-9a-f-]{36}$/i.test(reportId) || bytes.length > 1_050_000) throw new Error("Invalid report portrait.");
  const path = `content-reports/${reportId}/${randomUUID()}`;
  await location(path).file.save(bytes, { resumable: false, metadata: { contentType: mimeType } });
  return path;
}

export async function readReportPortrait(path: string) {
  if (!/^content-reports\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/i.test(path)) throw new Error("Invalid report evidence path.");
  const { file } = location(path);
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) > 1_050_000) throw new Error("Report evidence is too large.");
  const [bytes] = await file.download();
  if (!["image/jpeg", "image/png", "image/webp"].includes(metadata.contentType ?? "")) throw new Error("Invalid report image type.");
  return `data:${metadata.contentType};base64,${bytes.toString("base64")}`;
}

/** Operator deletion only: the UUID-bounded prefix cannot include other journals. */
export async function deleteJournalPortraits(installationId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(installationId)) {
    throw new Error("Invalid journal identity.");
  }
  const { bucket, object } = location(`journal-portraits/${installationId}/`);
  await storage.bucket(bucket).deleteFiles({ prefix: object, force: false });
}

/** Independent private copy: deleting either journal's bird cannot break the other. */
export async function copyJournalPortrait(source: string, installationId: string, birdId: string) {
  const destination = `journal-portraits/${installationId}/${birdId}/${randomUUID()}`;
  const { file } = location(source);
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isFinite(size) || size < 1 || size > MAX_PORTRAIT_BYTES) throw new Error("Invalid saved portrait.");
  // Source paths are exclusively from trusted saved rows, never from a request URL.
  const [bytes] = await file.download();
  if (bytes.length !== size) throw new Error("Portrait copy was incomplete.");
  try {
    await location(destination).file.save(bytes, {
      resumable: false,
      metadata: { contentType: metadata.contentType },
    });
    return destination;
  } catch (error) {
    await deletePortrait(destination).catch(() => {});
    throw error;
  }
}
