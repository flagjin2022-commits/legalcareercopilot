import type {
  ActionPlanItem,
  CareerTrack,
  EvidenceLevel,
  GeneralSkillRequirement,
  InterviewAnswerGuidance,
  InterviewQuestion,
  JobAnalysisResult,
  JobClassification,
  JobRequirement,
  JobSpecificSkillRequirement,
  ResumeEvidenceMatch,
  ResumeRewriteSuggestion,
  RoleLevel,
} from "@/types/report";

const careerTracks = new Set<CareerTrack>([
  "律所与律师业务",
  "企业法务与合规",
  "知识产权专业方向",
  "公职与司法机关",
  "仲裁与争议解决",
  "其他法律相关岗位",
]);

const roleLevels = new Set<RoleLevel>(["实习生", "初级", "中级", "高级", "管理岗", "未明确"]);

const generalSkillFramework = new Map([
  ["legal-research-analysis", "法律研究与分析能力"],
  ["legal-practice-execution", "法律实务执行能力"],
  ["legal-communication", "法律表达与沟通能力"],
  ["international-language", "外语与涉外能力"],
  ["professional-execution", "职业素养与成长能力"],
]);
const evidenceLevels = new Set<EvidenceLevel>(["direct", "transferable", "foundational", "insufficient"]);

const requirementCategories = new Set<JobRequirement["category"]>([
  "hard_requirement",
  "soft_requirement",
  "preferred_requirement",
]);
const importanceLevels = new Set<JobRequirement["importance"]>(["high", "medium", "low"]);
const evidenceStatuses = new Set<ResumeEvidenceMatch["status"]>([
  "met",
  "partial",
  "not_evidenced",
  "not_met",
]);
const sourceTypes = new Set<ResumeEvidenceMatch["sourceType"]>([
  "education",
  "internship",
  "project",
  "competition",
  "campus",
  "language",
  "qualification",
]);
const interviewValues = new Set<ResumeEvidenceMatch["interviewValue"]>(["high", "medium", "low"]);
const rewriteIssues = new Set<ResumeRewriteSuggestion["issue"]>([
  "too_generic",
  "weak_verb",
  "missing_scope",
  "missing_output",
  "missing_result",
  "low_relevance",
  "other",
]);
const actionTypes = new Set<ActionPlanItem["type"]>([
  "resume_expression",
  "interview_preparation",
  "evidence_improvement",
]);
const actionPriorities = new Set<ActionPlanItem["priority"]>(["high", "medium"]);
const questionTypes = new Set<InterviewQuestion["type"]>([
  "resume_deep_dive",
  "jd_professional",
  "scenario",
  "motivation_fit",
  "language",
]);
const questionProbabilities = new Set<InterviewQuestion["probability"]>(["high", "medium"]);

export class JobAnalysisValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobAnalysisValidationError";
  }
}

export function validateJobAnalysisResult(value: unknown): JobAnalysisResult {
  if (!isRecord(value)) throw new JobAnalysisValidationError("AI 返回结果不是 JSON 对象");

  const jobClassification = validateClassification(value.jobClassification);
  const generalSkills = validateGeneralSkills(value.generalSkills);
  const jobSpecificSkills = validateJobSpecificSkills(value.jobSpecificSkills);
  const jobRequirements = validateJobRequirements(value.jobRequirements);
  const resumeEvidenceMatches = validateResumeEvidenceMatches(value.resumeEvidenceMatches, jobRequirements);
  const resumeRewriteSuggestions = validateResumeRewriteSuggestions(value.resumeRewriteSuggestions);
  const actionPlan = validateActionPlan(value.actionPlan, jobRequirements);
  const interviewQuestions = validateInterviewQuestions(value.interviewQuestions);

  return {
    jobClassification,
    generalSkills,
    jobSpecificSkills,
    jobRequirements,
    resumeEvidenceMatches,
    resumeRewriteSuggestions,
    actionPlan,
    interviewQuestions,
  };
}

