import type { ReportData } from "@/types/report";

export const usagePurposes = [
  "internship_search",
  "campus_recruitment",
  "summer_internship",
  "regular_internship",
  "retention_preparation",
  "other",
] as const;

export const educationStages = ["law_undergraduate", "law_master", "doctorate", "other"] as const;

export const careerScenes = [
  "law_firm",
  "in_house",
  "compliance",
  "court_procuratorate",
  "arbitration",
  "other",
] as const;

export const practiceAreaOptions = [
  "intellectual_property",
  "international_cross_border",
  "dispute_resolution",
  "corporate_commercial",
  "data_ai_technology",
  "other",
  "undecided",
] as const;

export const analysisFocuses = ["resume", "interview", "matching", "planning"] as const;

export type UsagePurpose = (typeof usagePurposes)[number];
export type EducationStage = (typeof educationStages)[number];
export type CareerScene = (typeof careerScenes)[number];
export type PracticeAreaPreference = (typeof practiceAreaOptions)[number];
export type AnalysisFocus = (typeof analysisFocuses)[number];

export type AnalysisContext = {
  purpose: UsagePurpose;
  educationStage: EducationStage;
  careerScene: CareerScene;
  practiceAreas: PracticeAreaPreference[];
  focusAreas: AnalysisFocus[];
};

export const helpfulnessOptions = [
  "very_helpful",
  "comparatively_helpful",
  "neutral",
  "slightly_helpful",
  "not_helpful",
] as const;
export const helpfulPartOptions = [
  "job_profile",
  "evidence_matching",
  "ability_assessment",
  "resume_rewrite",
  "gap_hint",
  "action_plan",
  "interview_questions",
  "other",
] as const;
export const accuracyIssueOptions = [
  "jd_breakdown_inaccurate",
  "missed_core_skill",
  "resume_misunderstood",
  "ability_overestimated",
  "ability_underestimated",
  "missing_experience",
  "participation_upgraded_to_lead",
  "transferable_treated_as_direct",
  "ability_score_unreasonable",
  "evidence_mapping_unclear",
  "no_obvious_issue",
  "other",
] as const;
export const contentIssueOptions = [
  "too_long",
  "too_short",
  "unfocused",
  "repetitive",
  "generic_content",
  "correct_but_useless",
  "not_actionable",
  "no_key_experience",
  "no_main_gap",
  "unnatural_language",
  "content_appropriate",
  "other",
] as const;
export const interviewFeedbackOptions = [
  "resume_specific",
  "role_specific",
  "too_generic",
  "unrealistic",
  "missed_key_experience",
  "missed_weakness",
  "repetitive",
  "too_many",
  "too_few",
  "wants_answer_guidance",
  "wants_followups",
  "other",
] as const;
export const uiIssueOptions = [
  "homepage_unclear",
  "upload_order_unclear",
  "jd_input_inconvenient",
  "resume_upload_inconvenient",
  "analysis_wait_unclear",
  "ai_process_unclear",
  "report_too_long",
  "hierarchy_unclear",
  "reading_order_unclear",
  "radar_unclear",
  "chart_text_disconnect",
  "visual_not_simple",
  "visual_not_professional",
  "mobile_inconvenient",
  "unclear_buttons_copy",
  "no_obvious_issue",
  "other",
] as const;
export const nextPriorityOptions = [
  "improve_jd_accuracy",
  "improve_resume_accuracy",
  "improve_ability_scoring",
  "improve_radar",
  "clearer_requirement_evidence",
  "clearer_apply_decision",
  "concrete_resume_edits",
  "highlight_key_experience",
  "clearer_gaps",
  "improve_interview_specificity",
  "answer_guidance",
  "mock_interview_followups",
  "career_track_differentiation",
  "improve_layout",
  "shorten_report",
  "stronger_actions",
  "new_features",
  "other",
] as const;

export type Helpfulness = (typeof helpfulnessOptions)[number];
export type HelpfulPart = (typeof helpfulPartOptions)[number];
export type AccuracyIssue = (typeof accuracyIssueOptions)[number];
export type ContentIssue = (typeof contentIssueOptions)[number];
export type InterviewFeedback = (typeof interviewFeedbackOptions)[number];
export type UiIssue = (typeof uiIssueOptions)[number];
export type NextVersionPriority = (typeof nextPriorityOptions)[number];

export type FeedbackOpenResponses = {
  singlePriority: string;
  misunderstoodMoment: string;
  keepOneFeature: string;
  missingExpectation: string;
};

