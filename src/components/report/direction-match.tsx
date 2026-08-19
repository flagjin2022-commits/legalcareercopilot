import { ArrowUpRight, CheckCircle2, Compass, ScanSearch } from "lucide-react";

import type { JobClassification, JobSpecificSkill } from "@/types/report";

export type DirectionAlternative = {
  id: string;
  targetRole: string;
  practiceArea: string;
  matchScore: number;
};

type DirectionMatchProps = {
  targetRole: string;
  classification: JobClassification;
  overallScore: number | null;
  specificSkills: JobSpecificSkill[];
  alternatives: DirectionAlternative[];
};

export function DirectionMatch({
  targetRole,
  classification,
  overallScore,
  specificSkills,
  alternatives,
}: DirectionMatchProps) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-primary/[0.09] bg-card shadow-[0_22px_65px_-48px_rgba(85,23,36,0.4)]">
      <div className="bg-primary p-7 text-primary-foreground sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">AI 岗位识别</p>
          <CheckCircle2 className="size-4 text-accent" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold">{targetRole}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Tag>{classification.careerTrack}</Tag>
          <Tag>{classification.practiceArea}</Tag>
          <Tag>{classification.roleLevel}</Tag>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-5 border-t border-white/10 pt-6">
          <div>
            <p className="text-[10px] tracking-[0.14em] text-primary-foreground/55">综合匹配度</p>
            <div className="mt-1">
              {overallScore === null ? (
                <span className="block max-w-36 text-sm leading-6 text-primary-foreground/70">当前材料不足，暂无法分析。</span>
              ) : (
                <>
                  <span className="font-display text-4xl font-semibold">{overallScore}</span>
                  <span className="ml-1 text-sm text-primary-foreground/55">%</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.14em] text-primary-foreground/55">分类置信度</p>
            <div className="mt-1">
              <span className="font-display text-4xl font-semibold">{classification.confidence}</span>
              <span className="ml-1 text-sm text-primary-foreground/55">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-7 sm:p-8">
        <div className="flex items-center gap-2 text-primary">
          <ScanSearch className="size-4" strokeWidth={1.5} />
          <p className="text-xs font-semibold">岗位专项能力</p>
        </div>
        <div className="mt-4 space-y-3">
          {specificSkills.map((skill) => (
            <div key={skill.id} className="rounded-xl bg-secondary/45 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-foreground">{skill.name}</p>
                <span className="text-right">
                  <span className="font-display text-sm font-semibold text-primary">{skill.requiredScore}</span>
                  <span className="ml-1 text-[8px] text-muted-foreground">岗位要求</span>
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{skill.evidence}</p>
            </div>
          ))}
        </div>

        {alternatives.length > 0 && (
          <div className="mt-7 border-t border-primary/[0.08] pt-6">
            <div className="flex items-center gap-2 text-primary">
              <Compass className="size-4" strokeWidth={1.5} />
              <p className="text-xs font-semibold">其他案例方向</p>
            </div>
            <div className="mt-4 space-y-4">
              {alternatives.map((alternative) => (
                <div key={alternative.id}>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="text-foreground/75">{alternative.targetRole}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">{alternative.practiceArea}</p>
                    </div>
                    <span className="flex items-center gap-1 font-medium text-primary">
                      {alternative.matchScore}%
                      <ArrowUpRight className="size-3" />
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/[0.07]">
                    <div className="h-full rounded-full bg-primary/35" style={{ width: `${alternative.matchScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] tracking-[0.08em] text-primary-foreground/70">
      {children}
    </span>
  );
}
