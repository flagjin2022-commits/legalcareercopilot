export type CareerTrack =
  | "律所与律师业务"
  | "企业法务与合规"
  | "知识产权专业方向"
  | "公职与司法机关"
  | "仲裁与争议解决"
  | "其他法律相关岗位";

export type RoleLevel = "实习生" | "初级" | "中级" | "高级" | "管理岗" | "未明确";

export type JobClassification = {
  careerTrack: CareerTrack;
  practiceAreaCategory?: string;
  practiceArea: string;
  roleLevel: RoleLevel;
  confidence: number;
};

export type JobRequirement = {
  id: string;
  category: "hard_requirement" | "soft_requirement" | "preferred_requirement";
  name: string;
  description: string;
  importance: "high" | "medium" | "low";
  jdEvidence: string;
};

export type ResumeEvidenceMatch = {
  id: string;
  requirementId: string;
  requirementName: string;
  status: "met" | "partial" | "not_evidenced" | "not_met";
  resumeEvidence: string[];
  sourceType:
    | "education"
    | "internship"
    | "project"
    | "competition"
    | "campus"
    | "language"
    | "qualification";
  analysis: string;
  interviewValue: "high" | "medium" | "low";
};

export type ResumeRewriteSuggestion = {
  id: string;
  targetRequirement: string;
  originalText: string;
  issue:
    | "too_generic"
    | "weak_verb"
    | "missing_scope"
    | "missing_output"
    | "missing_result"
    | "low_relevance"
    | "other";
  suggestedText: string;
  reason: string;
  needsUserConfirmation: boolean;
  missingFacts?: string[];
};

export type EvidenceLevel = "direct" | "transferable" | "foundational" | "insufficient";

export type GeneralSkill = {
  id: string;
  name: string;
  description: string;
  jdRequirement: number;
  resumeEvidenceScore: number | null;
  evidenceLevel: EvidenceLevel;
  evidenceSources: string[];
  weight: number;
  jdMatchBasis: string;
  experienceEvidence: string | null;
  subSkills: string[];
};

export type GeneralSkillRequirement = Pick<
  GeneralSkill,
  "id" | "name" | "description" | "resumeEvidenceScore" | "evidenceLevel" | "evidenceSources" | "weight" | "jdMatchBasis" | "subSkills"
> & {
  requiredScore: number;
  evidenceExplanation: string;
};

export type JobSpecificSkill = {
  id: string;
  name: string;
  description: string;
  score: number | null;
  requiredScore: number;
  weight: number;
  evidence: string;
  experienceEvidence: string | null;
};

export type JobSpecificSkillRequirement = Pick<
  JobSpecificSkill,
  "id" | "name" | "description" | "requiredScore" | "weight" | "evidence"
>;

export type JobAnalysisResult = {
  jobClassification: JobClassification;
  generalSkills: GeneralSkillRequirement[];
  jobSpecificSkills: JobSpecificSkillRequirement[];
  jobRequirements: JobRequirement[];
  resumeEvidenceMatches: ResumeEvidenceMatch[];
  resumeRewriteSuggestions: ResumeRewriteSuggestion[];
  actionPlan: ActionPlanItem[];
  interviewQuestions: InterviewQuestion[];
};

export type ExperienceMatch = {
  id: string;
  requiredSkill: string;
  experience: string;
  evidence: string;
  reasoning: string;
  score: number;
  matchLevel?: "strong_match" | "partial_match" | "related_evidence" | "not_found";
};

export type GapAnalysis = {
  strengths: string[];
  improvements: string[];
  advice: string;
  answerKeywords: string[];
};

export type InterviewAnswerGuidance = {
  background?: string;
  personalAction?: string;
  legalReasoning?: string;
  output?: string;
  resultOrUsage?: string;
  missingFacts: string[];
};

export type InterviewQuestion = {
  id: string;
  type: "resume_deep_dive" | "jd_professional" | "scenario" | "motivation_fit" | "language";
  probability: "high" | "medium";
  question: string;
  focusPoints: string[];
  suggestedExperience: string;
  sourceExperience: string;
  testedSkill: string;
  professionalExtension: string;
  followUpQuestions: string[];
  answerGuidance: InterviewAnswerGuidance;
};

export type ActionPlanItem = {
  id: string;
  type: "resume_expression" | "interview_preparation" | "evidence_improvement";
  title: string;
  priority: "high" | "medium";
  requirementId: string;
  targetRequirement: string;
  currentEvidence: string;
  whyPriority: string;
  action: string;
};

export type ReportData = {
  id: string;
  analysisId: string;
  sessionId: string;
  source: "mock" | "deepseek";
  promptVersion: string;
  productVersion: string;
  modelVersion: string;
  analyzedAt: string;
  analysisContext: import("@/types/beta").AnalysisContext;
  targetRole: string;
  status: string;
  generatedAt: string;
  overallScore: number | null;
  summary: string;
  jobClassification: JobClassification;
  generalSkills: GeneralSkill[];
  jobSpecificSkills: JobSpecificSkill[];
  jobRequirements: JobRequirement[];
  resumeEvidenceMatches: ResumeEvidenceMatch[];
  resumeRewriteSuggestions: ResumeRewriteSuggestion[];
  experienceMatches: ExperienceMatch[];
  gapAnalysis: GapAnalysis | null;
  interviewQuestions: InterviewQuestion[];
  actionPlan: ActionPlanItem[];
};
