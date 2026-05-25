/** Escapes special regex characters in user-provided strings for safe MongoDB queries. */
export function regexEscape(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
