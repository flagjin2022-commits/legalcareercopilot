import { buildJobAnalysisPrompt, JOB_ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts/jobAnalysisPrompt";
import {
  JobAnalysisValidationError,
  validateJobAnalysisResult,
} from "@/lib/validation/jobAnalysis";
import type { JobAnalysisResult } from "@/types/report";
import type { AnalysisContext } from "@/types/beta";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_FORMAT_ATTEMPTS = 2;

type DeepSeekErrorCode =
  | "CONFIGURATION_ERROR"
  | "PROVIDER_ERROR"
  | "TIMEOUT"
  | "EMPTY_RESPONSE"
  | "INVALID_JSON"
  | "INVALID_RESPONSE";

type DeepSeekChatResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | null;
    };
  }>;
};

export class DeepSeekServiceError extends Error {
  constructor(
    public readonly code: DeepSeekErrorCode,
    message: string,
    public readonly providerStatus?: number,
    public readonly providerMessage?: string,
    public readonly model?: string,
  ) {
    super(message);
    this.name = "DeepSeekServiceError";
  }
}

export async function analyzeJobDescription(
  jobDescription: string,
  resumeText?: string,
  context?: AnalysisContext,
): Promise<JobAnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekServiceError("CONFIGURATION_ERROR", "未配置 DEEPSEEK_API_KEY");
  }

  let previousFormatError = "";
  for (let attempt = 1; attempt <= MAX_FORMAT_ATTEMPTS; attempt += 1) {
    try {
      return await requestJobAnalysis(apiKey, jobDescription, resumeText, context, previousFormatError);
    } catch (error) {
      const canRepair =
        error instanceof DeepSeekServiceError &&
        ["EMPTY_RESPONSE", "INVALID_JSON", "INVALID_RESPONSE"].includes(error.code) &&
        attempt < MAX_FORMAT_ATTEMPTS;

      if (!canRepair) throw error;
      previousFormatError = error.message;
    }
  }

  throw new DeepSeekServiceError("INVALID_RESPONSE", "AI 返回结果未通过结构校验");
}

