import { analyzeJobDescription, DeepSeekServiceError } from "@/services/deepseek";
import { composeReportFromJobAnalysis } from "@/lib/composeReport";
import { parseAnalysisContext } from "@/lib/validation/beta";
import { createAnalysisSnapshot } from "@/types/beta";
import { getBetaStore } from "@/services/betaStore";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rateLimitResponse, rejectOversizedRequest } from "@/lib/server/requestGuards";

const MIN_JOB_DESCRIPTION_LENGTH = 30;
const MAX_JOB_DESCRIPTION_LENGTH = 30_000;
const MAX_RESUME_TEXT_LENGTH = 50_000;

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  const oversized = rejectOversizedRequest(request, 100_000);
  if (oversized) return oversized;
  const rateLimit = checkRateLimit(request, "analyze-job", { limit: 5, windowMs: 10 * 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "请求体必须是有效 JSON" } },
      { status: 400 },
    );
  }

  if (!isRecord(body) || typeof body.jobDescription !== "string") {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "jobDescription 必须是字符串" } },
      { status: 400 },
    );
  }
  if (body.resumeText !== undefined && typeof body.resumeText !== "string") {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "resumeText 必须是字符串" } },
      { status: 400 },
    );
  }
  const analysisContext = parseAnalysisContext(body.analysisContext);
  if (!analysisContext) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "请重新选择本次使用场景、职业场景和 AI 分析重点" } },
      { status: 400 },
    );
  }
  if (typeof body.sessionId !== "string" || !isUuid(body.sessionId)) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "本次分析会话已失效，请返回上传页重试" } },
      { status: 400 },
    );
  }
  if (typeof body.analysisId !== "string" || !isUuid(body.analysisId)) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "本次匿名分析编号已失效，请返回上传页重试" } },
      { status: 400 },
    );
  }

  const jobDescription = body.jobDescription.trim();
  const resumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : undefined;
  if (jobDescription.length < MIN_JOB_DESCRIPTION_LENGTH) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: `岗位描述不能少于 ${MIN_JOB_DESCRIPTION_LENGTH} 个字符` } },
      { status: 400 },
    );
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: `岗位描述不能超过 ${MAX_JOB_DESCRIPTION_LENGTH} 个字符` } },
      { status: 400 },
    );
  }
  if (resumeText && resumeText.length > MAX_RESUME_TEXT_LENGTH) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: `简历文本不能超过 ${MAX_RESUME_TEXT_LENGTH} 个字符` } },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyzeJobDescription(jobDescription, resumeText, analysisContext);
    const report = composeReportFromJobAnalysis(analysis, {
      analysisId: body.analysisId,
      sessionId: body.sessionId,
      analysisContext,
    });
    await getBetaStore().saveAnalysis(createAnalysisSnapshot(report));
    return Response.json(report);
  } catch (error) {
    if (error instanceof DeepSeekServiceError) {
      console.error("[analyze-job] DeepSeek analysis failed", {
        code: error.code,
        httpStatus: error.providerStatus ?? null,
        providerMessage: error.providerMessage ?? error.message,
        model: error.model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      });
      const status =
        error.code === "PROVIDER_ERROR"
          ? getProviderHttpStatus(error.providerStatus)
          : getHttpStatus(error.code);
      return Response.json(
        {
          error: {
            code: error.code,
            message: getPublicMessage(error.code, error.providerStatus),
          },
        },
        { status },
      );
    }

    console.error("[analyze-job] analysis persistence failed", error instanceof Error ? error.message : "unknown error");
    return Response.json(
      { error: { code: "PERSISTENCE_ERROR", message: "分析已完成，但匿名结果暂时无法保存，请稍后重试" } },
      { status: 503 },
    );
  }
}

function getHttpStatus(code: DeepSeekServiceError["code"]) {
  if (code === "PROVIDER_ERROR") return 502;
  switch (code) {
    case "CONFIGURATION_ERROR":
      return 503;
    case "TIMEOUT":
      return 504;
    case "INVALID_JSON":
    case "INVALID_RESPONSE":
    case "EMPTY_RESPONSE":
      return 502;
    default:
      return 502;
  }
}

function getProviderHttpStatus(status?: number) {
  if (!status) return 502;
  if ([400, 401, 402, 422, 429, 500, 503].includes(status)) return status;
  return 502;
}

function getPublicMessage(code: DeepSeekServiceError["code"], providerStatus?: number) {
  if (code === "PROVIDER_ERROR") {
    switch (providerStatus) {
      case 400:
        return "DeepSeek 请求格式错误";
      case 401:
        return "DeepSeek API Key 无效或鉴权失败";
      case 402:
        return "DeepSeek 账户余额不足";
      case 422:
        return "DeepSeek 请求参数不受支持";
      case 429:
        return "DeepSeek 请求过于频繁，请稍后重试";
      case 500:
      case 503:
        return "DeepSeek 服务暂时异常，请稍后重试";
      default:
        return "无法连接 DeepSeek 服务";
    }
  }
  switch (code) {
    case "CONFIGURATION_ERROR":
      return "AI 服务尚未配置";
    case "TIMEOUT":
      return "AI 分析超时，请稍后重试";
    case "INVALID_JSON":
    case "INVALID_RESPONSE":
    case "EMPTY_RESPONSE":
      return "AI 返回格式异常，请重新分析";
    default:
      return "DeepSeek 服务暂时不可用";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
