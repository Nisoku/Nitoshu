import { fileTypeFromBuffer } from "file-type";

export type FileKind = "text" | "image" | "pdf" | "binary" | "too-large";

export interface FileClassification {
  readonly kind: FileKind;
  readonly mime: string;
  readonly ext: string;
}

export const MAX_TEXT_BYTES = 5 * 1024 * 1024;

const SNIFF_BYTES = 8192;
const DETECTION_SAMPLE_BYTES = 4100;
const PRINTABLE_RATIO_LIMIT = 0.3;

const PDF_EXTENSIONS = new Set(["pdf"]);
const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "jfif",
  "gif",
  "webp",
  "bmp",
  "avif",
  "ico",
  "tif",
  "tiff",
]);
const TEXT_BASED_TYPES = new Set([
  "xml",
  "rtf",
  "ps",
  "eps",
  "vcf",
  "vtt",
  "stl",
  "reg",
  "ics",
]);

interface Detected {
  readonly ext: string;
  readonly mime: string;
}

async function readHead(file: Blob, length: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
}

async function detectBinaryType(file: Blob): Promise<Detected | undefined> {
  try {
    return await fileTypeFromBuffer(await readHead(file, DETECTION_SAMPLE_BYTES));
  } catch {
    return undefined;
  }
}

function looksBinary(bytes: Uint8Array): boolean {
  let suspicious = 0;
  for (const byte of bytes) {
    if (byte === 0x00) {
      return true;
    }
    const isControl =
      byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0c && byte !== 0x0d;
    if (isControl || byte === 0x7f) {
      suspicious += 1;
    }
  }
  return bytes.length > 0 && suspicious / bytes.length > PRINTABLE_RATIO_LIMIT;
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export async function classifyFile(file: File): Promise<FileClassification> {
  const ext = extensionOf(file.name);

  if (PDF_EXTENSIONS.has(ext)) {
    return { kind: "pdf", mime: file.type || "application/pdf", ext };
  }

  const detected = await detectBinaryType(file);
  if (detected !== undefined) {
    if (detected.mime.startsWith("image/")) {
      return { kind: "image", mime: detected.mime, ext: detected.ext };
    }
    if (detected.ext === "pdf") {
      return { kind: "pdf", mime: detected.mime, ext: detected.ext };
    }
    if (!TEXT_BASED_TYPES.has(detected.ext)) {
      return { kind: "binary", mime: detected.mime, ext: detected.ext };
    }
  }

  // Fallback when the magic bytes are inconclusive: trust a known extension.
  if (IMAGE_EXTENSIONS.has(ext)) {
    return { kind: "image", mime: file.type || "image/*", ext };
  }

  if (file.size > MAX_TEXT_BYTES) {
    return { kind: "too-large", mime: file.type, ext };
  }
  if (looksBinary(await readHead(file, SNIFF_BYTES))) {
    return { kind: "binary", mime: file.type, ext };
  }
  return { kind: "text", mime: file.type, ext };
}