function validateClassification(value: unknown): JobClassification {
  if (!isRecord(value)) throw new JobAnalysisValidationError("缺少 jobClassification");
  if (!careerTracks.has(value.careerTrack as CareerTrack)) {
    throw new JobAnalysisValidationError("careerTrack 不在允许范围内");
  }
  if (!isNonEmptyString(value.practiceArea)) {
    throw new JobAnalysisValidationError("practiceArea 必须是非空字符串");
  }
  if (value.practiceAreaCategory !== undefined && !isNonEmptyString(value.practiceAreaCategory)) {
    throw new JobAnalysisValidationError("practiceAreaCategory 格式错误");
  }
  if (!roleLevels.has(value.roleLevel as RoleLevel)) {
    throw new JobAnalysisValidationError("roleLevel 不在允许范围内");
  }
  assertScore(value.confidence, "confidence");

  return {
    careerTrack: value.careerTrack as CareerTrack,
    practiceAreaCategory: value.practiceAreaCategory as string | undefined,
    practiceArea: value.practiceArea,
    roleLevel: value.roleLevel as RoleLevel,
    confidence: value.confidence,
  };
}

function validateGeneralSkills(value: unknown): GeneralSkillRequirement[] {
  if (!Array.isArray(value) || value.length !== 5) {
    throw new JobAnalysisValidationError("generalSkills 必须包含五项通用能力");
  }

  const skills = value.map((item, index) => {
    if (!isRecord(item)) throw new JobAnalysisValidationError(`generalSkills[${index}] 格式错误`);
    assertCommonSkillFields(item, `generalSkills[${index}]`);
    if (generalSkillFramework.get(item.id as string) !== item.name) {
      throw new JobAnalysisValidationError(`generalSkills[${index}] 的 id 与 name 不符合稳定能力框架`);
    }
    if (!Array.isArray(item.subSkills) || !item.subSkills.every(isNonEmptyString)) {
      throw new JobAnalysisValidationError(`generalSkills[${index}].subSkills 格式错误`);
    }
    if (!isNonEmptyString(item.jdMatchBasis)) {
      throw new JobAnalysisValidationError(`generalSkills[${index}].jdMatchBasis 格式错误`);
    }
    if (!evidenceLevels.has(item.evidenceLevel as EvidenceLevel)) {
      throw new JobAnalysisValidationError(`generalSkills[${index}].evidenceLevel 格式错误`);
    }
    if (!Array.isArray(item.evidenceSources) || !item.evidenceSources.every(isNonEmptyString)) {
      throw new JobAnalysisValidationError(`generalSkills[${index}].evidenceSources 格式错误`);
    }
    if (!isNonEmptyString(item.evidenceExplanation)) {
      throw new JobAnalysisValidationError(`generalSkills[${index}].evidenceExplanation 格式错误`);
    }
    if (item.resumeEvidenceScore === null) {
      if (item.evidenceLevel !== "insufficient" || item.evidenceSources.length !== 0) {
        throw new JobAnalysisValidationError(`generalSkills[${index}] 无分数时必须标记 insufficient 且证据来源为空`);
      }
    } else {
      assertScore(item.resumeEvidenceScore, `generalSkills[${index}].resumeEvidenceScore`);
      if (item.resumeEvidenceScore === 100 || item.resumeEvidenceScore > (item.requiredScore as number)) {
        throw new JobAnalysisValidationError(`generalSkills[${index}].resumeEvidenceScore 不得为100或超过 requiredScore`);
      }
      if (item.evidenceLevel === "insufficient" || item.evidenceSources.length === 0) {
        throw new JobAnalysisValidationError(`generalSkills[${index}] 有分数时必须提供证据等级和证据来源`);
      }
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      requiredScore: item.requiredScore,
      resumeEvidenceScore: item.resumeEvidenceScore,
      evidenceLevel: item.evidenceLevel,
      evidenceSources: item.evidenceSources,
      evidenceExplanation: item.evidenceExplanation,
      weight: item.weight,
      jdMatchBasis: item.jdMatchBasis,
      subSkills: item.subSkills,
    } as GeneralSkillRequirement;
  });

  if (new Set(skills.map((skill) => skill.id)).size !== 5) {
    throw new JobAnalysisValidationError("generalSkills 存在重复或缺失的能力 ID");
  }
  assertWeightTotal(skills, "generalSkills");
  return skills;
}

