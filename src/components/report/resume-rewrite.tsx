import { ArrowRight, CircleAlert, PencilLine } from "lucide-react";

import type { ResumeRewriteSuggestion } from "@/types/report";

type ResumeRewriteProps = {
  suggestions: ResumeRewriteSuggestion[];
};

const issueLabels: Record<ResumeRewriteSuggestion["issue"], string> = {
  too_generic: "表达过于笼统",
  weak_verb: "动作信息较弱",
  missing_scope: "缺少工作范围",
  missing_output: "缺少具体产出",
  missing_result: "缺少用途或结果",
  low_relevance: "岗位相关性较弱",
  other: "需要进一步澄清",
};

export function ResumeRewrite({ suggestions }: ResumeRewriteProps) {
  if (!suggestions.length) {
    return (
      <div className="rounded-[1.35rem] border border-primary/[0.09] bg-card p-8 text-center text-sm text-muted-foreground">
        当前材料不足，暂无法分析。
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {suggestions.map((suggestion, index) => (
        <article
          key={suggestion.id}
          className="rounded-[1.35rem] border border-primary/[0.09] bg-card p-6 shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)] sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-primary/[0.05] px-3 py-1.5 text-[13px] tracking-[0.08em] text-primary">
              {issueLabels[suggestion.issue]}
            </span>
            <span className="font-display text-sm italic text-accent">0{index + 1}</span>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary/55">原始表达</p>
          <p className="mt-2 rounded-xl bg-secondary/50 p-4 text-base leading-7 text-foreground/70">“{suggestion.originalText}”</p>

          <div className="my-4 flex items-center gap-3 text-primary/25">
            <span className="h-px flex-1 bg-primary/10" />
            <ArrowRight className="size-4" />
            <span className="h-px flex-1 bg-primary/10" />
          </div>

          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary/55">
            <PencilLine className="size-3.5 text-accent" />
            针对「{suggestion.targetRequirement}」的建议表达
          </p>
          <p className="mt-3 font-display text-lg leading-8 text-primary">{suggestion.suggestedText}</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{suggestion.reason}</p>

          {suggestion.needsUserConfirmation && suggestion.missingFacts?.length ? (
            <div className="mt-5 rounded-xl border border-accent/20 bg-accent/[0.045] p-4">
              <p className="flex items-center gap-2 text-[10px] font-medium text-primary">
                <CircleAlert className="size-3.5 text-accent" />
                需要你确认以下事实
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestion.missingFacts.map((fact) => (
                  <span key={fact} className="rounded-full border border-primary/10 bg-card px-2.5 py-1 text-[13px] text-muted-foreground">
                    {fact}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-accent/[0.045] px-4 py-3 text-[10px] text-accent">
              基于已有事实优化，无需补充新信息
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
