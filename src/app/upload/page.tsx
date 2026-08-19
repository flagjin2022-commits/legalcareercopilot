import Link from "next/link";
import { ArrowLeft, FileSearch, Scale, Sparkles } from "lucide-react";

import { UploadForm } from "@/components/upload/upload-form";

export default function UploadPage() {
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

      <section className="relative overflow-hidden border-b border-primary/[0.08] px-6 py-16 sm:py-20">
        <div className="pointer-events-none absolute right-[10%] top-1/2 size-72 -translate-y-1/2 rounded-full border border-primary/[0.045]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-primary/70">
                <span className="h-px w-9 bg-accent" />
                CREATE YOUR REPORT
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-primary sm:text-6xl">创建职业分析报告</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                填写目标岗位要求并提交个人简历，让 AI 建立法律专业能力、岗位要求与面试表达之间的连接。
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] tracking-[0.12em] text-muted-foreground">
              <Step icon={FileSearch} number="01" label="提交资料" active />
              <span className="h-px w-6 bg-primary/15" />
              <Step icon={Sparkles} number="02" label="AI 理解" />
              <span className="h-px w-6 bg-primary/15" />
              <Step icon={Scale} number="03" label="查看报告" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <UploadForm />
        </div>
      </section>
    </main>
  );
}

type StepProps = {
  icon: typeof FileSearch;
  number: string;
  label: string;
  active?: boolean;
};

function Step({ icon: Icon, number, label, active = false }: StepProps) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-primary" : "text-muted-foreground"}`}>
      <span className={`flex size-7 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "border border-primary/10 bg-card"}`}>
        <Icon className="size-3.5" strokeWidth={1.5} />
      </span>
      <span className="hidden sm:inline">{number} {label}</span>
    </div>
  );
}
