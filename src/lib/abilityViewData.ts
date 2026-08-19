import type { EvidenceLevel, GeneralSkill } from "@/types/report";

export type AbilityViewDatum = {
  id: string;
  subject: string;
  jdRequirement: number | null;
  resumeEvidenceScore: number | null;
  evidenceLevel: EvidenceLevel;
  evidenceSources: string[];
  weight: number;
};

export function buildAbilityViewData(skills: GeneralSkill[]): AbilityViewDatum[] {
  const ids = new Set<string>();
  const data = skills.map((skill, index) => {
    if (!skill.id || ids.has(skill.id)) {
      reportDataError(`generalSkills[${index}].id 缺失或重复：${skill.id || "<empty>"}`);
    }
    ids.add(skill.id);

    return {
      id: skill.id,
      subject: skill.name,
      jdRequirement: readScore(skill.jdRequirement, `${skill.id}.jdRequirement`, false),
      resumeEvidenceScore: readScore(skill.resumeEvidenceScore, `${skill.id}.resumeEvidenceScore`, true),
      evidenceLevel: skill.evidenceLevel,
      evidenceSources: skill.evidenceSources,
      weight: skill.weight,
    };
  });

  assertAbilityDataConsistency(skills, data);
  return data;
}

export function assertAbilityDataConsistency(skills: GeneralSkill[], data: AbilityViewDatum[]) {
  if (skills.length !== data.length) reportDataError("能力卡片与雷达图维度数量不一致");
  skills.forEach((skill, index) => {
    const chartSkill = data[index];
    if (!chartSkill || chartSkill.id !== skill.id) {
      reportDataError(`能力数组顺序或 skill id 不一致：${skill.id}`);
      return;
    }
    if (chartSkill.resumeEvidenceScore !== skill.resumeEvidenceScore) {
      reportDataError(`能力 ${skill.id} 的卡片分数与雷达图分数不一致`);
    }
  });
}

export function getPlottableResumeEvidence(data: AbilityViewDatum[]) {
  return data.filter(
    (skill): skill is AbilityViewDatum & { resumeEvidenceScore: number } =>
      skill.resumeEvidenceScore !== null,
  );
}

function readScore(value: unknown, field: string, nullable: boolean): number | null {
  if (nullable && value === null) return null;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100) return value;
  reportDataError(`${field} 必须是 0-100 的有限数字${nullable ? "或 null" : ""}，实际为 ${String(value)}`);
  return null;
}

function reportDataError(message: string) {
  if (process.env.NODE_ENV !== "production") throw new Error(`[AbilityDataError] ${message}`);
  console.error(`[AbilityDataError] ${message}`);
}
