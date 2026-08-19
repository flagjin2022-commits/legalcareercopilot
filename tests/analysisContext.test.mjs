import assert from "node:assert/strict";
import test from "node:test";

import { buildJobAnalysisPrompt } from "../src/lib/prompts/jobAnalysisPrompt.ts";

const base = {
  purpose: "internship_search",
  educationStage: "law_master",
  focusAreas: ["matching", "interview"],
};

const cases = [
  [{ ...base, careerScene: "law_firm", practiceAreas: ["intellectual_property", "international_cross_border"] }, ["目标职业场景：律所", "专业 / 业务方向：知识产权、涉外 / 跨境"]],
  [{ ...base, careerScene: "in_house", practiceAreas: ["data_ai_technology"] }, ["目标职业场景：企业法务", "专业 / 业务方向：数据 / AI / 科技"]],
  [{ ...base, careerScene: "court_procuratorate", practiceAreas: ["undecided"] }, ["目标职业场景：法院 / 检察院", "专业 / 业务方向：暂未确定"]],
  [{ ...base, careerScene: "arbitration", practiceAreas: ["dispute_resolution", "international_cross_border"] }, ["目标职业场景：仲裁机构", "专业 / 业务方向：争议解决、涉外 / 跨境"]],
];

for (const [context, expected] of cases) {
  test(`Prompt 包含 ${expected.join(" + ")}`, () => {
    const prompt = buildJobAnalysisPrompt("测试岗位招聘信息，具体 JD 始终优先。", "测试简历事实。", context);
    expected.forEach((text) => assert.match(prompt, new RegExp(text.replaceAll("/", "\\/"))));
    assert.match(prompt, /具体 JD \/ 招聘信息 > 目标职业场景 > 专业 \/ 业务方向/);
  });
}
