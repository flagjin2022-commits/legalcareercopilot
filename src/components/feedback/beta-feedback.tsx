"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, HeartHandshake, LoaderCircle, Send } from "lucide-react";

import {
  type AccuracyIssue,
  type ContentIssue,
  type FeedbackOpenResponses,
  type HelpfulPart,
  type Helpfulness,
  type InterviewFeedback,
  type NextVersionPriority,
  type UiIssue,
} from "@/types/beta";
import type { ReportData } from "@/types/report";

const helpfulness = [
  ["very_helpful", "很有帮助"],
  ["comparatively_helpful", "比较有帮助"],
  ["neutral", "一般"],
  ["slightly_helpful", "帮助较小"],
  ["not_helpful", "基本没有帮助"],
] as const;

const helpfulParts = [
  ["job_profile", "岗位画像 / JD 拆解"], ["evidence_matching", "简历与岗位证据匹配"],
  ["ability_assessment", "能力画像 / 匹配判断"], ["resume_rewrite", "简历表达建议"],
  ["gap_hint", "经历缺口提示"], ["action_plan", "行动建议"],
  ["interview_questions", "面试问题生成"], ["other", "其他"],
] as const;

const accuracyIssues = [
  ["jd_breakdown_inaccurate", "岗位要求拆解不准确"], ["missed_core_skill", "没有抓到岗位真正重要的能力"],
  ["resume_misunderstood", "错误理解了我的某段经历"], ["ability_overestimated", "高估了我的某项能力"],
  ["ability_underestimated", "低估了我的某项能力"], ["missing_experience", "漏掉了重要经历"],
  ["participation_upgraded_to_lead", "把“参与”理解成了“主导”"], ["transferable_treated_as_direct", "把可迁移能力当成已有经验"],
  ["ability_score_unreasonable", "能力评分 / 能力画像不合理"], ["evidence_mapping_unclear", "岗位需求与证据对应不清楚"],
  ["no_obvious_issue", "没有明显问题"], ["other", "其他"],
] as const;

const contentIssues = [
  ["too_long", "内容太长"], ["too_short", "内容太短"], ["unfocused", "信息很多，但重点不突出"],
  ["repetitive", "有重复内容"], ["generic_content", "分析太泛，像通用 AI 回答"],
  ["correct_but_useless", "有些建议属于“正确的废话”"], ["not_actionable", "建议不够具体"],
  ["no_key_experience", "没有指出最该突出哪段经历"], ["no_main_gap", "没有指出最大的短板"],
  ["unnatural_language", "语言不够自然"], ["content_appropriate", "内容基本合适"], ["other", "其他"],
] as const;

const interviewOptions = [
  ["resume_specific", "很针对我的简历"], ["role_specific", "很符合这个岗位"], ["too_generic", "太通用"],
  ["unrealistic", "不像真实面试会问的问题"], ["missed_key_experience", "没有追问最重要的经历"],
  ["missed_weakness", "没有针对薄弱点追问"], ["repetitive", "问题重复"], ["too_many", "问题太多"],
  ["too_few", "问题太少"], ["wants_answer_guidance", "希望增加回答思路"],
  ["wants_followups", "希望增加模拟追问"], ["other", "其他"],
] as const;

const uiOptions = [
  ["homepage_unclear", "首页不知道产品具体能做什么"], ["upload_order_unclear", "不知道应该先上传什么"],
  ["jd_input_inconvenient", "JD 输入不够方便"], ["resume_upload_inconvenient", "简历上传不够方便"],
  ["analysis_wait_unclear", "分析等待过程不清楚"], ["ai_process_unclear", "不知道 AI 正在做什么"],
  ["report_too_long", "结果页太长"], ["hierarchy_unclear", "信息层级不清楚"],
  ["reading_order_unclear", "不知道应该先看哪一部分"], ["radar_unclear", "能力图表不够直观"],
  ["chart_text_disconnect", "图表和文字关系不清楚"], ["visual_not_simple", "页面视觉不够简洁"],
  ["visual_not_professional", "页面视觉不够专业"], ["mobile_inconvenient", "手机端操作不方便"],
  ["unclear_buttons_copy", "按钮或提示语不清楚"], ["no_obvious_issue", "页面整体没有明显问题"], ["other", "其他"],
] as const;

const priorityOptions = [
  ["improve_jd_accuracy", "提高岗位 / JD 拆解准确性"], ["improve_resume_accuracy", "提高简历经历识别准确性"],
  ["improve_ability_scoring", "优化能力评价和评分"], ["improve_radar", "优化能力画像 / 雷达图"],
  ["clearer_requirement_evidence", "更清楚展示岗位要求 vs 我的证据"], ["clearer_apply_decision", "更明确告诉我适不适合投"],
  ["concrete_resume_edits", "更具体告诉我简历怎么改"], ["highlight_key_experience", "明确应该重点突出哪段经历"],
  ["clearer_gaps", "更明确指出能力缺口"], ["improve_interview_specificity", "提高面试问题针对性"],
  ["answer_guidance", "增加面试回答思路"], ["mock_interview_followups", "增加模拟面试 / 连续追问"],
  ["career_track_differentiation", "增加法律职业方向差异化分析"], ["improve_layout", "优化结果页布局"],
  ["shorten_report", "减少报告长度"], ["stronger_actions", "增强行动建议"],
  ["new_features", "增加其他功能"], ["other", "其他"],
] as const;

