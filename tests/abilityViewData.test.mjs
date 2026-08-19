import assert from "node:assert/strict";
import test from "node:test";

import { buildAbilityViewData, getPlottableResumeEvidence } from "../src/lib/abilityViewData.ts";

const names = [
  ["legal-research-analysis", "法律研究与分析能力"],
  ["legal-practice-execution", "法律实务执行能力"],
  ["legal-communication", "法律表达与沟通能力"],
  ["international-language", "外语与涉外能力"],
  ["professional-execution", "职业素养与成长能力"],
];

function createSkills(scores) {
  return names.map(([id, name], index) => ({
    id,
    name,
    description: name,
    jdRequirement: 95,
    resumeEvidenceScore: scores[index],
    evidenceLevel: "direct",
    evidenceSources: scores[index] === null ? [] : ["测试证据"],
    weight: 20,
    jdMatchBasis: "测试 JD",
    experienceEvidence: "测试证据",
    subSkills: [],
  }));
}

test("雷达图与能力卡片使用同一组 85/60/75/90/80 分数", () => {
  const scores = [85, 60, 75, 90, 80];
  const skills = createSkills(scores);
  const viewData = buildAbilityViewData(skills);

  assert.deepEqual(viewData.map((skill) => skill.resumeEvidenceScore), scores);
  assert.deepEqual(viewData.map((skill) => skill.id), skills.map((skill) => skill.id));
});

test("undefined 或 NaN 不会被静默转换为 0", () => {
  const undefinedScore = createSkills([85, 60, 75, 90, undefined]);
  assert.throws(() => buildAbilityViewData(undefinedScore), /AbilityDataError/);

  const nanScore = createSkills([85, 60, 75, 90, Number.NaN]);
  assert.throws(() => buildAbilityViewData(nanScore), /AbilityDataError/);
});

test("证据不足使用 null，而不是 0", () => {
  const viewData = buildAbilityViewData(createSkills([85, 60, null, 90, 80]));
  assert.equal(viewData[2].resumeEvidenceScore, null);
  const plottable = getPlottableResumeEvidence(viewData);
  assert.deepEqual(plottable.map((skill) => skill.resumeEvidenceScore), [85, 60, 90, 80]);
  assert.equal(plottable.some((skill) => skill.resumeEvidenceScore === 0), false);
});

test("真实 60 分同时进入能力卡片与雷达可绘制数据", () => {
  const viewData = buildAbilityViewData(createSkills([85, 60, 75, 90, 80]));
  const plottable = getPlottableResumeEvidence(viewData);
  assert.equal(viewData[1].resumeEvidenceScore, 60);
  assert.equal(plottable[1].resumeEvidenceScore, 60);
});
