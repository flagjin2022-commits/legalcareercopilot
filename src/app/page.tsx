import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  FileUp,
  MessagesSquare,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "岗位要求洞察",
    description: "智能拆解职位描述，识别核心能力、专业要求与潜在考察重点。",
  },
  {
    icon: BriefcaseBusiness,
    title: "个人经历匹配",
    description: "连接你的教育与实践经历，找到最具说服力的职业叙事。",
  },
  {
    icon: MessagesSquare,
    title: "面试策略生成",
    description: "围绕目标岗位生成准备建议，让每一次表达更专业、更从容。",
  },
];

const steps = [
  { icon: FileUp, number: "01", title: "提交材料", description: "上传目标岗位 JD 与个人简历" },
  { icon: Sparkles, number: "02", title: "AI 智能分析", description: "提炼要求，匹配你的优势与差距" },
  { icon: Target, number: "03", title: "获得行动方案", description: "生成专属面试准备与成长建议" },
];

function XiezhiMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="260" cy="260" r="194" stroke="currentColor" strokeWidth="1" />
      <circle cx="260" cy="260" r="172" stroke="currentColor" strokeWidth="0.6" />
      <path d="M260 42L275 165L260 201L245 165L260 42Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M253 196C202 158 141 184 127 235C111 293 157 336 208 344C223 347 237 354 246 367L260 388L274 367C283 354 297 347 312 344C363 336 409 293 393 235C379 184 318 158 267 196"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M151 219C174 210 194 214 211 232M369 219C346 210 326 214 309 232" stroke="currentColor" strokeWidth="2" />
      <path d="M200 257C218 247 237 249 250 262M320 257C302 247 283 249 270 262" stroke="currentColor" strokeWidth="2" />
      <path d="M211 267L229 272M309 267L291 272" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M260 274V314M240 319C251 329 269 329 280 319" stroke="currentColor" strokeWidth="2" />
      <path d="M180 329C168 371 184 407 216 436M340 329C352 371 336 407 304 436" stroke="currentColor" strokeWidth="1.5" />
      <path d="M197 184C170 144 119 145 91 173C122 176 141 194 151 219M323 184C350 144 401 145 429 173C398 176 379 194 369 219" stroke="currentColor" strokeWidth="1.5" />
      <path d="M260 388V466M224 449L260 466L296 449" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative flex min-h-[720px] items-center border-b border-primary/10 px-6 py-24 sm:min-h-[780px] sm:py-32">
        <div className="xiezhi-mark pointer-events-none absolute -right-28 top-1/2 size-[560px] -translate-y-1/2 text-primary opacity-[0.045] sm:right-[2%] sm:size-[680px]">
          <XiezhiMark />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,hsl(var(--accent)/0.08),transparent_30%)]" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="mb-14 flex items-center gap-3 text-primary">
            <span className="flex size-10 items-center justify-center rounded-full border border-accent/45 bg-white/60 shadow-sm">
              <Scale aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.28em]">Legal Intelligence</span>
          </div>

          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5 text-accent" /> Beta 内测版
            </div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-accent" />
              <p className="text-sm font-medium tracking-[0.24em] text-primary/75">AI 赋能法律人才职业成长</p>
            </div>
            <h1 className="font-display text-6xl font-semibold leading-[0.98] tracking-[-0.045em] text-primary sm:text-8xl lg:text-[104px]">
              Legal Career
              <br />
              <span className="font-normal italic">Copilot</span>
            </h1>
            <p className="mt-9 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              AI-powered Career Intelligence for Legal Professionals
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              面向法学生求职与实习的 AI 辅助分析工具。当前版本仍在测试，欢迎直接指出分析错误和不好用的地方。
            </p>
            <Link
              href="/upload"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_45px_-22px_rgba(85,23,36,0.65)] transition hover:-translate-y-0.5 hover:bg-primary/92"
            >
              创建职业分析报告
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-16 flex items-center gap-4 text-xs tracking-[0.16em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            <span>以专业洞察，连接你的法律职业未来</span>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary/65">Career Intelligence</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-5xl">让职业准备更有依据</h2>
            <p className="mt-5 leading-7 text-muted-foreground">从岗位理解到面试表达，为法律职业选择建立清晰、可信的判断路径。</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="group relative min-h-72 overflow-hidden rounded-[1.35rem] border border-primary/[0.09] bg-card p-8 shadow-[0_18px_55px_-38px_rgba(85,23,36,0.35)] transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_24px_65px_-36px_rgba(85,23,36,0.45)]"
              >
                <span className="absolute right-7 top-6 font-display text-sm italic text-primary/20">0{index + 1}</span>
                <div className="mb-12 flex size-12 items-center justify-center rounded-xl border border-primary/10 bg-primary/[0.035] text-primary">
                  <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-semibold text-primary">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-primary/[0.08] bg-secondary/55 px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary/65">How It Works</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-5xl">三步，建立你的面试策略</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary/70">
              <span>材料输入</span>
              <ArrowRight className="size-4 text-accent" />
              <span>职业洞察</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3">
            {steps.map(({ icon: Icon, number, title, description }, index) => (
              <div
                key={title}
                className={`relative py-8 md:px-10 md:py-5 ${index > 0 ? "border-t border-primary/10 md:border-l md:border-t-0" : "md:pl-0"}`}
              >
                <div className="mb-10 flex items-center justify-between">
                  <Icon aria-hidden="true" className="size-6 text-primary" strokeWidth={1.4} />
                  <span className="font-display text-sm italic text-accent">{number}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-primary/[0.08] pt-8 text-xs text-muted-foreground">
          <span>Legal Career Copilot</span>
          <span>为下一代法律人才而设计</span>
        </div>
      </footer>
    </main>
  );
}
