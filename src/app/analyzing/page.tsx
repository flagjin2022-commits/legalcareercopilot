import { AnalysisProgress } from "@/components/analyzing/analysis-progress";

export default function AnalyzingPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div className="pointer-events-none absolute left-[8%] top-[15%] size-72 rounded-full border border-primary/[0.04]" />
      <div className="pointer-events-none absolute bottom-[5%] right-[5%] size-96 rounded-full border border-accent/[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.055),transparent_45%)]" />
      <div className="relative w-full">
        <AnalysisProgress />
      </div>
    </main>
  );
}

