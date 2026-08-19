import { ArrowDown, BriefcaseBusiness, Sparkles, UserRound } from "lucide-react";

import type { ExperienceMatch } from "@/types/report";

type MatchCardProps = {
  match: ExperienceMatch;
};

export function MatchCard({ match }: MatchCardProps) {
  const level = match.matchLevel ?? "partial_match";
  const levelLabels = {
    strong_match: "强匹配",
    partial_match: "部分匹配",
    related_evidence: "间接相关",
    not_found: "当前未找到",
  } as const;

  return (
    <article className="rounded-[1.35rem] border border-primary/[0.09] bg-card p-6 shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)] sm:p-7">
      <div className="flex items-start justify-between gap-5">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">岗位能力</p>
          <div className="mt-3 flex items-center gap-2.5">
            <BriefcaseBusiness className="size-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-semibold text-primary">{match.requiredSkill}</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="font-display text-3xl font-semibold text-primary">{match.score}</span>
          <span className="text-sm text-primary/60">%</span>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-muted-foreground">证据覆盖</p>
          <span className="mt-2 inline-flex rounded-full bg-primary/[0.06] px-2.5 py-1 text-xs font-medium text-primary">
            {levelLabels[level]}
          </span>
        </div>
      </div>

      <div className="my-4 flex items-center gap-3 text-primary/25">
        <span className="h-px flex-1 bg-primary/10" />
        <ArrowDown className="size-4" strokeWidth={1.4} />
        <span className="h-px flex-1 bg-primary/10" />
      </div>

      <div className="rounded-xl bg-secondary/65 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">匹配经历</p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <UserRound className="size-4 text-primary" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground">{match.experience}</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{match.evidence}</p>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-primary/[0.07]">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${match.score}%` }} />
      </div>

      <div className="mt-5 border-t border-primary/[0.08] pt-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary/65">
          <Sparkles className="size-3.5 text-accent" />
          AI 分析依据
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{match.reasoning}</p>
      </div>
    </article>
  );
}
