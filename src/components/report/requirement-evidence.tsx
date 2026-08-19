import { CheckCircle2, ChevronDown, CircleAlert, CircleHelp, MinusCircle } from "lucide-react";
import type { ReactNode } from "react";

import type { JobRequirement, ResumeEvidenceMatch } from "@/types/report";

type RequirementEvidenceProps = {
  requirements: JobRequirement[];
  matches: ResumeEvidenceMatch[];
};

const categoryConfig: Record<JobRequirement["category"], { label: string; className: string }> = {
  hard_requirement: { label: "硬性要求", className: "bg-primary text-primary-foreground" },
  soft_requirement: { label: "软性要求", className: "bg-primary/[0.06] text-primary" },
  preferred_requirement: { label: "偏好条件", className: "bg-accent/10 text-accent" },
};

const importanceLabels: Record<JobRequirement["importance"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const sourceLabels: Record<ResumeEvidenceMatch["sourceType"], string> = {
  education: "教育背景",
  internship: "实习 / 工作",
  project: "项目 / 科研",
  competition: "比赛经历",
  campus: "校园经历",
  language: "语言资质",
  qualification: "职业资格",
};

const statusConfig: Record<
  ResumeEvidenceMatch["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  met: { label: "已满足", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  partial: { label: "部分匹配", icon: MinusCircle, className: "bg-amber-50 text-amber-700" },
  not_evidenced: { label: "当前未证明", icon: CircleHelp, className: "bg-secondary text-primary/65" },
  not_met: { label: "明确不满足", icon: CircleAlert, className: "bg-primary/10 text-primary" },
};

export function RequirementEvidence({ requirements, matches }: RequirementEvidenceProps) {
  const matchByRequirement = new Map(matches.map((match) => [match.requirementId, match]));
  const hardRequirements = requirements.filter((requirement) => requirement.category === "hard_requirement");
  const metHardRequirements = hardRequirements.filter(
    (requirement) => matchByRequirement.get(requirement.id)?.status === "met",
  ).length;
  const missingHardEvidence = hardRequirements.filter((requirement) => {
    const status = matchByRequirement.get(requirement.id)?.status;
    return status === "not_evidenced" || status === undefined;
  }).length;

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-primary/[0.1] bg-card shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)]">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-primary/[0.08] bg-primary/[0.025] px-5 py-4 text-sm text-muted-foreground sm:px-6">
        <span>
          共 <strong className="font-semibold text-primary">{requirements.length}</strong> 项要求
        </span>
        <span>
          硬性要求 <strong className="font-semibold text-primary">{metHardRequirements}/{hardRequirements.length}</strong> 已满足
        </span>
        {missingHardEvidence > 0 && (
          <span className="flex items-center gap-1.5 text-primary/75">
            <CircleHelp className="size-3.5" />
            {missingHardEvidence} 项硬门槛当前缺少证据
          </span>
        )}
        <span className="ml-auto text-xs">点击任一行查看判断依据</span>
      </div>

      <div className="hidden grid-cols-[1.35fr_0.55fr_0.4fr_1.45fr_0.7fr_1.6rem] gap-4 border-b border-primary/[0.08] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary/45 lg:grid">
        <span>JD 要求</span>
        <span>要求性质</span>
        <span>优先级</span>
        <span>简历证据摘要</span>
        <span>匹配状态</span>
        <span />
      </div>

      <div className="divide-y divide-primary/[0.07]">
        {requirements.map((requirement) => {
          const match = matchByRequirement.get(requirement.id);
          const status = statusConfig[match?.status ?? "not_evidenced"];
          const StatusIcon = status.icon;
          const evidenceSummary = match?.resumeEvidence.length
            ? match.resumeEvidence.slice(0, 2).join(" · ")
            : "当前材料未提供明确证据";

          return (
            <details key={requirement.id} className="group">
              <summary className="grid cursor-pointer list-none gap-3 px-5 py-4 transition hover:bg-primary/[0.018] [&::-webkit-details-marker]:hidden sm:px-6 lg:grid-cols-[1.35fr_0.55fr_0.4fr_1.45fr_0.7fr_1.6rem] lg:items-center lg:gap-4">
                <div>
                  <p className="text-base font-medium leading-6 text-primary">{requirement.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground lg:hidden">{requirement.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:block">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-medium ${categoryConfig[requirement.category].className}`}>
                    {categoryConfig[requirement.category].label}
                  </span>
                  <span className="text-sm text-muted-foreground lg:hidden">{importanceLabels[requirement.importance]}优先</span>
                </div>
                <span className="hidden text-sm text-foreground/70 lg:block">{importanceLabels[requirement.importance]}</span>
                <p className="line-clamp-2 text-sm leading-6 text-foreground/65">{evidenceSummary}</p>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium ${status.className}`}>
                  <StatusIcon className="size-3.5" strokeWidth={1.7} />
                  {status.label}
                </span>
                <ChevronDown className="hidden size-4 text-primary/40 transition group-open:rotate-180 lg:block" />
              </summary>

              <div className="grid gap-5 border-t border-primary/[0.06] bg-secondary/30 px-5 py-5 sm:px-6 lg:grid-cols-3">
                <Detail label="JD 原文 / 判断依据">
                  <p>“{requirement.jdEvidence}”</p>
                  <p className="mt-2 text-foreground/50">{requirement.description}</p>
                </Detail>
                <Detail label={`简历具体证据${match ? ` · ${sourceLabels[match.sourceType]}` : ""}`}>
                  {match?.resumeEvidence.length ? (
                    <ul className="space-y-1.5">
                      {match.resumeEvidence.map((evidence) => (
                        <li key={evidence}>· {evidence}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>当前简历中未找到足以证明该项要求的具体经历。</p>
                  )}
                </Detail>
                <Detail label="AI 匹配解释">
                  <p>{match?.analysis ?? "当前材料不足以核验；这不代表用户不具备该能力。"}</p>
                </Detail>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">{label}</p>
      <div className="mt-2 text-[15px] leading-6 text-foreground/70">{children}</div>
    </div>
  );
}
