import { ChevronDown, CircleHelp, CornerDownRight } from "lucide-react";

import type { InterviewAnswerGuidance, InterviewQuestion } from "@/types/report";

type AdviceCardProps = {
  question: InterviewQuestion;
  index: number;
};

const typeLabels: Record<InterviewQuestion["type"], string> = {
  resume_deep_dive: "简历深挖",
  jd_professional: "JD 专项",
  scenario: "情景 / 案例",
  motivation_fit: "动机与匹配",
  language: "英文 / 涉外",
};

const guidanceLabels: Array<{
  key: Exclude<keyof InterviewAnswerGuidance, "missingFacts">;
  label: string;
}> = [
  { key: "background", label: "经历背景" },
  { key: "personalAction", label: "个人动作" },
  { key: "legalReasoning", label: "法律判断" },
  { key: "output", label: "工作产出" },
  { key: "resultOrUsage", label: "最终用途 / 结果" },
];

export function AdviceCard({ question, index }: AdviceCardProps) {
  const guidance = guidanceLabels.filter(({ key }) => question.answerGuidance[key]);

  return (
    <details className="group border-b border-primary/[0.07] last:border-0">
      <summary className="grid cursor-pointer list-none gap-3 px-5 py-5 transition hover:bg-primary/[0.018] [&::-webkit-details-marker]:hidden sm:px-6 lg:grid-cols-[3rem_1fr_7.5rem_1.7rem] lg:items-start lg:gap-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-base italic text-accent">{String(index + 1).padStart(2, "0")}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium lg:hidden ${question.probability === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary/70"}`}>
            {question.probability === "high" ? "高概率" : "中概率"}
          </span>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/[0.05] px-3 py-1.5 text-xs font-medium text-primary">{typeLabels[question.type]}</span>
            <span className="hidden text-xs text-muted-foreground lg:inline">{question.probability === "high" ? "高概率" : "中概率"}</span>
          </div>
          <h3 className="mt-2.5 text-lg font-semibold leading-7 text-primary">{question.question}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground/70">考察：</span>
            {question.focusPoints.join(" · ")}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground/70">建议经历：</span>
            {question.suggestedExperience}
          </p>
        </div>

        <span className={`hidden w-fit rounded-full px-3 py-1.5 text-xs font-medium lg:inline-flex ${question.probability === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary/70"}`}>
          {question.probability === "high" ? "高概率" : "中概率"}
        </span>
        <ChevronDown className="hidden size-4 text-primary/40 transition group-open:rotate-180 lg:block" />
      </summary>

      <div className="grid gap-7 border-t border-primary/[0.06] bg-secondary/30 px-5 py-6 sm:px-6 lg:grid-cols-[0.85fr_1.4fr] lg:pl-[5.25rem]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/60">可能追问</p>
          <ul className="mt-3 space-y-3">
            {question.followUpQuestions.map((followUp) => (
              <li key={followUp} className="flex gap-2 text-[15px] leading-6 text-foreground/70">
                <CornerDownRight className="mt-1 size-3.5 shrink-0 text-accent" />
                {followUp}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/60">回答重点 · 基于简历事实</p>
          {guidance.length > 0 ? (
            <div className="mt-3 divide-y divide-primary/[0.07] overflow-hidden rounded-xl border border-primary/[0.08] bg-card">
              {guidance.map(({ key, label }) => (
                <div key={key} className="grid gap-1.5 px-4 py-3.5 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
                  <p className="text-sm font-medium text-primary/75">{label}</p>
                  <p className="text-[15px] leading-6 text-foreground/75">{question.answerGuidance[key]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-primary/[0.08] bg-card px-4 py-4 text-[15px] leading-6 text-muted-foreground">
              当前材料不足，暂无法分析。
            </p>
          )}

          {question.answerGuidance.missingFacts.length > 0 && (
            <div className="mt-3 rounded-xl bg-primary/[0.045] px-4 py-3.5">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <CircleHelp className="size-4 text-accent" />
                建议面试前补充确认
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {question.answerGuidance.missingFacts.join(" · ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
