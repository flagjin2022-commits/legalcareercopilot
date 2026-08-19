import { deriveBadCaseTags } from "@/lib/badCaseTags";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rateLimitResponse, rejectOversizedRequest } from "@/lib/server/requestGuards";
import { parseFeedbackSubmission } from "@/lib/validation/beta";
import { getBetaStore } from "@/services/betaStore";
import type { FeedbackRecord } from "@/types/beta";
import { sanitizeFeedbackSubmission } from "@/lib/privacy";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  const oversized = rejectOversizedRequest(request, 100_000);
  if (oversized) return oversized;
  const rateLimit = checkRateLimit(request, "feedback", { limit: 10, windowMs: 10 * 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { message: "反馈内容格式不正确" } }, { status: 400 });
  }

  const submission = parseFeedbackSubmission(body);
  if (!submission) {
    return Response.json({ error: { message: "反馈信息不完整或格式不正确" } }, { status: 400 });
  }

  try {
    const sanitizedSubmission = sanitizeFeedbackSubmission(submission);
    const store = getBetaStore();
    const analysis = await store.getAnalysis(sanitizedSubmission.analysisId);
    if (!analysis || analysis.isDemo || analysis.sessionId !== sanitizedSubmission.sessionId) {
      return Response.json({ error: { message: "未找到与反馈对应的真实匿名分析" } }, { status: 409 });
    }
    if (await store.getFeedbackForAnalysis(sanitizedSubmission.analysisId)) {
      return Response.json({ error: { message: "这次匿名分析已经提交过反馈" } }, { status: 409 });
    }

    const record: FeedbackRecord = {
      ...sanitizedSubmission,
      scenario: analysis.scenario,
      id: crypto.randomUUID(),
      schemaVersion: 2,
      createdAt: new Date().toISOString(),
      badCaseTags: deriveBadCaseTags(sanitizedSubmission),
      promptVersion: analysis.promptVersion,
      productVersion: analysis.productVersion,
      modelVersion: analysis.modelVersion,
    };
    await store.saveFeedback(record);
    return Response.json({ ok: true, feedbackId: record.id }, { status: 201 });
  } catch (error) {
    console.error("[beta-feedback] save failed", error instanceof Error ? error.message : "unknown error");
    return Response.json(
      { error: { message: "反馈暂时没有提交成功，可以再试一次。" } },
      { status: 503 },
    );
  }
}
