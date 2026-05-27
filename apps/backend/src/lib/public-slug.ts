import { randomUUID } from "node:crypto";

export type PublicDocumentType =
  | "advance"
  | "estimate"
  | "invoice"
  | "proposal";

const PREFIX_BY_TYPE: Record<PublicDocumentType, string> = {
  advance: "adv",
  invoice: "inv",
  estimate: "est",
  proposal: "prop",
};

const TYPE_BY_PREFIX: Record<string, PublicDocumentType> = {
  adv: "advance",
  inv: "invoice",
  est: "estimate",
  prop: "proposal",
};

export function buildPublicSlug(type: PublicDocumentType): string {
  const prefix = PREFIX_BY_TYPE[type];
  return `${prefix}-${randomUUID()}`;
}

export function parsePublicSlug(slug: string): null | {
  idPart: string;
  type: PublicDocumentType;
} {
  const dashIndex = slug.indexOf("-");
  if (dashIndex <= 0) return null;

  const prefix = slug.slice(0, dashIndex);
  const type = TYPE_BY_PREFIX[prefix];
  if (!type) return null;

  const idPart = slug.slice(dashIndex + 1);
  if (!idPart) return null;

  return { type, idPart };
}
