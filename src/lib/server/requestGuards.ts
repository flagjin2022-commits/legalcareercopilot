export function rejectOversizedRequest(request: Request, maxBytes: number) {
  const header = request.headers.get("content-length");
  if (!header) return null;
  const bytes = Number(header);
  if (!Number.isFinite(bytes) || bytes < 0 || bytes > maxBytes) {
    return Response.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "提交内容超过允许大小" } },
      { status: 413 },
    );
  }
  return null;
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: { code: "RATE_LIMITED", message: "请求过于频繁，请稍后再试" } },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
