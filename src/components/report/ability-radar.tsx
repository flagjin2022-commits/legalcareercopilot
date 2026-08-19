"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { buildAbilityViewData, getPlottableResumeEvidence } from "@/lib/abilityViewData";
import type { GeneralSkill } from "@/types/report";

type AbilityRadarProps = {
  skills: GeneralSkill[];
  profileLabel: string;
};

const evidenceLabels = {
  direct: "直接证据",
  transferable: "可迁移证据",
  foundational: "基础证据",
  insufficient: "当前证据不足",
} as const;

export function AbilityRadar({ skills, profileLabel }: AbilityRadarProps) {
  // Radar and cards intentionally consume this single normalized array.
  const abilityData = buildAbilityViewData(skills);
  const hasMissingEvidence = abilityData.some((skill) => skill.resumeEvidenceScore === null);
  const plottableEvidence = getPlottableResumeEvidence(abilityData);

  return (
    <article className="rounded-[1.5rem] border border-primary/[0.09] bg-card p-6 shadow-[0_22px_65px_-48px_rgba(85,23,36,0.4)] sm:p-8">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">General Legal Skills</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-primary">通用法律职业能力</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {profileLabel} · 当前简历材料对岗位要求的证据支持程度
          </p>
        </div>
        <div className="hidden gap-4 text-[10px] text-muted-foreground sm:flex">
          <Legend color="bg-accent/60" label="JD 要求" />
          <Legend color="bg-primary" label="简历证据支持" />
        </div>
      </div>

      <div className="mt-4 h-[350px] w-full sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={abilityData} cx="50%" cy="50%" outerRadius="63%">
            <PolarGrid stroke="hsl(var(--primary) / 0.13)" gridType="polygon" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground) / 0.72)", fontSize: 11 }} tickLine={false} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="JD 要求"
              dataKey="jdRequirement"
              stroke="hsl(var(--accent) / 0.75)"
              fill="hsl(var(--accent) / 0.1)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              connectNulls={false}
            />
            <Radar
              name="简历证据支持"
              dataKey="resumeEvidenceScore"
              stroke="transparent"
              fill="transparent"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
              shape={<ResumeEvidenceShape />}
            />
            <Tooltip
              formatter={(value, name) => [typeof value === "number" ? `${value} 分` : "暂无足够数据", name]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--primary) / 0.12)",
                borderRadius: "12px",
                boxShadow: "0 18px 45px -28px rgba(85,23,36,0.4)",
                fontSize: "12px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {hasMissingEvidence && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          部分维度当前简历证据不足；缺失维度不绘制数据点，也不参与简历匹配面积计算。当前已量化 {plottableEvidence.length}/5 项。
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-primary/[0.08] pt-5 sm:grid-cols-5">
        {abilityData.map((skill) => (
          <div key={skill.id} className="rounded-xl bg-secondary/45 px-3 py-2.5 text-center">
            <p className="font-display text-lg font-semibold text-primary">
              {skill.resumeEvidenceScore ?? "—"}
            </p>
            <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">{skill.subject}</p>
            <p className="mt-1 text-[8px] text-accent">
              {skill.resumeEvidenceScore === null ? "暂无足够数据" : evidenceLabels[skill.evidenceLevel]} · JD 权重 {skill.weight}%
            </p>
            {skill.evidenceSources.length > 0 && (
              <p className="mt-1.5 line-clamp-2 text-left text-[9px] leading-4 text-muted-foreground" title={skill.evidenceSources.join("；")}>
                证据：{skill.evidenceSources.slice(0, 2).join("；")}
              </p>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

type ResumeRadarPoint = {
  x?: number;
  y?: number;
  value?: unknown;
};

type ResumeEvidenceShapeProps = {
  points?: ResumeRadarPoint[];
};

function ResumeEvidenceShape({ points = [] }: ResumeEvidenceShapeProps) {
  const validPoints = points.filter(
    (point): point is Required<Pick<ResumeRadarPoint, "x" | "y">> & ResumeRadarPoint =>
      typeof point.x === "number" &&
      Number.isFinite(point.x) &&
      typeof point.y === "number" &&
      Number.isFinite(point.y) &&
      typeof point.value === "number" &&
      Number.isFinite(point.value),
  );
  const isComplete = points.length > 0 && validPoints.length === points.length;

  return (
    <g data-resume-radar-state={isComplete ? "complete" : "partial"}>
      {isComplete && validPoints.length >= 3 && (
        <polygon
          points={validPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="hsl(var(--primary) / 0.18)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      )}
      {validPoints.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r={3.5}
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${color}`} />{label}</span>;
}
