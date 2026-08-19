"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Compass,
  FilePenLine,
  FileText,
  Landmark,
  LoaderCircle,
  MessagesSquare,
  Scale,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import { FileUploadCard } from "@/components/upload/file-upload-card";
import {
  ANALYSIS_CONTEXT_STORAGE_KEY,
  JOB_DESCRIPTION_STORAGE_KEY,
  REPORT_STORAGE_KEY,
  RESUME_TEXT_STORAGE_KEY,
  createAnalysisId,
  getOrCreateSessionId,
} from "@/lib/reportStorage";
import type { AnalysisContext, AnalysisFocus, CareerScene, EducationStage, PracticeAreaPreference, UsagePurpose } from "@/types/beta";

const careerSceneOptions = [
  {
    id: "law_firm",
    name: "律所",
    description: "诉讼、非诉与律师业务",
    icon: Scale,
  },
  {
    id: "in_house",
    name: "企业法务",
    description: "合同、业务支持与风险管理",
    icon: Building2,
  },
  {
    id: "compliance",
    name: "合规",
    description: "监管、制度与合规支持",
    icon: ScanSearch,
  },
  {
    id: "court_procuratorate",
    name: "法院 / 检察院",
    description: "司法机关实习与职业准备",
    icon: Landmark,
  },
  {
    id: "arbitration",
    name: "仲裁机构",
    description: "商事仲裁与争议解决",
    icon: BriefcaseBusiness,
  },
  {
    id: "other",
    name: "其他",
    description: "其他法律职业与实习方向",
    icon: Landmark,
  },
] as const satisfies ReadonlyArray<{ id: CareerScene; name: string; description: string; icon: typeof Scale }>;

const practiceAreaChoices: Array<{ id: PracticeAreaPreference; name: string }> = [
  { id: "intellectual_property", name: "知识产权" },
  { id: "international_cross_border", name: "涉外 / 跨境" },
  { id: "dispute_resolution", name: "争议解决" },
  { id: "corporate_commercial", name: "公司 / 商事" },
  { id: "data_ai_technology", name: "数据 / AI / 科技" },
  { id: "other", name: "其他" },
  { id: "undecided", name: "暂未确定" },
];

const goals = [
  { id: "resume", name: "简历优化", description: "提升经历表达与岗位相关度", icon: FilePenLine },
  { id: "interview", name: "面试准备", description: "生成问题与回答表达策略", icon: MessagesSquare },
  { id: "matching", name: "岗位匹配", description: "识别能力优势与匹配证据", icon: ScanSearch },
  { id: "planning", name: "职业规划", description: "明确能力差距与成长路径", icon: Compass },
] as const satisfies ReadonlyArray<{ id: AnalysisFocus; name: string; description: string; icon: typeof Scale }>;

const purposes: Array<{ value: UsagePurpose; label: string }> = [
  { value: "internship_search", label: "找实习" },
  { value: "campus_recruitment", label: "秋招 / 校招" },
  { value: "summer_internship", label: "暑期实习" },
  { value: "regular_internship", label: "日常实习" },
  { value: "retention_preparation", label: "留用准备" },
  { value: "other", label: "其他" },
];

const educationOptions: Array<{ value: EducationStage; label: string }> = [
  { value: "law_undergraduate", label: "法学本科" },
  { value: "law_master", label: "法律硕士 / 法学硕士" },
  { value: "doctorate", label: "博士" },
  { value: "other", label: "其他" },
];

