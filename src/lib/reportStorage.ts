export const JOB_DESCRIPTION_STORAGE_KEY = "legal-career-copilot:job-description";
export const RESUME_TEXT_STORAGE_KEY = "legal-career-copilot:resume-text";
export const REPORT_STORAGE_KEY = "legal-career-copilot:report";
export const ANALYSIS_CONTEXT_STORAGE_KEY = "legal-career-copilot:analysis-context";
export const SESSION_ID_STORAGE_KEY = "legal-career-copilot:session-id";
export const ANALYSIS_ID_STORAGE_KEY = "legal-career-copilot:analysis-id";

export function getOrCreateSessionId() {
  const existing = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
  return sessionId;
}

export function createAnalysisId() {
  const analysisId = crypto.randomUUID();
  sessionStorage.setItem(ANALYSIS_ID_STORAGE_KEY, analysisId);
  return analysisId;
}

export function getAnalysisId() {
  return sessionStorage.getItem(ANALYSIS_ID_STORAGE_KEY);
}

export function clearCurrentAnalysisData() {
  sessionStorage.removeItem(JOB_DESCRIPTION_STORAGE_KEY);
  sessionStorage.removeItem(RESUME_TEXT_STORAGE_KEY);
  sessionStorage.removeItem(REPORT_STORAGE_KEY);
  sessionStorage.removeItem(ANALYSIS_CONTEXT_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_ID_STORAGE_KEY);
  sessionStorage.removeItem(ANALYSIS_ID_STORAGE_KEY);
}