export const badCaseTagOptions = [
  "JD_UNDERSTANDING_ERROR",
  "RESUME_UNDERSTANDING_ERROR",
  "ABILITY_OVERESTIMATED",
  "ABILITY_UNDERESTIMATED",
  "MISSING_EXPERIENCE",
  "EVIDENCE_MAPPING_ERROR",
  "GENERIC_CONTENT",
  "LOW_ACTIONABILITY",
  "INTERVIEW_QUESTION_GENERIC",
  "INTERVIEW_QUESTION_UNREALISTIC",
  "UI_LAYOUT",
  "RADAR_CONFUSING",
  "MOBILE_ISSUE",
  "FEATURE_MISSING",
  "OTHER",
] as const;

export type BadCaseTag = (typeof badCaseTagOptions)[number];

export type AnalysisSnapshot = {
  analysisId: string;
  sessionId: string;
  isDemo: false;
  schemaVersion: 1;
  createdAt: string;
  promptVersion: string;
  productVersion: string;
  modelVersion: string;
  scenario: AnalysisContext;
  targetRole: string;
  jobClassification: {
    careerTrack: string;
    practiceAreaCategory?: string;
    practiceArea: string;
    roleLevel: string;
    confidence: number;
  };
  overallScore: number | null;
  generalSkills: Array<{
    id: string;
    name: string;
    jdRequirement: number;
    resumeEvidenceScore: number | null;
    evidenceLevel: import("@/types/report").EvidenceLevel;
    evidenceSources: string[];
    weight: number;
  }>;
  jobRequirements: Array<{
    id: string;
    name: string;
    category: string;
    importance: string;
    jdEvidence: string;
  }>;
  evidenceMatches: Array<{
    requirementId: string;
    requirementName: string;
    status: string;
    sourceType: string;
    evidenceCount: number;
  }>;
  coreMatches: string[];
  coreGaps: string[];
  interviewQuestionCount: number;
  actionPlanTypes: string[];
};

export type FeedbackSubmission = {
  analysisId: string;
  sessionId: string;
  scenario: AnalysisContext;
  helpfulness: Helpfulness;
  helpfulParts: HelpfulPart[];
  accuracyIssues: AccuracyIssue[];
  contentIssues: ContentIssue[];
  interviewFeedback: InterviewFeedback[];
  uiIssues: UiIssue[];
  nextVersionPriorities: NextVersionPriority[];
  otherDetails?: Partial<Record<"helpfulParts" | "accuracyIssues" | "contentIssues" | "interviewFeedback" | "uiIssues" | "nextVersionPriorities", string>>;
  openResponses: FeedbackOpenResponses;
};

export type FeedbackRecord = FeedbackSubmission & {
  id: string;
  schemaVersion: 2;
  createdAt: string;
  badCaseTags: BadCaseTag[];
  promptVersion: string;
  productVersion: string;
  modelVersion: string;
};

export function createAnalysisSnapshot(report: ReportData): AnalysisSnapshot {
  if (report.source !== "deepseek") throw new Error("示例报告不能进入 Beta 分析统计");
  return {
    analysisId: report.analysisId,
    sessionId: report.sessionId,
    isDemo: false,
    schemaVersion: 1,
    createdAt: report.analyzedAt,
    promptVersion: report.promptVersion,
    productVersion: report.productVersion,
    modelVersion: report.modelVersion,
    scenario: report.analysisContext,
    targetRole: redactSnapshotText(report.targetRole),
    jobClassification: report.jobClassification,
    overallScore: report.overallScore,
    generalSkills: report.generalSkills.map(({ id, name, jdRequirement, resumeEvidenceScore, evidenceLevel, evidenceSources, weight }) => ({
      id,
      name,
      jdRequirement,
      resumeEvidenceScore,
      evidenceLevel,
      evidenceSources: evidenceSources.map(redactSnapshotText),
      weight,
    })),
    jobRequirements: report.jobRequirements.map(({ id, name, category, importance, jdEvidence }) => ({ id, name, category, importance, jdEvidence: redactSnapshotText(jdEvidence) })),
    evidenceMatches: report.resumeEvidenceMatches.map(({ requirementId, requirementName, status, sourceType, resumeEvidence }) => ({
      requirementId,
      requirementName,
      status,
      sourceType,
      evidenceCount: resumeEvidence.length,
    })),
    coreMatches: (report.gapAnalysis?.strengths ?? []).map(redactSnapshotText),
    coreGaps: (report.gapAnalysis?.improvements ?? []).map(redactSnapshotText),
    interviewQuestionCount: report.interviewQuestions.length,
    actionPlanTypes: [...new Set(report.actionPlan.map((item) => item.type))],
  };
}

function redactSnapshotText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[邮箱已脱敏]")
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "[手机号已脱敏]")
    .replace(/(?<!\d)\d{17}[\dXx](?!\d)/g, "[证件号已脱敏]");
}
