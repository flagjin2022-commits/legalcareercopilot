import { ArrowRight, BriefcaseBusiness, FilePenLine, ListChecks } from "lucide-react";

import type { ActionPlanItem } from "@/types/report";

type ActionPlanProps = {
  actions: ActionPlanItem[];
};

const typeConfig: Record<ActionPlanItem["type"], { label: string; icon: typeof FilePenLine }> = {
  resume_expression: { label: "简历表达补强", icon: FilePenLine },
  interview_preparation: { label: "面试材料准备", icon: BriefcaseBusiness },
  evidence_improvement: { label: "短期证据补强", icon: ListChecks },
};

export function ActionPlan({ actions }: ActionPlanProps) {
  const sortedActions = [...actions].sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-primary/[0.1] bg-card shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)]">
      <div className="divide-y divide-primary/[0.07]">
        {sortedActions.map((action, index) => {
          const config = typeConfig[action.type];
          const Icon = config.icon;

          return (
            <article key={action.id} className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[3rem_1fr_1.15fr_1.3fr] lg:items-start lg:gap-6">
              <div className="flex items-center justify-between lg:block">
                <span className="font-display text-sm italic text-accent">{String(index + 1).padStart(2, "0")}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium lg:hidden ${action.priority === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary/70"}`}>
                  {action.priority === "high" ? "高优先" : "中优先"}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.05] px-2.5 py-1 text-xs text-primary">
                    <Icon className="size-3" />
                    {config.label}
                  </span>
                  <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium lg:inline-flex ${action.priority === "high" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary/70"}`}>
                    {action.priority === "high" ? "高优先" : "中优先"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-6 text-primary">{action.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">对应 JD：{action.targetRequirement}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/50">当前证据 · 为什么优先</p>
                <p className="mt-2 text-sm leading-6 text-foreground/70">{action.currentEvidence}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.whyPriority}</p>
              </div>

              <div className="rounded-xl bg-secondary/45 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">
                  明确行动
                  <ArrowRight className="size-3 text-accent" />
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/75">{action.action}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