const emptyOpenResponses: FeedbackOpenResponses = {
  singlePriority: "", misunderstoodMoment: "", keepOneFeature: "", missingExpectation: "",
};

export function BetaFeedback({ report }: { report: ReportData }) {
  const [step, setStep] = useState(0);
  const [overall, setOverall] = useState<Helpfulness | null>(null);
  const [selectedHelpful, setSelectedHelpful] = useState<HelpfulPart[]>([]);
  const [selectedAccuracy, setSelectedAccuracy] = useState<AccuracyIssue[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentIssue[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewFeedback[]>([]);
  const [selectedUi, setSelectedUi] = useState<UiIssue[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<NextVersionPriority[]>([]);
  const [otherDetails, setOtherDetails] = useState<Record<string, string>>({});
  const [openResponses, setOpenResponses] = useState(emptyOpenResponses);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  if (submitState === "success") {
    return (
      <section className="border-t border-primary/[0.08] bg-primary px-6 py-16 text-primary-foreground sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-white"><Check className="size-5" /></span>
          <h2 className="mt-6 font-display text-3xl font-semibold">收到啦，谢谢你帮我一起改这个小工具</h2>
          <p className="mt-3 text-sm leading-7 text-primary-foreground/70">反馈已与本次匿名分析关联，将用于整理第一轮 Beta bad case。</p>
        </div>
      </section>
    );
  }

  async function submitFeedback() {
    if (!overall || !openResponses.singlePriority.trim()) {
      setError("请完成整体评价，并告诉我下一版最优先该改什么。");
      return;
    }
    setSubmitState("submitting");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: report.analysisId,
          sessionId: report.sessionId,
          scenario: report.analysisContext,
          helpfulness: overall,
          helpfulParts: selectedHelpful,
          accuracyIssues: selectedAccuracy,
          contentIssues: selectedContent,
          interviewFeedback: selectedInterview,
          uiIssues: selectedUi,
          nextVersionPriorities: selectedPriorities,
          otherDetails,
          openResponses,
        }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "反馈保存失败");
      setSubmitState("success");
    } catch (submitError) {
      setSubmitState("error");
      setError(submitError instanceof Error ? submitError.message : "反馈暂时没有提交成功，可以再试一次。");
    }
  }

  return (
    <section className="border-t border-primary/[0.08] bg-primary px-4 py-16 text-primary-foreground sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"><HeartHandshake className="size-4" /> Beta Feedback</p>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">帮我一起把它改得更好</h2>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/70">选择最接近你真实感受的选项即可。共 4 小步，反馈会直接用于下一轮产品迭代。</p>
          </div>
          <span className="text-sm text-primary-foreground/55">{step + 1} / 4</span>
        </div>

        <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-accent transition-all" style={{ width: `${(step + 1) * 25}%` }} /></div>

        <div className="mt-8 rounded-[1.35rem] bg-background p-5 text-foreground sm:p-8">
          {step === 0 && <>
            <Question title="这份分析对你实际准备这个岗位有帮助吗？" required />
            <div className="mt-4 grid gap-2 sm:grid-cols-5">{helpfulness.map(([value, label]) => <Choice key={value} selected={overall === value} onClick={() => setOverall(value)} label={label} />)}</div>
            <Question title="哪些部分对你最有帮助？" hint="可多选" />
            <MultiSelect options={helpfulParts} selected={selectedHelpful} onChange={setSelectedHelpful} />
            <OtherInput group="helpfulParts" selected={selectedHelpful} values={otherDetails} onChange={setOtherDetails} />
          </>}
          {step === 1 && <>
            <Question title="分析准确性有没有出现这些问题？" hint="可多选" />
            <MultiSelect options={accuracyIssues} selected={selectedAccuracy} onChange={setSelectedAccuracy} exclusiveValues={["no_obvious_issue"]} />
            <OtherInput group="accuracyIssues" selected={selectedAccuracy} values={otherDetails} onChange={setOtherDetails} />
            <Question title="分析内容有没有下面这些问题？" hint="可多选" />
            <MultiSelect options={contentIssues} selected={selectedContent} onChange={setSelectedContent} exclusiveValues={["content_appropriate"]} />
            <OtherInput group="contentIssues" selected={selectedContent} values={otherDetails} onChange={setOtherDetails} />
          </>}
          {step === 2 && <>
            <Question title="关于生成的面试问题，你觉得？" hint="可多选" />
            <MultiSelect options={interviewOptions} selected={selectedInterview} onChange={setSelectedInterview} />
            <OtherInput group="interviewFeedback" selected={selectedInterview} values={otherDetails} onChange={setOtherDetails} />
            <Question title="使用网页过程中，哪些地方需要优化？" hint="可多选" />
            <MultiSelect options={uiOptions} selected={selectedUi} onChange={setSelectedUi} exclusiveValues={["no_obvious_issue"]} />
            <OtherInput group="uiIssues" selected={selectedUi} values={otherDetails} onChange={setOtherDetails} />
          </>}
          {step === 3 && <>
            <Question title="下一版产品最需要改什么？" hint="可多选" />
            <MultiSelect options={priorityOptions} selected={selectedPriorities} onChange={setSelectedPriorities} />
            <OtherInput group="nextVersionPriorities" selected={selectedPriorities} values={otherDetails} onChange={setOtherDetails} />
            <div className="mt-8 space-y-5 border-t border-primary/10 pt-8">
              <OpenQuestion label="如果下一版只能改一个地方，你最希望我优先改什么？" value={openResponses.singlePriority} required onChange={(value) => setOpenResponses((current) => ({ ...current, singlePriority: value }))} />
              <OpenQuestion label="有没有哪一处让你产生过“这个网页好像没有理解我”的感觉？如果有，请告诉我具体是哪一部分。" value={openResponses.misunderstoodMoment} onChange={(value) => setOpenResponses((current) => ({ ...current, misunderstoodMoment: value }))} />
              <OpenQuestion label="如果这个产品只能保留一个功能，你最希望保留哪个？为什么？" value={openResponses.keepOneFeature} onChange={(value) => setOpenResponses((current) => ({ ...current, keepOneFeature: value }))} />
              <OpenQuestion label="有没有什么你原本以为这个网页会告诉你，但最后没有告诉你的？" value={openResponses.missingExpectation} onChange={(value) => setOpenResponses((current) => ({ ...current, missingExpectation: value }))} />
            </div>
          </>}

          {error && <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <div className="mt-8 flex items-center justify-between border-t border-primary/10 pt-6">
            <button type="button" disabled={step === 0} onClick={() => { setError(""); setStep((current) => current - 1); }} className="flex items-center gap-2 text-sm text-muted-foreground disabled:invisible"><ArrowLeft className="size-4" /> 上一步</button>
            {step < 3 ? (
              <button type="button" onClick={() => { if (step === 0 && !overall) { setError("请先完成整体体验评价。"); return; } setError(""); setStep((current) => current + 1); }} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">下一步 <ArrowRight className="size-4" /></button>
            ) : (
              <button type="button" onClick={submitFeedback} disabled={submitState === "submitting"} className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{submitState === "submitting" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} 提交反馈</button>
            )}
          </div>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">提交后会保存匿名场景信息、选择项、文字反馈和本次报告的结构化摘要，不保存原始 JD 或简历。请勿在反馈中填写姓名、手机号等身份信息。</p>
        </div>
      </div>
    </section>
  );
}

function Question({ title, hint, required }: { title: string; hint?: string; required?: boolean }) {
  return <div className="mt-8 first:mt-0"><h3 className="text-base font-semibold text-primary">{title}{required && <span className="ml-1 text-accent">*</span>}</h3>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>;
}

function Choice({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`rounded-xl border px-3 py-3 text-sm transition ${selected ? "border-primary bg-primary text-primary-foreground" : "border-primary/10 bg-card text-foreground hover:border-primary/25"}`}>{label}</button>;
}

function MultiSelect<T extends string>({ options, selected, onChange, exclusiveValues = [] }: { options: ReadonlyArray<readonly [T, string]>; selected: T[]; onChange: (value: T[]) => void; exclusiveValues?: T[] }) {
  function toggle(value: T) {
    if (exclusiveValues.includes(value)) { onChange(selected.includes(value) ? [] : [value]); return; }
    const withoutExclusive = selected.filter((item) => !exclusiveValues.includes(item));
    onChange(withoutExclusive.includes(value) ? withoutExclusive.filter((item) => item !== value) : [...withoutExclusive, value]);
  }
  return <div className="mt-4 flex flex-wrap gap-2">{options.map(([value, label]) => <button type="button" key={value} aria-pressed={selected.includes(value)} onClick={() => toggle(value)} className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${selected.includes(value) ? "border-primary/35 bg-primary/[0.07] text-primary" : "border-primary/10 bg-card text-muted-foreground hover:border-primary/25"}`}>{selected.includes(value) && <Check className="size-3.5" />}{label}</button>)}</div>;
}

function OtherInput({ group, selected, values, onChange }: { group: string; selected: string[]; values: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  if (!selected.includes("other")) return null;
  return <input value={values[group] ?? ""} onChange={(event) => onChange({ ...values, [group]: event.target.value })} maxLength={1000} placeholder="请补充说明其他情况" className="mt-3 w-full rounded-xl border border-primary/10 bg-background px-4 py-3 text-sm outline-none focus:border-primary/35" />;
}

function OpenQuestion({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block text-sm font-medium leading-6 text-primary">{label}{required && <span className="ml-1 text-accent">*</span>}<textarea value={value} onChange={(event) => onChange(event.target.value)} maxLength={2000} rows={3} className="mt-2 w-full resize-y rounded-xl border border-primary/10 bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none focus:border-primary/35" /></label>;
}
