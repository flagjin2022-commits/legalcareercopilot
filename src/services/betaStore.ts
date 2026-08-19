import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { AnalysisSnapshot, FeedbackRecord } from "@/types/beta";

export interface BetaStore {
  saveAnalysis(snapshot: AnalysisSnapshot): Promise<void>;
  getAnalysis(analysisId: string): Promise<AnalysisSnapshot | null>;
  listAnalyses(): Promise<AnalysisSnapshot[]>;
  saveFeedback(record: FeedbackRecord): Promise<void>;
  getFeedbackForAnalysis(analysisId: string): Promise<FeedbackRecord | null>;
  listFeedback(): Promise<FeedbackRecord[]>;
}

class JsonLinesBetaStore implements BetaStore {
  private readonly analysisFile: string;
  private readonly feedbackFile: string;

  constructor(analysisFile: string, feedbackFile: string) {
    this.analysisFile = analysisFile;
    this.feedbackFile = feedbackFile;
  }

  async saveAnalysis(snapshot: AnalysisSnapshot) {
    await appendJsonLine(this.analysisFile, snapshot);
  }

  async getAnalysis(analysisId: string) {
    return (await this.listAnalyses()).find((item) => item.analysisId === analysisId) ?? null;
  }

  async listAnalyses() {
    return readJsonLines<AnalysisSnapshot>(this.analysisFile);
  }

  async saveFeedback(record: FeedbackRecord) {
    await appendJsonLine(this.feedbackFile, record);
  }

  async getFeedbackForAnalysis(analysisId: string) {
    return (await this.listFeedback()).find((item) => item.analysisId === analysisId) ?? null;
  }

  async listFeedback() {
    const records = await readJsonLines<FeedbackRecord>(this.feedbackFile);
    return records.map(normalizeFeedbackRecord);
  }
}

class SupabaseBetaStore implements BetaStore {
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(baseUrl: string, secretKey: string) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  async saveAnalysis(snapshot: AnalysisSnapshot) {
    await this.request("beta_analyses", {
      method: "POST",
      body: JSON.stringify({
        id: snapshot.analysisId,
        session_id: snapshot.sessionId,
        created_at: snapshot.createdAt,
        prompt_version: snapshot.promptVersion,
        product_version: snapshot.productVersion,
        model_version: snapshot.modelVersion,
        scenario: snapshot.scenario,
        snapshot,
      }),
      headers: { Prefer: "return=minimal" },
    });
  }

  async getAnalysis(analysisId: string) {
    const rows = await this.request<Array<{ snapshot: AnalysisSnapshot }>>(
      `beta_analyses?id=eq.${encodeURIComponent(analysisId)}&select=snapshot&limit=1`,
    );
    return rows[0]?.snapshot ?? null;
  }

  async listAnalyses() {
    const rows = await this.request<Array<{ snapshot: AnalysisSnapshot }>>(
      "beta_analyses?select=snapshot&order=created_at.desc&limit=1000",
    );
    return rows.map((row) => row.snapshot);
  }

  async saveFeedback(record: FeedbackRecord) {
    await this.request("beta_feedback", {
      method: "POST",
      body: JSON.stringify({
        id: record.id,
        analysis_id: record.analysisId,
        session_id: record.sessionId,
        created_at: record.createdAt,
        bad_case_tags: record.badCaseTags,
        record,
      }),
      headers: { Prefer: "return=minimal" },
    });
  }

  async getFeedbackForAnalysis(analysisId: string) {
    const rows = await this.request<Array<{ record: FeedbackRecord }>>(
      `beta_feedback?analysis_id=eq.${encodeURIComponent(analysisId)}&select=record&limit=1`,
    );
    return rows[0]?.record ?? null;
  }

  async listFeedback() {
    const rows = await this.request<Array<{ record: FeedbackRecord }>>(
      "beta_feedback?select=record&order=created_at.desc&limit=1000",
    );
    return rows.map((row) => row.record);
  }

  private async request<T = unknown>(resource: string, init: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/rest/v1/${resource}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase persistence failed (${response.status}): ${error.slice(0, 300)}`);
    }
    if (response.status === 204 || response.headers.get("content-length") === "0") return undefined as T;
    return response.json() as Promise<T>;
  }
}

let cachedStore: BetaStore | null = null;

export function getBetaStore(): BetaStore {
  if (cachedStore) return cachedStore;
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const supabaseKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (supabaseUrl && supabaseKey) {
    cachedStore = new SupabaseBetaStore(supabaseUrl, supabaseKey);
    return cachedStore;
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_BETA_STORAGE !== "true") {
    throw new Error("生产环境必须配置 SUPABASE_URL 与 SUPABASE_SECRET_KEY");
  }
  const dataDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.BETA_DATA_DIR?.trim() || ".data");
  cachedStore = createLocalBetaStore(dataDir);
  return cachedStore;
}

export function createLocalBetaStore(dataDir: string): BetaStore {
  return new JsonLinesBetaStore(
    path.join(dataDir, "beta-analyses.jsonl"),
    path.join(dataDir, "beta-feedback.jsonl"),
  );
}

async function appendJsonLine(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    const text = await readFile(filePath, "utf8");
    return text.split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
  } catch (error) {
    if (isFileNotFound(error)) return [];
    throw error;
  }
}

function isFileNotFound(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function normalizeFeedbackRecord(record: FeedbackRecord): FeedbackRecord {
  if (record.schemaVersion === 2 && Array.isArray(record.badCaseTags)) return record;
  return {
    ...record,
    schemaVersion: 2,
    badCaseTags: [],
    promptVersion: record.promptVersion || "legacy",
    productVersion: record.productVersion || "legacy",
    modelVersion: record.modelVersion || "legacy",
  };
}
