"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Scale,
  Sparkles,
  Trash2,
} from "lucide-react";

import { BetaFeedback } from "@/components/feedback/beta-feedback";
import { AdviceCard } from "@/components/report/advice-card";
import { AbilityRadar } from "@/components/report/ability-radar";
import { ActionPlan } from "@/components/report/action-plan";
import { DirectionMatch } from "@/components/report/direction-match";
import { MatchCard } from "@/components/report/match-card";
import { RequirementEvidence } from "@/components/report/requirement-evidence";
import { ResumeRewrite } from "@/components/report/resume-rewrite";
import { mockReports } from "@/lib/mockReport";
import { REPORT_STORAGE_KEY, clearCurrentAnalysisData } from "@/lib/reportStorage";
import type { ReportData } from "@/types/report";

export default function ReportPage() {
  const router = useRouter();
  const report = useSyncExternalStore(subscribeToReport, getStoredReport, getServerReport);

  useEffect(() => {
    if (!report) router.replace("/upload");
  }, [report, router]);

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-muted-foreground">
        <div><Sparkles className="mx-auto size-6 animate-pulse text-accent" /><p className="mt-4 text-sm">未找到本次分析报告，正在返回上传页…</p></div>
      </main>
    );
  }

  const alternativeReports =
    report.source === "mock"
      ? mockReports
          .filter((candidate) => candidate.id !== report.id)
          .map((candidate) => ({
            id: candidate.id,
            targetRole: candidate.targetRole,
            practiceArea: candidate.jobClassification.practiceArea,
            matchScore: candidate.overallScore ?? 0,
          }))
      : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/[0.08] bg-background/95 px-6 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <span className="flex size-9 items-center justify-center rounded-full border border-accent/40 bg-card">
              <Scale className="size-4" strokeWidth={1.5} />
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] sm:inline">Legal Career Copilot</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="size-3.5" />
            返回首页
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-primary/[0.08] px-6 py-20 sm:py-24">
        <div className="pointer-events-none absolute right-[7%] top-1/2 size-64 -translate-y-1/2 rounded-full border border-primary/[0.04] sm:size-96" />
        <div className="pointer-events-none absolute right-[12%] top-1/2 size-44 -translate-y-1/2 rounded-full border border-accent/[0.08] sm:size-72" />
        <div className="relative mx-auto max-w-6xl">
          {report.source === "mock" && (
            <div className="mb-8 rounded-xl border border-accent/30 bg-accent/[0.08] px-4 py-3 text-sm leading-6 text-primary">
              <strong>示例报告 / Demo</strong>：以下内容不是根据你的材料生成，且不会进入 Beta 反馈统计。
            </div>
          )}
          <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-primary/70">
                <span className="h-px w-9 bg-accent" />
                AI CAREER ANALYSIS
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-primary sm:text-6xl">法律职业岗位分析报告</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">{report.summary}</p>
            </div>

            <div className="grid min-w-[290px] grid-cols-2 overflow-hidden rounded-2xl border border-primary/[0.09] bg-card shadow-[0_20px_60px_-45px_rgba(85,23,36,0.4)]">
              <div className="border-r border-primary/[0.08] p-5">
                <p className="text-xs tracking-[0.12em] text-muted-foreground">目标方向</p>
                <p className="mt-2 text-base font-medium text-primary">{report.targetRole}</p>
              </div>
              <div className="p-5">
                <p className="text-xs tracking-[0.12em] text-muted-foreground">分析状态</p>
                <p className="mt-2 flex items-center gap-1.5 text-base font-medium text-primary">
                  <CheckCircle2 className="size-3.5 text-accent" />
                  {report.source === "deepseek" ? "DeepSeek 实时分析" : report.status}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-4 border-t border-primary/[0.08] px-5 py-3 text-sm text-muted-foreground">
                <span>综合匹配度</span>
                {report.overallScore === null ? (
                  <span className="text-right text-sm text-primary/65">当前材料不足，暂无法分析。</span>
                ) : (
                  <span className="font-display text-lg font-semibold text-primary">{report.overallScore}%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="01 / JOB PROFILE"
            title="岗位识别与画像"
            description="AI 先识别职业轨道与细分业务领域，再生成与该岗位直接相关的能力模型。"
          />
          <div className="mt-9 grid items-start gap-5 lg:grid-cols-[1.35fr_0.85fr]">
            <AbilityRadar skills={report.generalSkills} profileLabel={report.targetRole} />
            <DirectionMatch
              targetRole={report.targetRole}
              classification={report.jobClassification}
              overallScore={report.overallScore}
              specificSkills={report.jobSpecificSkills}
              alternatives={alternativeReports}
            />
          </div>
        </div>
      </section>

      <section className="border-y border-primary/[0.08] bg-secondary/45 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="02 / JD EVIDENCE MAP"
            title="JD 要求与简历匹配"
            description="快速核验硬门槛、证据充分度和可投递空间。当前未证明仅表示简历缺少证据，不代表用户不具备。"
          />
          <div className="mt-9">
            <RequirementEvidence requirements={report.jobRequirements} matches={report.resumeEvidenceMatches} />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="03 / EXPERIENCE MATCH"
            title="核心经历匹配"
            description="将最相关的真实经历整理为可用于简历和面试表达的岗位证据。"
          />
          {report.experienceMatches.length ? (
            <>
              <div className="mt-9 grid gap-5 lg:grid-cols-3">
                {report.experienceMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-primary/10 bg-card px-4 py-2">法律专业能力</span>
                <ArrowRight className="size-4 text-accent" />
                <span className="rounded-full border border-primary/10 bg-card px-4 py-2">岗位能力证明</span>
                <ArrowRight className="size-4 text-accent" />
                <span className="rounded-full border border-primary/10 bg-card px-4 py-2">面试表达素材</span>
              </div>
            </>
          ) : (
            <EmptyAnalysis />
          )}
        </div>
      </section>

      <section className="border-y border-primary/[0.08] bg-secondary/45 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="04 / EXPRESSION DIAGNOSIS"
            title="简历表达诊断"
            description="围绕目标岗位提高经历的信息密度；缺少事实时只提出确认问题，不虚构数字、结果或职责。"
          />
          <div className="mt-9">
            <ResumeRewrite suggestions={report.resumeRewriteSuggestions} />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="05 / APPLICATION ACTIONS"
              title="投递与面试补强建议"
              description="只保留与 JD 和现有证据直接相关、能够在投递或面试前完成的具体动作。"
            />
            <div className="flex shrink-0 items-center gap-2 text-xs text-primary/65">
              <Sparkles className="size-4 text-accent" />
              AI 建议行动顺序
            </div>
          </div>
          <div className="mt-9">
            <ActionPlan actions={report.actionPlan} />
          </div>
        </div>
      </section>

      <section className="border-y border-primary/[0.08] bg-secondary/45 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="06 / INTERVIEW PREP"
              title="高概率面试问题"
              description="围绕 JD 核心要求与真实经历生成 10 道问题；展开查看追问路径和回答组织重点。"
            />
            <div className="flex shrink-0 items-center gap-2 text-xs text-primary/65">
              <Sparkles className="size-4 text-accent" />
              基于当前报告生成
            </div>
          </div>
          <div className="mt-9 overflow-hidden rounded-[1.35rem] border border-primary/[0.1] bg-card shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)]">
            {report.interviewQuestions.map((question, index) => (
              <AdviceCard key={question.id} question={question} index={index} />
            ))}
          </div>
        </div>
      </section>

      {report.source === "deepseek" && <BetaFeedback report={report} />}

      <footer className="px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 border-t border-primary/[0.08] pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div><span>Legal Career Copilot · AI 职业分析报告</span><span className="ml-3">生成于 {report.generatedAt}</span></div>
          <button
            type="button"
            onClick={() => { clearCurrentAnalysisData(); router.replace("/upload"); }}
            className="flex w-fit items-center gap-2 rounded-full border border-primary/10 px-3 py-2 transition hover:border-primary/25 hover:text-primary"
          >
            <Trash2 className="size-3.5" /> 清除本次分析数据
          </button>
        </div>
      </footer>
    </main>
  );
}

function isStoredReport(value: unknown): value is ReportData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const report = value as Partial<ReportData>;
  return Boolean(
    report.analysisId &&
      report.sessionId &&
      report.promptVersion &&
      report.productVersion &&
      report.modelVersion &&
      report.analyzedAt &&
      report.analysisContext &&
      report.jobClassification &&
      Array.isArray(report.generalSkills) &&
      report.generalSkills.every(
        (skill) =>
          "id" in skill &&
          "jdRequirement" in skill &&
          "resumeEvidenceScore" in skill &&
          "evidenceLevel" in skill &&
          "evidenceSources" in skill &&
          Array.isArray(skill.evidenceSources),
      ) &&
      Array.isArray(report.jobSpecificSkills) &&
      Array.isArray(report.jobRequirements) &&
      Array.isArray(report.resumeEvidenceMatches) &&
      Array.isArray(report.resumeRewriteSuggestions) &&
      Array.isArray(report.experienceMatches) &&
      Array.isArray(report.interviewQuestions) &&
      report.interviewQuestions.length >= 8 &&
      report.interviewQuestions.every(
        (question) => "type" in question && "followUpQuestions" in question && "answerGuidance" in question,
      ) &&
      Array.isArray(report.actionPlan) &&
      report.actionPlan.every((action) => "type" in action && "action" in action),
  );
}

let cachedReportSource: string | null | undefined;
let cachedReport: ReportData | null = null;

function subscribeToReport() {
  return () => undefined;
}

function getStoredReport() {
  const storedReport = sessionStorage.getItem(REPORT_STORAGE_KEY);
  if (storedReport === cachedReportSource) return cachedReport;

  cachedReportSource = storedReport;
  cachedReport = null;
  if (!storedReport) return cachedReport;

  try {
    const parsed: unknown = JSON.parse(storedReport);
    if (isStoredReport(parsed)) cachedReport = parsed;
  } catch {
    cachedReport = null;
  }
  return cachedReport;
}

function getServerReport() {
  return null;
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/60">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyAnalysis() {
  return (
    <div className="mt-9 rounded-[1.35rem] border border-primary/[0.09] bg-card px-6 py-10 text-center text-base leading-7 text-muted-foreground">
      当前材料不足，暂无法分析。
    </div>
  );
}