async function requestJobAnalysis(
  apiKey: string,
  jobDescription: string,
  resumeText?: string,
  context?: AnalysisContext,
  previousFormatError?: string,
): Promise<JobAnalysisResult> {
  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const repairInstruction = previousFormatError
    ? `\n\n<format_repair>上一次输出未通过校验：${previousFormatError}。请重新生成完整 JSON，逐项检查数组数量、枚举值、权重总和；generalSkills 每项必须包含 resumeEvidenceScore、evidenceLevel、evidenceSources、evidenceExplanation，且 null 分数只能对应 insufficient 和空证据数组；同时检查 requirementId 对应关系、每道面试题的 sourceExperience/testedSkill/professionalExtension，以及 answerGuidance.missingFacts。</format_repair>`
    : "";

  let response: Response;
  try {
    response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: JOB_ANALYSIS_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${buildJobAnalysisPrompt(jobDescription, resumeText, context)}${repairInstruction}`,
          },
        ],
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        temperature: 0.2,
        max_tokens: 8_000,
        stream: false,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new DeepSeekServiceError("TIMEOUT", "DeepSeek 请求超时");
    }
    const detail = error instanceof Error ? error.message : "未知网络错误";
    throw new DeepSeekServiceError(
      "PROVIDER_ERROR",
      `无法连接 DeepSeek API：${detail}`,
      undefined,
      detail,
      model,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const providerMessage = await readProviderError(response);
    throw new DeepSeekServiceError(
      "PROVIDER_ERROR",
      `DeepSeek API 返回 ${response.status}：${providerMessage}`,
      response.status,
      providerMessage,
      model,
    );
  }

  const payload = (await response.json()) as DeepSeekChatResponse;
  const choice = payload.choices?.[0];
  const content = choice?.message?.content?.trim();

  if (choice?.finish_reason === "length") {
    throw new DeepSeekServiceError("INVALID_RESPONSE", "AI 输出因长度限制被截断");
  }
  if (!content) {
    throw new DeepSeekServiceError("EMPTY_RESPONSE", "DeepSeek 返回了空内容");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    throw new DeepSeekServiceError("INVALID_JSON", "DeepSeek 返回内容不是有效 JSON");
  }

  try {
    const result = validateJobAnalysisResult(repairActionPlanRequirementIds(parsed));
    validateLanguageInterviewCoverage(result, jobDescription);
    return result;
  } catch (error) {
    if (error instanceof JobAnalysisValidationError) {
      throw new DeepSeekServiceError("INVALID_RESPONSE", error.message);
    }
    throw error;
  }
}

async function readProviderError(response: Response) {
  const raw = await response.text();
  if (!raw) return response.statusText || "未返回错误详情";

  try {
    const payload = JSON.parse(raw) as { error?: { message?: unknown } };
    const message = payload.error?.message;
    return typeof message === "string" && message.trim() ? message.trim() : raw.slice(0, 500);
  } catch {
    return raw.slice(0, 500);
  }
}

function validateLanguageInterviewCoverage(result: JobAnalysisResult, jobDescription: string) {
  if (!/(涉外|国际仲裁|跨境|英文工作语言|英文工作|英语作为工作语言|英语水平|英语能力|英文法律文件)/i.test(jobDescription)) {
    return;
  }

  const languageQuestions = result.interviewQuestions.filter((question) => question.type === "language");
  if (languageQuestions.length < 1 || languageQuestions.length > 2) {
    throw new JobAnalysisValidationError("涉外岗位必须生成 1 至 2 道英文 language 面试题");
  }
  if (languageQuestions.some((question) => !/[A-Za-z]{3,}/.test(question.question))) {
    throw new JobAnalysisValidationError("language 面试题必须使用英文问题");
  }
}

function repairActionPlanRequirementIds(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.actionPlan) || !Array.isArray(value.jobRequirements)) {
    return value;
  }

  const requirements = value.jobRequirements
    .filter(isRecord)
    .filter((item) => isNonEmptyString(item.id) && isNonEmptyString(item.name));
  const requirementIds = new Set(requirements.map((item) => item.id as string));
  const specificSkillNames = new Map(
    (Array.isArray(value.jobSpecificSkills) ? value.jobSpecificSkills : [])
      .filter(isRecord)
      .filter((item) => isNonEmptyString(item.id) && isNonEmptyString(item.name))
      .map((item) => [item.id as string, item.name as string]),
  );

  const actionPlan = value.actionPlan.map((item) => {
    if (!isRecord(item) || !isNonEmptyString(item.requirementId) || requirementIds.has(item.requirementId)) {
      return item;
    }

    const sourceNames = [specificSkillNames.get(item.requirementId), item.targetRequirement]
      .filter(isNonEmptyString)
      .map(normalizeSemanticText);
    const match = findSemanticRequirement(sourceNames, requirements);
    return match ? { ...item, requirementId: match.id } : item;
  });

  return { ...value, actionPlan };
}

function findSemanticRequirement(sourceNames: string[], requirements: Array<Record<string, unknown>>) {
  const ranked = requirements
    .map((requirement) => {
      const name = normalizeSemanticText(requirement.name as string);
      const score = sourceNames.reduce((best, source) => Math.max(best, semanticScore(source, name)), 0);
      return { requirement, score };
    })
    .sort((left, right) => right.score - left.score);

  if (!ranked[0] || ranked[0].score < 10) return null;
  if (ranked[1] && ranked[0].score === ranked[1].score) return null;
  return ranked[0].requirement;
}

function semanticScore(source: string, candidate: string) {
  if (!source || !candidate) return 0;
  if (source === candidate) return 100;
  if (source.includes(candidate) || candidate.includes(source)) {
    return 60 + Math.min(source.length, candidate.length);
  }

  const sharedCharacters = new Set([...source].filter((character) => candidate.includes(character)));
  return sharedCharacters.size >= 2 ? sharedCharacters.size * 5 : 0;
}

function normalizeSemanticText(value: string) {
  return value.toLowerCase().replace(/[^\p{Letter}\p{Number}\u4e00-\u9fff]/gu, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stripCodeFence(content: string) {
  return content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
