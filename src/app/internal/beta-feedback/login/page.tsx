import { AccessForm } from "@/components/access/access-form";

export default function InternalLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <section className="w-full max-w-sm rounded-[1.5rem] border border-primary/10 bg-card p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Internal Beta</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-primary">反馈查看入口</h1>
        <AccessForm mode="admin" />
      </section>
    </main>
  );
}
