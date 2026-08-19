import { Download, MessageSquareText } from "lucide-react";

import { getBetaStore } from "@/services/betaStore";

export const dynamic = "force-dynamic";

export default async function InternalFeedbackPage() {
  const store = getBetaStore();
  const [analyses, feedback] = await Promise.all([store.listAnalyses(), store.listFeedback()]);
  const analysisById = new Map(analyses.map((item) => [item.analysisId, item]));
  const linkedFeedback = feedback.filter((item) => analysisById.has(item.analysisId));
  const sessions = new Set(analyses.map((item) => item.sessionId)).size;
  const submissionRate = analyses.length ? Math.round((linkedFeedback.length / analyses.length) * 100) : 0;
  const helpfulness = rank(linkedFeedback.map((item) => item.helpfulness));
  const helpfulParts = rank(linkedFeedback.flatMap((item) => item.helpfulParts)).slice(0, 3);
  const badCases = rank(linkedFeedback.flatMap((item) => item.badCaseTags)).slice(0, 8);
  const priorities = rank(linkedFeedback.flatMap((item) => item.nextVersionPriorities)).slice(0, 5);
  const scenes = rank(linkedFeedback.map((item) => item.scenario.careerScene));

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-primary/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Internal Beta</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-primary">Beta Feedback</h1>
            <p className="mt-2 text-sm text-muted-foreground">只包含匿名分析快照与结构化反馈，不包含原始 JD 或简历。</p>
          </div>
          <div className="flex gap-2">
            <a href="/api/internal/feedback?format=json" className="flex items-center gap-2 rounded-full border border-primary/15 px-4 py-2 text-sm text-primary"><Download className="size-4" /> JSON</a>
            <a href="/api/internal/feedback?format=csv" className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Download className="size-4" /> CSV</a>
          </div>
        </header>

        <section className="grid gap-3 py-7 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="匿名会话 / 分析" value={`${sessions} / ${analyses.length}`} />
          <Metric label="Feedback 提交数" value={String(linkedFeedback.length)} />
          <Metric label="Feedback 提交率" value={`${submissionRate}%`} />
          <Metric label="Prompt / Product" value={`${analyses[0]?.promptVersion ?? "—"} / ${analyses[0]?.productVersion ?? "—"}`} />
        </section>

        <section className="grid gap-3 border-y border-primary/10 py-7 md:grid-cols-2 xl:grid-cols-5">
          <Ranking title="帮助程度" items={helpfulness} />
          <Ranking title="最有用模块 Top 3" items={helpfulParts} />
          <Ranking title="Bad Case Tags" items={badCases} />
          <Ranking title="下一版优先项 Top 5" items={priorities} />
          <Ranking title="职业场景" items={scenes} />
        </section>

        <section className="py-8">
          <div className="mb-4 flex items-center gap-2 text-primary"><MessageSquareText className="size-5" /><h2 className="font-display text-2xl font-semibold">反馈记录</h2></div>
          {feedback.length === 0 ? (
            <p className="rounded-2xl border border-primary/10 bg-card p-6 text-sm text-muted-foreground">暂时还没有反馈。</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((record) => {
                const analysis = analysisById.get(record.analysisId);
                return (
                  <details key={record.id} className="rounded-2xl border border-primary/10 bg-card p-5 open:border-primary/25">
                    <summary className="cursor-pointer list-none">
                      <div className="grid gap-3 text-sm sm:grid-cols-[170px_1fr_130px_1fr] sm:items-center">
                        <time className="text-muted-foreground">{formatDate(record.createdAt)}</time>
                        <code className="truncate text-xs text-primary">{record.analysisId}</code>
                        <span>{record.scenario.careerScene}</span>
                        <span className="truncate text-muted-foreground">{record.badCaseTags.join(" · ") || "无 bad case tag"}</span>
                      </div>
                    </summary>
                    <div className="mt-5 grid gap-5 border-t border-primary/10 pt-5 lg:grid-cols-2">
                      <Detail title="分析场景" rows={[
                        ["目标岗位", analysis?.targetRole ?? "—"],
                        ["职业场景", record.scenario.careerScene],
                        ["专业方向", record.scenario.practiceAreas.join("、") || "未选择"],
                        ["使用目的 / 教育阶段", `${record.scenario.purpose} / ${record.scenario.educationStage}`],
                        ["整体帮助程度", record.helpfulness],
                        ["最有用模块", record.helpfulParts.join("、") || "未选择"],
                        ["下一版优先项", record.nextVersionPriorities.join("、") || "未选择"],
                      ]} />
                      <Detail title="四个开放题" rows={[
                        ["只能改一个地方", record.openResponses.singlePriority],
                        ["没有理解我的时刻", record.openResponses.misunderstoodMoment || "未填写"],
                        ["只保留一个功能", record.openResponses.keepOneFeature || "未填写"],
                        ["缺少的期待", record.openResponses.missingExpectation || "未填写"],
                      ]} />
                      {analysis && (
                        <div className="lg:col-span-2">
                          <h3 className="text-sm font-semibold text-primary">能力快照</h3>
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                              <thead className="text-xs text-muted-foreground"><tr><th className="py-2">能力</th><th>JD要求</th><th>简历证据分</th><th>证据等级</th><th>证据来源</th></tr></thead>
                              <tbody>{analysis.generalSkills.map((skill) => <tr key={skill.id} className="border-t border-primary/10"><td className="py-3 font-medium text-primary">{skill.name}</td><td>{skill.jdRequirement}</td><td>{skill.resumeEvidenceScore ?? "暂无"}</td><td>{skill.evidenceLevel}</td><td className="max-w-md">{skill.evidenceSources.join("；") || "暂无"}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-primary/10 bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-semibold text-primary">{value}</p></div>;
}

function Ranking({ title, items }: { title: string; items: Array<[string, number]> }) {
  return <div className="rounded-2xl bg-secondary/35 p-4"><h3 className="text-sm font-semibold text-primary">{title}</h3><ol className="mt-3 space-y-2 text-xs text-muted-foreground">{items.length ? items.map(([item, count]) => <li key={item} className="flex justify-between gap-3"><span className="break-all">{item}</span><strong className="text-primary">{count}</strong></li>) : <li>暂无数据</li>}</ol></div>;
}

function Detail({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <div><h3 className="text-sm font-semibold text-primary">{title}</h3><dl className="mt-3 space-y-3 text-sm">{rows.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{value}</dd></div>)}</dl></div>;
}

function rank(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value));
}
