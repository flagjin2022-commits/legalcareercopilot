import { Scale } from "lucide-react";

import { AccessForm } from "@/components/access/access-form";

export default function BetaAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-md rounded-[1.75rem] border border-primary/10 bg-card p-7 shadow-[0_28px_80px_-50px_rgba(85,23,36,0.45)] sm:p-10">
        <span className="flex size-11 items-center justify-center rounded-full border border-accent/35 text-primary"><Scale className="size-5" /></span>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-accent">Legal Career Copilot Beta</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-primary">欢迎参加第一轮内测</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">请输入邀请中提供的内测码。我们不会通过内测码识别你的身份。</p>
        <AccessForm mode="beta" />
      </section>
    </main>
  );
}