function validateJobSpecificSkills(value: unknown): JobSpecificSkillRequirement[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) {
    throw new JobAnalysisValidationError("jobSpecificSkills 必须包含 2 至 6 项能力");
  }

  const skills = value.map((item, index) => {
    if (!isRecord(item)) throw new JobAnalysisValidationError(`jobSpecificSkills[${index}] 格式错误`);
    assertCommonSkillFields(item, `jobSpecificSkills[${index}]`);
    if (!isNonEmptyString(item.evidence)) {
      throw new JobAnalysisValidationError(`jobSpecificSkills[${index}].evidence 格式错误`);
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      requiredScore: item.requiredScore,
      weight: item.weight,
      evidence: item.evidence,
    } as JobSpecificSkillRequirement;
  });

  assertWeightTotal(skills, "jobSpecificSkills");
  return skills;
}

function validateJobRequirements(value: unknown): JobRequirement[] {
  if (!Array.isArray(value) || value.length < 5 || value.length > 12) {
    throw new JobAnalysisValidationError("jobRequirements 必须包含 5 至 12 项要求");
  }

  const requirements = value.map((item, index) => {
    const path = `jobRequirements[${index}]`;
    if (!isRecord(item)) throw new JobAnalysisValidationError(`${path} 格式错误`);
    for (const field of ["id", "name", "description", "jdEvidence"] as const) {
      if (!isNonEmptyString(item[field])) throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
    }
    if (!requirementCategories.has(item.category as JobRequirement["category"])) {
      throw new JobAnalysisValidationError(`${path}.category 不在允许范围内`);
    }
    if (!importanceLevels.has(item.importance as JobRequirement["importance"])) {
      throw new JobAnalysisValidationError(`${path}.importance 不在允许范围内`);
    }
    return {
      id: item.id,
      category: item.category,
      name: item.name,
      description: item.description,
      importance: item.importance,
      jdEvidence: item.jdEvidence,
    } as JobRequirement;
  });

  if (new Set(requirements.map((requirement) => requirement.id)).size !== requirements.length) {
    throw new JobAnalysisValidationError("jobRequirements.id 不能重复");
  }
  return requirements;
}

function validateResumeEvidenceMatches(
  value: unknown,
  requirements: JobRequirement[],
): ResumeEvidenceMatch[] {
  if (!Array.isArray(value) || value.length !== requirements.length) {
    throw new JobAnalysisValidationError("resumeEvidenceMatches 必须与 jobRequirements 一一对应");
  }
  const requirementIds = new Set(requirements.map((requirement) => requirement.id));

  const matches = value.map((item, index) => {
    const path = `resumeEvidenceMatches[${index}]`;
    if (!isRecord(item)) throw new JobAnalysisValidationError(`${path} 格式错误`);
    for (const field of ["id", "requirementId", "requirementName", "analysis"] as const) {
      if (!isNonEmptyString(item[field])) throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
    }
    if (!requirementIds.has(item.requirementId as string)) {
      throw new JobAnalysisValidationError(`${path}.requirementId 未对应任何 JD 要求`);
    }
    if (!evidenceStatuses.has(item.status as ResumeEvidenceMatch["status"])) {
      throw new JobAnalysisValidationError(`${path}.status 不在允许范围内`);
    }
    if (!sourceTypes.has(item.sourceType as ResumeEvidenceMatch["sourceType"])) {
      throw new JobAnalysisValidationError(`${path}.sourceType 不在允许范围内`);
    }
    if (!interviewValues.has(item.interviewValue as ResumeEvidenceMatch["interviewValue"])) {
      throw new JobAnalysisValidationError(`${path}.interviewValue 不在允许范围内`);
    }
    if (!Array.isArray(item.resumeEvidence) || !item.resumeEvidence.every(isNonEmptyString)) {
      throw new JobAnalysisValidationError(`${path}.resumeEvidence 格式错误`);
    }
    return {
      id: item.id,
      requirementId: item.requirementId,
      requirementName: item.requirementName,
      status: item.status,
      resumeEvidence: item.resumeEvidence,
      sourceType: item.sourceType,
      analysis: item.analysis,
      interviewValue: item.interviewValue,
    } as ResumeEvidenceMatch;
  });

  if (new Set(matches.map((match) => match.requirementId)).size !== requirements.length) {
    throw new JobAnalysisValidationError("每项 jobRequirement 必须且只能对应一条证据匹配");
  }
  return matches;
}

