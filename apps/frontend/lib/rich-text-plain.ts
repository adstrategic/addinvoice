/**
 * TipTap stores descriptions as ProseMirror JSON ({ type, content }).
 * Use this for list/card previews where React cannot render raw JSON nodes.
 */
export function plainTextFromTipTapJson(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";
  const node = value as Record<string, unknown>;
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return node.content
      .map(plainTextFromTipTapJson)
      .filter((s) => s.length > 0)
      .join(" ");
  }
  return "";
}
