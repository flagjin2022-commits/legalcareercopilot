export const PROMPT_VERSION = "beta-1";
export const PRODUCT_VERSION = "0.3.0";

export function getModelVersion() {
  return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";
}