function validateResumeRewriteSuggestions(value: unknown): ResumeRewriteSuggestion[] {
  if (!Array.isArray(value) || value.length > 8) {
    throw new JobAnalysisValidationError("resumeRewriteSuggestions 必须是最多 8 项的数组");
  }

  return value.map((item, index) => {
    const path = `resumeRewriteSuggestions[${index}]`;
    if (!isRecord(item)) throw new JobAnalysisValidationError(`${path} 格式错误`);
    for (const field of ["id", "targetRequirement", "originalText", "suggestedText", "reason"] as const) {
      if (!isNonEmptyString(item[field])) throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
    }
    if (!rewriteIssues.has(item.issue as ResumeRewriteSuggestion["issue"])) {
      throw new JobAnalysisValidationError(`${path}.issue 不在允许范围内`);
    }
    if (typeof item.needsUserConfirmation !== "boolean") {
      throw new JobAnalysisValidationError(`${path}.needsUserConfirmation 必须是布尔值`);
    }
    if (
      item.missingFacts !== undefined &&
      (!Array.isArray(item.missingFacts) || !item.missingFacts.every(isNonEmptyString))
    ) {
      throw new JobAnalysisValidationError(`${path}.missingFacts 格式错误`);
    }
    return {
      id: item.id,
      targetRequirement: item.targetRequirement,
      originalText: item.originalText,
      issue: item.issue,
      suggestedText: item.suggestedText,
      reason: item.reason,
      needsUserConfirmation: item.needsUserConfirmation,
      missingFacts: item.missingFacts,
    } as ResumeRewriteSuggestion;
  });
}

function validateActionPlan(value: unknown, requirements: JobRequirement[]): ActionPlanItem[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) {
    throw new JobAnalysisValidationError("actionPlan 必须包含 2 至 6 项建议");
  }
  const requirementIds = new Set(requirements.map((requirement) => requirement.id));

  return value.map((item, index) => {
    const path = `actionPlan[${index}]`;
    if (!isRecord(item)) throw new JobAnalysisValidationError(`${path} 格式错误`);
    for (const field of [
      "id",
      "title",
      "requirementId",
      "targetRequirement",
      "currentEvidence",
      "whyPriority",
      "action",
    ] as const) {
      if (!isNonEmptyString(item[field])) throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
    }
    if (!actionTypes.has(item.type as ActionPlanItem["type"])) {
      throw new JobAnalysisValidationError(`${path}.type 不在允许范围内`);
    }
    if (!actionPriorities.has(item.priority as ActionPlanItem["priority"])) {
      throw new JobAnalysisValidationError(`${path}.priority 不在允许范围内`);
    }
    if (!requirementIds.has(item.requirementId as string)) {
      throw new JobAnalysisValidationError(`${path}.requirementId 未对应任何 JD 要求`);
    }
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      priority: item.priority,
      requirementId: item.requirementId,
      targetRequirement: item.targetRequirement,
      currentEvidence: item.currentEvidence,
      whyPriority: item.whyPriority,
      action: item.action,
    } as ActionPlanItem;
  });
}

