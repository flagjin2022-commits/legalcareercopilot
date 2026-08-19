"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";

export function AccessForm({ mode }: { mode: "beta" | "admin" }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setState("submitting");
    setError("");
    try {
      const endpoint = mode === "beta" ? "/api/beta-access" : "/api/internal/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "验证失败");
      window.location.assign(mode === "beta" ? "/" : "/internal/beta-feedback");
    } catch (submitError) {
      setState("error");
      setError(submitError instanceof Error ? submitError.message : "验证失败，请重试");
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm font-medium text-primary">
        {mode === "beta" ? "Beta 内测码" : "内部访问密码"}
        <div className="mt-2 flex items-center rounded-xl border border-primary/15 bg-card px-4 focus-within:border-primary/40">
          <KeyRound className="size-4 text-accent" />
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base outline-none"
          />
        </div>
      </label>
      {state === "error" && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={!code.trim() || state === "submitting"} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {state === "submitting" && <LoaderCircle className="size-4 animate-spin" />}
        {mode === "beta" ? "进入 Beta" : "查看内测反馈"}
      </button>
    </form>
  );
}
