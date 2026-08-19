import type { BadCaseTag, FeedbackSubmission } from "@/types/beta";

export function deriveBadCaseTags(feedback: FeedbackSubmission): BadCaseTag[] {
  const tags = new Set<BadCaseTag>();
  if (feedback.accuracyIssues.some((item) => item === "jd_breakdown_inaccurate" || item === "missed_core_skill")) tags.add("JD_UNDERSTANDING_ERROR");
  if (feedback.accuracyIssues.some((item) => item === "resume_misunderstood" || item === "participation_upgraded_to_lead")) tags.add("RESUME_UNDERSTANDING_ERROR");
  if (feedback.accuracyIssues.some((item) => item === "ability_overestimated" || item === "transferable_treated_as_direct")) tags.add("ABILITY_OVERESTIMATED");
  if (feedback.accuracyIssues.includes("ability_underestimated")) tags.add("ABILITY_UNDERESTIMATED");
  if (feedback.accuracyIssues.includes("missing_experience") || feedback.contentIssues.includes("no_key_experience")) tags.add("MISSING_EXPERIENCE");
  if (feedback.accuracyIssues.some((item) => item === "evidence_mapping_unclear" || item === "ability_score_unreasonable")) tags.add("EVIDENCE_MAPPING_ERROR");
  if (feedback.contentIssues.includes("generic_content")) tags.add("GENERIC_CONTENT");
  if (feedback.contentIssues.some((item) => item === "correct_but_useless" || item === "not_actionable")) tags.add("LOW_ACTIONABILITY");
  if (feedback.interviewFeedback.includes("too_generic")) tags.add("INTERVIEW_QUESTION_GENERIC");
  if (feedback.interviewFeedback.includes("unrealistic")) tags.add("INTERVIEW_QUESTION_UNREALISTIC");
  if (feedback.uiIssues.some((item) => item === "hierarchy_unclear" || item === "reading_order_unclear" || item === "visual_not_simple" || item === "visual_not_professional")) tags.add("UI_LAYOUT");
  if (feedback.uiIssues.some((item) => item === "radar_unclear" || item === "chart_text_disconnect")) tags.add("RADAR_CONFUSING");
  if (feedback.uiIssues.includes("mobile_inconvenient")) tags.add("MOBILE_ISSUE");
  if (feedback.nextVersionPriorities.includes("new_features") || feedback.openResponses.missingExpectation.trim()) tags.add("FEATURE_MISSING");
  if (feedback.accuracyIssues.includes("other") || feedback.contentIssues.includes("other") || feedback.interviewFeedback.includes("other") || feedback.uiIssues.includes("other")) tags.add("OTHER");
  return [...tags];
}
