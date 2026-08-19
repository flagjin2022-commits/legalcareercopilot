import { parseResumeFile, ResumeParseError } from "@/services/resumeParser";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rateLimitResponse, rejectOversizedRequest } from "@/lib/server/requestGuards";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const oversized = rejectOversizedRequest(request, 9 * 1024 * 1024);
  if (oversized) return oversized;
  const rateLimit = checkRateLimit(request, "parse-resume", { limit: 10, windowMs: 10 * 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: { code: "INVALID_FORM_DATA", message: "上传请求格式无效" } },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: { code: "FILE_REQUIRED", message: "请选择需要解析的简历文件" } },
      { status: 400 },
    );
  }

  try {
    const result = await parseResumeFile(file);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ResumeParseError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.code === "PARSE_FAILED" ? 422 : 400 },
      );
    }

    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "简历解析服务暂时不可用" } },
      { status: 500 },
    );
  }
}
