import { getBetaStore } from "@/services/betaStore";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: Request) {
  const store = getBetaStore();
  const [analyses, feedback] = await Promise.all([store.listAnalyses(), store.listFeedback()]);
  const format = new URL(request.url).searchParams.get("format");
  if (format === "csv") {
    const analysisById = new Map(analyses.map((item) => [item.analysisId, item]));
    const rows = feedback.map((record) => {
      const analysis = analysisById.get(record.analysisId);
      return [
        record.createdAt,
        record.analysisId,
        record.scenario.careerScene,
        record.scenario.practiceAreas.join("|"),
        record.scenario.purpose,
        record.scenario.educationStage,
        record.helpfulness,
        record.helpfulParts.join("|"),
        record.badCaseTags.join("|"),
        record.nextVersionPriorities.join("|"),
        record.openResponses.singlePriority,
        record.openResponses.misunderstoodMoment,
        record.openResponses.keepOneFeature,
        record.openResponses.missingExpectation,
        analysis?.promptVersion ?? record.promptVersion,
        analysis?.productVersion ?? record.productVersion,
        analysis?.modelVersion ?? record.modelVersion,
      ];
    });
    const header = ["createdAt", "analysisId", "careerScene", "practiceAreas", "usagePurpose", "educationStage", "helpfulness", "helpfulParts", "badCaseTags", "nextVersionPriorities", "singlePriority", "misunderstoodMoment", "keepOneFeature", "missingExpectation", "promptVersion", "productVersion", "modelVersion"];
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=legal-career-copilot-beta-feedback.csv" } });
  }
  return Response.json({ exportedAt: new Date().toISOString(), analyses, feedback }, { headers: { "Content-Disposition": "attachment; filename=legal-career-copilot-beta-feedback.json" } });
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}
