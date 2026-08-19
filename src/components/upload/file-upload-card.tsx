"use client";

import { useId, useState } from "react";
import { CircleAlert, CheckCircle2, FileText, LoaderCircle, UploadCloud, X } from "lucide-react";

type UploadStatus = "idle" | "parsing" | "success" | "error";

type FileUploadCardProps = {
  label: string;
  description: string;
  accept: string;
  formats: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  status?: UploadStatus;
  statusMessage?: string;
};

export function FileUploadCard({
  label,
  description,
  accept,
  formats,
  file,
  onFileChange,
  status = "idle",
  statusMessage,
}: FileUploadCardProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function acceptFile(nextFile?: File) {
    if (nextFile) {
      const extensions = accept
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.startsWith("."));
      const isAccepted = extensions.some((extension) => nextFile.name.toLowerCase().endsWith(extension));

      if (!isAccepted) {
        setError(`文件格式不支持，请选择 ${formats} 文件。`);
        setIsDragging(false);
        return;
      }

      setError("");
      onFileChange(nextFile);
    }
    setIsDragging(false);
  }

  return (
    <section className="rounded-[1.35rem] border border-primary/[0.09] bg-card p-6 shadow-[0_18px_55px_-42px_rgba(85,23,36,0.3)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-primary">{label}</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.05] text-primary">
          <FileText className="size-5" strokeWidth={1.5} />
        </span>
      </div>

      {file ? (
        <div
          className={`mt-7 flex min-h-52 flex-col items-center justify-center rounded-2xl border px-5 text-center ${
            status === "error"
              ? "border-primary/20 bg-primary/[0.035]"
              : "border-accent/30 bg-accent/[0.045]"
          }`}
        >
          <span className={`flex size-11 items-center justify-center rounded-full bg-card shadow-sm ${status === "error" ? "text-primary" : "text-accent"}`}>
            {status === "parsing" ? (
              <LoaderCircle className="size-5 animate-spin" strokeWidth={1.6} />
            ) : status === "error" ? (
              <CircleAlert className="size-5" strokeWidth={1.6} />
            ) : (
              <CheckCircle2 className="size-5" strokeWidth={1.6} />
            )}
          </span>
          <p className="mt-4 max-w-full truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatFileSize(file.size)} · {statusMessage ?? "已选择"}
          </p>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="mt-5 flex items-center gap-1.5 text-xs text-primary/65 transition hover:text-primary"
          >
            <X className="size-3.5" />
            移除文件
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            acceptFile(event.dataTransfer.files[0]);
          }}
          className={`mt-7 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition ${
            isDragging
              ? "border-primary/45 bg-primary/[0.055]"
              : "border-primary/15 bg-secondary/35 hover:border-primary/30 hover:bg-secondary/60"
          }`}
        >
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />
          <span className="flex size-12 items-center justify-center rounded-full border border-primary/10 bg-card text-primary shadow-sm">
            <UploadCloud className="size-5" strokeWidth={1.5} />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">拖拽文件到这里，或点击选择</p>
          <p className="mt-2 text-xs text-muted-foreground">支持 {formats} · 单个文件</p>
        </label>
      )}
      {error && <p className="mt-3 text-xs text-primary" role="alert">{error}</p>}
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
