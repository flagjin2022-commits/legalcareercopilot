import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { deriveBadCaseTags } from "../src/lib/badCaseTags.ts";
import { createLocalBetaStore } from "../src/services/betaStore.ts";
import { createAnalysisSnapshot } from "../src/types/beta.ts";
import { mockReport } from "../src/lib/mockReport.ts";

const cases = [
  ["law_firm", ["intellectual_property", "international_cross_border"]],
  ["in_house", ["data_ai_technology"]],
  ["court_procuratorate", ["undecided"]],
];

test("三个 Beta 分析与反馈可跨 store 实例持久化并保持 analysisId 关联", async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), "lcc-beta-"));
  try {
    const store = createLocalBetaStore(dataDir);
    const ids = cases.map(() => crypto.randomUUID());
    const sessionIds = cases.map(() => crypto.randomUUID());

    for (let index = 0; index < cases.length; index += 1) {
      const [careerScene, practiceAreas] = cases[index];
      const scenario = {
        purpose: "internship_search",
        educationStage: "law_master",
        careerScene,
        practiceAreas,
        focusAreas: ["matching", "interview"],
      };
      const snapshot = createSnapshot(ids[index], sessionIds[index], scenario);
      await store.saveAnalysis(snapshot);
      const submission = createSubmission(ids[index], sessionIds[index], scenario, index);
      await store.saveFeedback({
        ...submission,
        id: crypto.randomUUID(),
        schemaVersion: 2,
        createdAt: new Date().toISOString(),
        badCaseTags: deriveBadCaseTags(submission),
        promptVersion: "beta-1",
        productVersion: "0.3.0",
        modelVersion: "deepseek-v4-flash",
      });
    }

    const reopened = createLocalBetaStore(dataDir);
    const analyses = await reopened.listAnalyses();
    const feedback = await reopened.listFeedback();
    assert.equal(new Set(ids).size, 3);
    assert.equal(analyses.length, 3);
    assert.equal(feedback.length, 3);
    cases.forEach(([careerScene, practiceAreas], index) => {
      assert.equal(analyses[index].analysisId, ids[index]);
      assert.equal(feedback[index].analysisId, ids[index]);
      assert.equal(feedback[index].scenario.careerScene, careerScene);
      assert.deepEqual(feedback[index].scenario.practiceAreas, practiceAreas);
      assert.equal(feedback[index].promptVersion, "beta-1");
      assert.equal(feedback[index].productVersion, "0.3.0");
    });
    assert.ok(feedback[0].badCaseTags.includes("ABILITY_OVERESTIMATED"));
    assert.ok(feedback[1].badCaseTags.includes("INTERVIEW_QUESTION_GENERIC"));
    assert.ok(feedback[2].badCaseTags.includes("RADAR_CONFUSING"));
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("Demo 报告不能生成真实 Analysis Snapshot", () => {
  assert.throws(() => createAnalysisSnapshot(mockReport), /示例报告不能进入 Beta 分析统计/);
});

function createSnapshot(analysisId, sessionId, scenario) {
  return {
    analysisId,
    sessionId,
    isDemo: false,
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    promptVersion: "beta-1",
    productVersion: "0.3.0",
    modelVersion: "deepseek-v4-flash",
    scenario,
    targetRole: "测试岗位",
    jobClassification: { careerTrack: "测试", practiceArea: "测试", roleLevel: "实习生", confidence: 90 },
    overallScore: 70,
    generalSkills: [],
    jobRequirements: [],
    evidenceMatches: [],
    coreMatches: [],
    coreGaps: [],
    interviewQuestionCount: 10,
    actionPlanTypes: ["interview_preparation"],
  };
}

function createSubmission(analysisId, sessionId, scenario, index) {
  return {
    analysisId,
    sessionId,
    scenario,
    helpfulness: "comparatively_helpful",
    helpfulParts: ["evidence_matching"],
    accuracyIssues: index === 0 ? ["ability_overestimated"] : [],
    contentIssues: [],
    interviewFeedback: index === 1 ? ["too_generic"] : [],
    uiIssues: index === 2 ? ["radar_unclear"] : [],
    nextVersionPriorities: ["improve_ability_scoring"],
    openResponses: { singlePriority: "继续提高准确性", misunderstoodMoment: "", keepOneFeature: "证据匹配", missingExpectation: "" },
  };
}