export function UploadForm() {
  const router = useRouter();
  const parseRequestId = useRef(0);
  const [jobRequirements, setJobRequirements] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeStatus, setResumeStatus] = useState<"idle" | "parsing" | "success" | "error">("idle");
  const [resumeStatusMessage, setResumeStatusMessage] = useState("");
  const [purpose, setPurpose] = useState<UsagePurpose>("internship_search");
  const [educationStage, setEducationStage] = useState<EducationStage>("law_master");
  const [careerScene, setCareerScene] = useState<CareerScene>("law_firm");
  const [practiceAreas, setPracticeAreas] = useState<PracticeAreaPreference[]>([]);
  const [practiceAreaMessage, setPracticeAreaMessage] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<AnalysisFocus[]>(["interview", "matching"]);
  const [strengths, setStrengths] = useState("");

  const canSubmit = Boolean(
    jobRequirements.trim() &&
      resume &&
      resumeStatus === "success" &&
      resumeText &&
      careerScene &&
      selectedGoals.length,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    sessionStorage.setItem(JOB_DESCRIPTION_STORAGE_KEY, jobRequirements.trim());
    const combinedResumeText = [
      resumeText,
      strengths.trim() ? `用户补充信息：\n${strengths.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    sessionStorage.setItem(RESUME_TEXT_STORAGE_KEY, combinedResumeText);
    const analysisContext: AnalysisContext = { purpose, educationStage, careerScene, practiceAreas, focusAreas: selectedGoals };
    sessionStorage.setItem(ANALYSIS_CONTEXT_STORAGE_KEY, JSON.stringify(analysisContext));
    getOrCreateSessionId();
    createAnalysisId();
    sessionStorage.removeItem(REPORT_STORAGE_KEY);
    router.push("/analyzing");
  }

  async function handleResumeChange(file: File | null) {
    const requestId = ++parseRequestId.current;
    setResume(file);
    setResumeText("");
    setResumeStatusMessage("");

    if (!file) {
      setResumeStatus("idle");
      return;
    }

    setResumeStatus("parsing");
    setResumeStatusMessage("正在解析简历...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const payload = (await response.json()) as
        | { text: string; characterCount: number; pageCount?: number }
        | { error?: { message?: string } };

      if (!response.ok || !("text" in payload)) {
        const message = "error" in payload ? payload.error?.message : undefined;
        throw new Error(message || "简历解析失败");
      }
      if (requestId !== parseRequestId.current) return;

      setResumeText(payload.text);
      setResumeStatus("success");
      const pageInfo = payload.pageCount ? ` · ${payload.pageCount} 页` : "";
      setResumeStatusMessage(`解析完成 · ${payload.characterCount.toLocaleString()} 字${pageInfo}`);
    } catch (error) {
      if (requestId !== parseRequestId.current) return;
      setResumeStatus("error");
      setResumeStatusMessage(error instanceof Error ? error.message : "简历解析失败，请重试");
    }
  }

  function toggleGoal(goalId: AnalysisFocus) {
    setSelectedGoals((current) =>
      current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId],
    );
  }

  function togglePracticeArea(areaId: PracticeAreaPreference) {
    setPracticeAreaMessage("");
    setPracticeAreas((current) => {
      if (areaId === "undecided") return current.includes("undecided") ? [] : ["undecided"];
      const withoutUndecided = current.filter((item) => item !== "undecided");
      if (withoutUndecided.includes(areaId)) return withoutUndecided.filter((item) => item !== areaId);
      if (withoutUndecided.length >= 2) {
        setPracticeAreaMessage("专业 / 业务方向最多选择 2 项。请先取消一项再选择。");
        return withoutUndecided;
      }
      return [...withoutUndecided, areaId];
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[1.35rem] border border-primary/[0.09] bg-card p-6 shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">上传岗位要求</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">粘贴岗位职责与任职要求，用于识别核心能力和面试重点</p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.05] text-primary">
              <FileText className="size-5" strokeWidth={1.5} />
            </span>
          </div>
          <textarea
            name="jobRequirements"
            value={jobRequirements}
            onChange={(event) => setJobRequirements(event.target.value)}
            rows={9}
            maxLength={5000}
            required
            placeholder="请粘贴完整的岗位要求，包括岗位职责、任职资格、加分项等……"
            className="mt-7 min-h-52 w-full resize-none rounded-2xl border border-primary/10 bg-secondary/35 px-4 py-3.5 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/35 focus:bg-background focus:ring-4 focus:ring-primary/[0.04]"
          />
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>建议粘贴完整岗位信息</span>
            <span>{jobRequirements.length} / 5000</span>
          </div>
        </section>
        <FileUploadCard
          label="上传个人简历"
          description="用于匹配教育背景、实践经历与能力证据"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          formats="PDF、DOCX"
          file={resume}
          onFileChange={handleResumeChange}
          status={resumeStatus}
          statusMessage={resumeStatusMessage}
        />
      </div>

      <section className="rounded-[1.35rem] border border-primary/[0.09] bg-card p-6 shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)] sm:p-8">
        <div className="grid gap-4 border-b border-primary/[0.08] pb-8 sm:grid-cols-2">
          <label className="text-sm font-medium text-primary">
            本次使用目的
            <select
              value={purpose}
              onChange={(event) => setPurpose(event.target.value as UsagePurpose)}
              className="mt-3 w-full rounded-2xl border border-primary/10 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/35 focus:ring-4 focus:ring-primary/[0.04]"
            >
              {purposes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-primary">
            当前教育阶段
            <select
              value={educationStage}
              onChange={(event) => setEducationStage(event.target.value as EducationStage)}
              className="mt-3 w-full rounded-2xl border border-primary/10 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/35 focus:ring-4 focus:ring-primary/[0.04]"
            >
              {educationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <div className="pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Career Scene</p>
          <h2 className="mt-3 font-display text-xl font-semibold text-primary">目标职业场景</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">单选。帮助 AI 理解你主要申请的机构与职业语境，具体判断仍以 JD 为准。</p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {careerSceneOptions.map(({ id, name, description, icon: Icon }) => {
            const selected = careerScene === id;
            return (
              <label
                key={id}
                className={`relative cursor-pointer rounded-2xl border p-5 transition ${
                  selected ? "border-primary/35 bg-primary/[0.045]" : "border-primary/[0.09] hover:border-primary/20"
                }`}
              >
                <input
                  type="radio"
                  name="careerScene"
                  value={id}
                  checked={selected}
                  onChange={(event) => setCareerScene(event.target.value as CareerScene)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <Icon className="size-5 text-primary" strokeWidth={1.4} />
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-primary/15"
                    }`}
                  >
                    {selected && <Check className="size-3" strokeWidth={2} />}
                  </span>
                </div>
                <p className="mt-6 text-sm font-medium text-primary">{name}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
              </label>
            );
          })}
        </div>

        <div className="mt-8 border-t border-primary/[0.08] pt-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Practice Areas</p>
              <h2 className="mt-3 font-display text-xl font-semibold text-primary">专业 / 业务方向</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">选填，可多选，最多 2 项。“暂未确定”与其他方向互斥。</p>
            </div>
            <span className="text-[10px] text-muted-foreground">已选择 {practiceAreas.length} / 2</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {practiceAreaChoices.map(({ id, name }) => {
              const selected = practiceAreas.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePracticeArea(id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
                    selected ? "border-primary/35 bg-primary/[0.06] text-primary" : "border-primary/[0.09] text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {selected && <Check className="size-3.5" />}
                  {name}
                </button>
              );
            })}
          </div>
          {practiceAreaMessage && <p role="status" className="mt-3 text-xs text-accent">{practiceAreaMessage}</p>}
        </div>

        <div className="mt-8 border-t border-primary/[0.08] pt-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Your AI Focus</p>
              <h2 className="mt-3 font-display text-xl font-semibold text-primary">希望 AI 重点帮助</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">可多选，分析报告将优先呈现与你目标相关的洞察。</p>
            </div>
            <span className="text-[10px] text-muted-foreground">已选择 {selectedGoals.length} 项</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map(({ id, name, description, icon: Icon }) => {
              const selected = selectedGoals.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleGoal(id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected ? "border-primary/35 bg-primary/[0.045]" : "border-primary/[0.09] hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-4.5 text-primary" strokeWidth={1.5} />
                    <span
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-primary/15"
                      }`}
                    >
                      {selected && <Check className="size-3" strokeWidth={2} />}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-medium text-primary">{name}</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 border-t border-primary/[0.08] pt-8">
          <label htmlFor="strengths" className="text-sm font-medium text-primary">
            简历关键信息 / 个人优势
            <span className="ml-2 text-xs font-normal text-muted-foreground">选填</span>
          </label>
          <textarea
            id="strengths"
            name="strengths"
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
            rows={5}
            maxLength={3000}
            placeholder="可粘贴简历中的关键经历，或补充个人优势。例如：实习职责、项目经历、语言成绩、法考情况等。AI 只会使用你明确提供的事实。"
            className="mt-3 w-full resize-none rounded-2xl border border-primary/10 bg-background/65 px-4 py-3.5 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/35 focus:ring-4 focus:ring-primary/[0.04]"
          />
          <div className="mt-2 flex justify-end text-[10px] text-muted-foreground">{strengths.length} / 3000</div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-between gap-5 rounded-[1.35rem] border border-primary/10 bg-primary px-6 py-6 text-primary-foreground sm:flex-row sm:px-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-accent" />
            AI 将从材料中理解你的职业背景
          </p>
          <p className="mt-1 text-xs leading-5 text-primary-foreground/65">简历将在服务端提取文字，并与岗位要求一同交由第三方大模型 DeepSeek 实时分析。</p>
          <p className="mt-1 text-xs leading-5 text-primary-foreground/65">建议删除姓名、手机号、邮箱及与岗位分析无关的信息后再上传。</p>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex min-w-44 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {resumeStatus === "parsing" ? "正在解析简历" : "开始 AI 分析"}
          {resumeStatus === "parsing" ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        </button>
      </div>
    </form>
  );
}
