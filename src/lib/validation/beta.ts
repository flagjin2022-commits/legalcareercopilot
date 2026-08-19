import {
  accuracyIssueOptions,
  analysisFocuses,
  careerScenes,
  contentIssueOptions,
  educationStages,
  helpfulnessOptions,
  helpfulPartOptions,
  interviewFeedbackOptions,
  nextPriorityOptions,
  practiceAreaOptions,
  uiIssueOptions,
  usagePurposes,
  type AnalysisContext,
  type FeedbackSubmission,
} from "@/types/beta";

export function parseAnalysisContext(value: unknown): AnalysisContext | null {
  if (!isRecord(value)) return null;
  if (!isOneOf(value.purpose, usagePurposes)) return null;
  if (!isOneOf(value.educationStage, educationStages)) return null;
  if (!isOneOf(value.careerScene, careerScenes)) return null;
  if (!isOptionArray(value.practiceAreas, practiceAreaOptions) || value.practiceAreas.length > 2) return null;
  if (value.practiceAreas.includes("undecided") && value.practiceAreas.length > 1) return null;
  if (!isOptionArray(value.focusAreas, analysisFocuses) || value.focusAreas.length === 0) return null;
  return {
    purpose: value.purpose,
    educationStage: value.educationStage,
    careerScene: value.careerScene,
    practiceAreas: [...new Set(value.practiceAreas)],
    focusAreas: [...new Set(value.focusAreas)],
  };
}

export function parseFeedbackSubmission(value: unknown): FeedbackSubmission | null {
  if (!isRecord(value)) return null;
  const scenario = parseAnalysisContext(value.scenario);
  if (!scenario || !isUuid(value.analysisId) || !isUuid(value.sessionId)) return null;
  if (!isOneOf(value.helpfulness, helpfulnessOptions)) return null;
  if (!isOptionArray(value.helpfulParts, helpfulPartOptions)) return null;
  if (!isOptionArray(value.accuracyIssues, accuracyIssueOptions)) return null;
  if (!isOptionArray(value.contentIssues, contentIssueOptions)) return null;
  if (!isOptionArray(value.interviewFeedback, interviewFeedbackOptions)) return null;
  if (!isOptionArray(value.uiIssues, uiIssueOptions)) return null;
  if (!isOptionArray(value.nextVersionPriorities, nextPriorityOptions)) return null;
  if (!isRecord(value.openResponses)) return null;
  if (!isRequiredText(value.openResponses.singlePriority, 2_000)) return null;
  if (!isLimitedText(value.openResponses.misunderstoodMoment, 2_000)) return null;
  if (!isLimitedText(value.openResponses.keepOneFeature, 2_000)) return null;
  if (!isLimitedText(value.openResponses.missingExpectation, 2_000)) return null;

  const otherDetails = isRecord(value.otherDetails)
    ? Object.fromEntries(
        Object.entries(value.otherDetails)
          .filter(([, detail]) => typeof detail === "string" && detail.length <= 1_000)
          .map(([key, detail]) => [key, (detail as string).trim()]),
      )
    : undefined;

  return {
    analysisId: value.analysisId,
    sessionId: value.sessionId,
    scenario,
    helpfulness: value.helpfulness,
    helpfulParts: value.helpfulParts,
    accuracyIssues: value.accuracyIssues,
    contentIssues: value.contentIssues,
    interviewFeedback: value.interviewFeedback,
    uiIssues: value.uiIssues,
    nextVersionPriorities: value.nextVersionPriorities,
    otherDetails,
    openResponses: {
      singlePriority: value.openResponses.singlePriority.trim(),
      misunderstoodMoment: value.openResponses.misunderstoodMoment.trim(),
      keepOneFeature: value.openResponses.keepOneFeature.trim(),
      missingExpectation: value.openResponses.missingExpectation.trim(),
    },
  };
}

function isLimitedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length <= max;
}

function isRequiredText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function isOptionArray<T extends string>(value: unknown, options: readonly T[]): value is T[] {
  return Array.isArray(value) && value.length <= options.length && value.every((item) => isOneOf(item, options));
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