function validateInterviewQuestions(value: unknown): InterviewQuestion[] {
  if (!Array.isArray(value) || value.length < 8 || value.length > 12) {
    throw new JobAnalysisValidationError("interviewQuestions 必须包含 8 至 12 道题");
  }

  return value.map((item, index) => {
    const path = `interviewQuestions[${index}]`;
    if (!isRecord(item)) throw new JobAnalysisValidationError(`${path} 格式错误`);
    for (const field of ["id", "question", "suggestedExperience"] as const) {
      if (!isNonEmptyString(item[field])) throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
    }
    if (!questionTypes.has(item.type as InterviewQuestion["type"])) {
      throw new JobAnalysisValidationError(`${path}.type 不在允许范围内`);
    }
    if (!questionProbabilities.has(item.probability as InterviewQuestion["probability"])) {
      throw new JobAnalysisValidationError(`${path}.probability 不在允许范围内`);
    }
    for (const field of ["focusPoints", "followUpQuestions"] as const) {
      if (!Array.isArray(item[field]) || item[field].length === 0 || !item[field].every(isNonEmptyString)) {
        throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
      }
    }
    const sourceExperience = isNonEmptyString(item.sourceExperience)
      ? item.sourceExperience
      : item.suggestedExperience;
    const testedSkill = isNonEmptyString(item.testedSkill)
      ? item.testedSkill
      : (item.focusPoints as string[])[0];
    const professionalExtension = isNonEmptyString(item.professionalExtension)
      ? item.professionalExtension
      : (item.focusPoints as string[]).slice(1).join("、") || "结合岗位专业场景展开";
    const answerGuidance = validateAnswerGuidance(item.answerGuidance, `${path}.answerGuidance`);
    return {
      id: item.id,
      type: item.type,
      probability: item.probability,
      question: item.question,
      focusPoints: item.focusPoints,
      suggestedExperience: item.suggestedExperience,
      sourceExperience,
      testedSkill,
      professionalExtension,
      followUpQuestions: item.followUpQuestions,
      answerGuidance,
    } as InterviewQuestion;
  });
}

function validateAnswerGuidance(value: unknown, path: string): InterviewAnswerGuidance {
  if (!isRecord(value)) throw new JobAnalysisValidationError(`${path} 格式错误`);

  const optionalFields = [
    "background",
    "personalAction",
    "legalReasoning",
    "output",
    "resultOrUsage",
  ] as const;
  for (const field of optionalFields) {
    if (value[field] !== undefined && !isNonEmptyString(value[field])) {
      throw new JobAnalysisValidationError(`${path}.${field} 格式错误`);
    }
  }
  if (!Array.isArray(value.missingFacts) || !value.missingFacts.every(isNonEmptyString)) {
    throw new JobAnalysisValidationError(`${path}.missingFacts 格式错误`);
  }
  if (!optionalFields.some((field) => isNonEmptyString(value[field])) && value.missingFacts.length === 0) {
    throw new JobAnalysisValidationError(`${path} 必须包含简历事实或待确认信息`);
  }

  return {
    background: value.background as string | undefined,
    personalAction: value.personalAction as string | undefined,
    legalReasoning: value.legalReasoning as string | undefined,
    output: value.output as string | undefined,
    resultOrUsage: value.resultOrUsage as string | undefined,
    missingFacts: value.missingFacts,
  };
}

function assertCommonSkillFields(value: Record<string, unknown>, path: string) {
  for (const field of ["id", "name", "description"] as const) {
    if (!isNonEmptyString(value[field])) {
      throw new JobAnalysisValidationError(`${path}.${field} 必须是非空字符串`);
    }
  }
  assertScore(value.requiredScore, `${path}.requiredScore`);
  assertScore(value.weight, `${path}.weight`);
}

function assertWeightTotal(skills: Array<{ weight: number }>, path: string) {
  const total = skills.reduce((sum, skill) => sum + skill.weight, 0);
  if (total !== 100) throw new JobAnalysisValidationError(`${path} 的 weight 总和必须等于 100`);
}

function assertScore(value: unknown, path: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100) {
    throw new JobAnalysisValidationError(`${path} 必须是 0 至 100 的整数`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
