import mammoth from "mammoth";
import { extractText } from "unpdf";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 45_000;

type ResumeFileType = "docx" | "pdf";
type ExtractedText = { text: string; pageCount?: number };

export type ParsedResume = {
  text: string;
  fileName: string;
  fileType: ResumeFileType;
  characterCount: number;
  pageCount?: number;
};

type ResumeParseErrorCode =
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "EMPTY_DOCUMENT"
  | "TEXT_TOO_LONG"
  | "PARSE_FAILED";

export class ResumeParseError extends Error {
  constructor(
    public readonly code: ResumeParseErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ResumeParseError";
  }
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  if (file.size > MAX_FILE_SIZE) {
    throw new ResumeParseError("FILE_TOO_LARGE", "简历文件不能超过 8 MB");
  }

  const fileType = detectFileType(file);
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const parsed = fileType === "docx" ? await parseDocx(bytes) : await parsePdf(bytes);
    const text = normalizeText(parsed.text);

    if (text.length < 20) {
      const hint = fileType === "pdf" ? "扫描版 PDF 暂不支持，请上传可复制文字的 PDF 或 DOCX" : "文件中未提取到有效文字";
      throw new ResumeParseError("EMPTY_DOCUMENT", hint);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new ResumeParseError("TEXT_TOO_LONG", `简历正文不能超过 ${MAX_TEXT_LENGTH.toLocaleString()} 个字符`);
    }

    return {
      text,
      fileName: file.name,
      fileType,
      characterCount: text.length,
      pageCount: parsed.pageCount,
    };
  } catch (error) {
    if (error instanceof ResumeParseError) throw error;
    throw new ResumeParseError("PARSE_FAILED", "简历解析失败，请检查文件是否损坏或更换格式后重试");
  }
}

async function parseDocx(bytes: Uint8Array): Promise<ExtractedText> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return { text: result.value };
}

async function parsePdf(bytes: Uint8Array): Promise<ExtractedText> {
  const result = await extractText(bytes, { mergePages: true });
  return { text: result.text, pageCount: result.totalPages };
}

function detectFileType(file: File): ResumeFileType {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pdf")) return "pdf";
  throw new ResumeParseError("UNSUPPORTED_FILE_TYPE", "目前仅支持 PDF 和 DOCX 格式");
}

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
