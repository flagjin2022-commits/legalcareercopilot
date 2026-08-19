import type { FeedbackSubmission } from "@/types/beta";

export function redactSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[邮箱已脱敏]")
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "[手机号已脱敏]")
    .replace(/(?<!\d)\d{17}[\dXx](?!\d)/g, "[证件号已脱敏]")
    .replace(/(?<!\d)(?:\+?86[- ]?)?(?:0\d{2,3}[- ]?)?\d{7,8}(?!\d)/g, "[电话已脱敏]");
}

export function sanitizeFeedbackSubmission(submission: FeedbackSubmission): FeedbackSubmission {
  return {
    ...submission,
    otherDetails: submission.otherDetails
      ? Object.fromEntries(Object.entries(submission.otherDetails).map(([key, value]) => [key, redactSensitiveText(value)]))
      : undefined,
    openResponses: Object.fromEntries(
      Object.entries(submission.openResponses).map(([key, value]) => [key, redactSensitiveText(value)]),
    ) as FeedbackSubmission["openResponses"],
  };
}
