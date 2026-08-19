"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleAlert,
  DatabaseBackup,
  FileSearch,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import {
  ANALYSIS_CONTEXT_STORAGE_KEY,
  ANALYSIS_ID_STORAGE_KEY,
  JOB_DESCRIPTION_STORAGE_KEY,
  REPORT_STORAGE_KEY,
  RESUME_TEXT_STORAGE_KEY,
  getOrCreateSessionId,
} from "@/lib/reportStorage";
import { mockReport } from "@/lib/mockReport";
import type { ReportData } from "@/types/report";
import type { AnalysisContext } from "@/types/beta";

const stages = [
  {
    title: "正在分析岗位要求...",
    completedTitle: "岗位要求分析完成",
    description: "识别职业轨道、细分领域与岗位层级",
    icon: FileSearch,
  },
  {
    title: "正在提取岗位能力...",
    completedTitle: "岗位能力提取完成",
    description: "评估通用能力权重并生成岗位专项能力",
    icon: ScanSearch,
  },
  {
    title: "正在生成职业报告...",
    completedTitle: "职业报告生成完成",
    description: "组织岗位画像、JD 匹配与面试准备建议",
    icon: MessageSquareText,
  },
] as const;

let activeAnalysisRequest: Promise<ReportData> | null = null;

export function AnalysisProgress() {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const jobDescription = sessionStorage.getItem(JOB_DESCRIPTION_STORAGE_KEY);
    const resumeText = sessionStorage.getItem(RESUME_TEXT_STORAGE_KEY) ?? undefined;
    const analysisContext = readAnalysisContext();
    const sessionId = getOrCreateSessionId();
    const analysisId = sessionStorage.getItem(ANALYSIS_ID_STORAGE_KEY);
    let cancelled = false;
    let redirectTimer: number | undefined;
    const stageTimers = [
      window.setTimeout(() => setActiveStage(1), 1_100),
      window.setTimeout(() => setActiveStage(2), 2_500),
    ];

    if (!jobDescription || !analysisContext || !analysisId) {
      stageTimers.forEach(window.clearTimeout);
      const missingInputTimer = window.setTimeout(
        () => setError("本次分析资料不完整，请返回上传页面重新填写。"),
        0,
      );
      return () => window.clearTimeout(missingInputTimer);
    }

    requestAnalysis(jobDescription, resumeText, analysisContext, sessionId, analysisId)
      .then((report) => {
        if (cancelled) return;
        stageTimers.forEach(window.clearTimeout);
        sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
        setActiveStage(stages.length);
        redirectTimer = window.setTimeout(() => router.replace("/report"), 850);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        stageTimers.forEach(window.clearTimeout);
        const message = requestError instanceof Error ? requestError.message : "AI 分析失败，请稍后重试";
        setError(`${message}。你可以重新分析，或明确选择示例报告体验页面。`);
      });

    return () => {
      cancelled = true;
      stageTimers.forEach(window.clearTimeout);
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [attempt, router]);

  const progress = error ? 0 : activeStage >= stages.length ? 100 : 18 + activeStage * 31;

  function retry() {
    setError(null);
    setActiveStage(0);
    setAttempt((current) => current + 1);
  }

  function continueWithMock() {
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(mockReport));
    router.replace("/report");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-accent/30 bg-card text-primary shadow-[0_18px_55px_-34px_rgba(85,23,36,0.4)]">
          {error ? <CircleAlert className="size-6" strokeWidth={1.5} /> : <Sparkles className="size-6 text-accent" strokeWidth={1.5} />}
        </div>
        <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary/55">AI Career Analysis</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary sm:text-5xl">
          {error ? "本次分析未能完成" : "正在理解你的职业背景"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {error ?? "DeepSeek 正在识别职业方向、细分业务领域与岗位专项能力。"}
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-primary/[0.09] bg-card p-6 shadow-[0_28px_80px_-50px_rgba(85,23,36,0.45)] sm:p-9">
        <div className="mb-8">
          <div className="flex items-center justify-between text-[10px] tracking-[0.14em] text-muted-foreground">
            <span>分析进度</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/[0.07]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${error ? "bg-primary/25" : "bg-gradient-to-r from-primary to-accent"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {stages.map(({ title, completedTitle, description, icon: Icon }, index) => {
            const completed = !error && activeStage > index;
            const active = !error && activeStage === index;
            return (
              <div
                key={title}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500 sm:p-5 ${
                  active
                    ? "border-primary/25 bg-primary/[0.045]"
                    : completed
                      ? "border-accent/15 bg-accent/[0.025]"
                      : "border-primary/[0.06] opacity-45"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    completed ? "bg-accent/10 text-accent" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {completed ? (
                    <Check className="size-4" strokeWidth={2} />
                  ) : active ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" strokeWidth={1.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${active || completed ? "text-primary" : "text-muted-foreground"}`}>
                    {completed ? completedTitle : title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
                {active && <span className="hidden text-[10px] tracking-[0.14em] text-primary/55 sm:block">PROCESSING</span>}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-7 grid gap-3 border-t border-primary/[0.08] pt-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={retry}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <RotateCcw className="size-4" />
              重新分析
            </button>
            <button
              type="button"
              onClick={continueWithMock}
              className="flex items-center justify-center gap-2 rounded-full border border-primary/15 px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary/[0.04]"
            >
              <DatabaseBackup className="size-4" />
              使用示例报告
            </button>
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        简历文字已在服务端完成提取，并与 JD 一同交由 DeepSeek 分析；当前材料仅暂存在本次浏览器会话中
      </p>
    </div>
  );
}

function requestAnalysis(
  jobDescription: string,
  resumeText: string | undefined,
  analysisContext: AnalysisContext,
  sessionId: string,
  analysisId: string,
) {
  if (!activeAnalysisRequest) {
    activeAnalysisRequest = fetch("/api/analyze-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription, resumeText, analysisContext, sessionId, analysisId }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as ReportData | { error?: { message?: string } };
        if (!response.ok) {
          const message = "error" in payload ? payload.error?.message : undefined;
          throw new Error(message || "AI 分析失败");
        }
        return payload as ReportData;
      })
      .finally(() => {
        activeAnalysisRequest = null;
      });
  }
  return activeAnalysisRequest;
}

function readAnalysisContext(): AnalysisContext | null {
  const stored = sessionStorage.getItem(ANALYSIS_CONTEXT_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AnalysisContext;
  } catch {
    return null;
  }
}
