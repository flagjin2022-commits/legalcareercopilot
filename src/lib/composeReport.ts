import type { JobAnalysisResult, ReportData, ResumeEvidenceMatch } from "@/types/report";
import type { AnalysisContext } from "@/types/beta";
import { PRODUCT_VERSION, PROMPT_VERSION, getModelVersion } from "@/lib/betaVersion";

export function composeReportFromJobAnalysis(
  analysis: JobAnalysisResult,
  options: { analysisId: string; sessionId: string; analysisContext: AnalysisContext },
): ReportData {
  const experienceMatches = buildExperienceMatches(analysis.resumeEvidenceMatches);
  const generalSkills = buildGeneralSkills(analysis);
  const analyzedAt = new Date().toISOString();
  const analysisId = options.analysisId;

  return {
    id: `deepseek-${slugify(analysis.jobClassification.practiceArea)}-${analysisId.slice(0, 8)}`,
    analysisId,
    sessionId: options.sessionId,
    source: "deepseek",
    promptVersion: PROMPT_VERSION,
    productVersion: PRODUCT_VERSION,
    modelVersion: getModelVersion(),
    analyzedAt,
    analysisContext: options.analysisContext,
    targetRole: buildTargetRole(analysis),
    status: "DeepSeek 分析完成",
    generatedAt: new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Shanghai",
    })
      .format(new Date())
      .replaceAll("/", "."),
    overallScore: calculateEvidenceCoverage(analysis.resumeEvidenceMatches, analysis.jobRequirements),
    summary: `AI 将该岗位识别为“${analysis.jobClassification.careerTrack}”下的“${analysis.jobClassification.practiceArea}”方向，并根据 JD 要求与简历证据计算了证据覆盖度。该数值反映材料匹配程度，不代表用户能力评分。`,
    jobClassification: analysis.jobClassification,
    generalSkills,
    jobSpecificSkills: analysis.jobSpecificSkills.map((requirement) => ({
      ...requirement,
      score: null,
      experienceEvidence: null,
    })),
    jobRequirements: analysis.jobRequirements,
    resumeEvidenceMatches: analysis.resumeEvidenceMatches,
    resumeRewriteSuggestions: analysis.resumeRewriteSuggestions,
    experienceMatches,
    gapAnalysis: buildGapAnalysis(analysis.resumeEvidenceMatches),
    actionPlan: analysis.actionPlan,
    interviewQuestions: analysis.interviewQuestions,
  };
}

function buildGeneralSkills(analysis: JobAnalysisResult) {
  return analysis.generalSkills.map((requirement) => {
    return {
      id: requirement.id,
      name: requirement.name,
      description: requirement.description,
      jdRequirement: requirement.requiredScore,
      resumeEvidenceScore: requirement.resumeEvidenceScore,
      evidenceLevel: requirement.evidenceLevel,
      evidenceSources: requirement.evidenceSources,
      weight: requirement.weight,
      jdMatchBasis: requirement.jdMatchBasis,
      subSkills: requirement.subSkills,
      experienceEvidence: requirement.evidenceExplanation || null,
    };
  });
}

function buildExperienceMatches(matches: ResumeEvidenceMatch[]) {
  return matches.map((match) => {
    const matchLevel = getExperienceMatchLevel(match);
    const evidence = match.resumeEvidence.length
      ? match.resumeEvidence.join("；")
      : "当前简历中未找到足以证明该要求的具体经历。";

    return {
      id: `experience-${match.id}`,
      requiredSkill: match.requirementName,
      experience: match.resumeEvidence[0] ?? "当前简历未找到对应经历",
      evidence,
      reasoning: match.analysis,
      score: getEvidenceScore(match),
      matchLevel,
    };
  });
}

function getExperienceMatchLevel(match: ResumeEvidenceMatch): "strong_match" | "partial_match" | "related_evidence" | "not_found" {
  if (match.status === "met") return "strong_match";
  if (match.status === "partial") {
    return match.analysis.includes("间接相关") ? "related_evidence" : "partial_match";
  }
  return "not_found";
}

function getEvidenceScore(match: ResumeEvidenceMatch) {
  const level = getExperienceMatchLevel(match);
  if (level === "not_found") return 0;
  if (level === "related_evidence") return 70;
  if (match.sourceType === "education" || match.sourceType === "qualification") return 60;
  if (level === "partial_match") return 80;
  if (level === "strong_match") return 90;
  return 0;
}

function calculateEvidenceCoverage(
  matches: ResumeEvidenceMatch[],
  requirements: JobAnalysisResult["jobRequirements"],
) {
  const importanceWeight = { high: 3, medium: 2, low: 1 } as const;
  const statusScore = { met: 1, partial: 0.65, not_evidenced: 0, not_met: 0 } as const;
  const importanceByRequirementId = new Map(requirements.map((requirement) => [requirement.id, requirement.importance]));
  const getWeight = (match: ResumeEvidenceMatch) => importanceWeight[importanceByRequirementId.get(match.requirementId) ?? "medium"];
  const totalWeight = matches.reduce((sum, match) => sum + getWeight(match), 0);
  if (!totalWeight) return 0;

  const coveredWeight = matches.reduce(
    (sum, match) => sum + getWeight(match) * statusScore[match.status],
    0,
  );
  return Math.round((coveredWeight / totalWeight) * 100);
}

function buildGapAnalysis(matches: ResumeEvidenceMatch[]) {
  const strengths = matches.filter((match) => match.status === "met").map((match) => match.requirementName);
  const improvements = matches
    .filter((match) => match.status === "partial" || match.status === "not_evidenced")
    .map((match) => match.requirementName);
  const answerKeywords = matches
    .filter((match) => match.status === "met" || match.status === "partial")
    .flatMap((match) => match.resumeEvidence.slice(0, 2))
    .slice(0, 8);

  return {
    strengths,
    improvements,
    advice: "优先补充高优先级要求的事实证据，并在面试表达中区分直接匹配与间接相关经历。",
    answerKeywords,
  };
}

function buildTargetRole(analysis: JobAnalysisResult) {
  const { practiceArea, roleLevel } = analysis.jobClassification;
  return roleLevel === "未明确" ? practiceArea : `${practiceArea}（${roleLevel}）`;
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\p{Letter}\p{Number}-]/gu, "") || "job-analysis"
  );
}
