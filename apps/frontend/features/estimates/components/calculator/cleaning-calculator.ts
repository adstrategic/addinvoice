import type { CreateEstimateItemDTO } from "@addinvoice/schemas";

/**
 * Cleaning calculator constants and pure computation helpers.
 *
 * Prices are plain dollar amounts (money is stored as Decimal(10,2) dollars,
 * not cents). The square-feet formula uses a base rate of $7.25 multiplied by
 * a per-type factor and the house size; the rooms formula uses flat per-room
 * and per-bathroom rates.
 */

/** Base hourly-equivalent rate used by the square-feet formula. */
export const SQUARE_FEET_BASE_RATE = 7.25;

export type CleaningTypeId = "regular" | "deep" | "moving";

export interface CleaningType {
  id: CleaningTypeId;
  label: string;
  /** Multiplier applied in the square-feet formula. */
  sqftFactor: number;
  /** Flat price per room in the rooms & bathrooms formula. */
  perRoom: number;
  /** Flat price per bathroom in the rooms & bathrooms formula. */
  perBathroom: number;
}

export const CLEANING_TYPES: CleaningType[] = [
  {
    id: "regular",
    label: "Regular Cleaning",
    sqftFactor: 0.01,
    perRoom: 30,
    perBathroom: 50,
  },
  {
    id: "deep",
    label: "Deep Cleaning",
    sqftFactor: 0.03,
    perRoom: 47,
    perBathroom: 67,
  },
  {
    id: "moving",
    label: "Moving Cleaning",
    sqftFactor: 0.02,
    perRoom: 42,
    perBathroom: 62,
  },
];

export function getCleaningType(id: CleaningTypeId): CleaningType {
  const found = CLEANING_TYPES.find((type) => type.id === id);
  if (!found) throw new Error(`Unknown cleaning type: ${id}`);
  return found;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** total = round2(7.25 * factor * squareFeet) */
export function computeBySquareFeet(
  id: CleaningTypeId,
  squareFeet: number,
): number {
  const { sqftFactor } = getCleaningType(id);
  return round2(SQUARE_FEET_BASE_RATE * sqftFactor * squareFeet);
}

/** total = round2(perRoom * rooms + perBathroom * bathrooms) */
export function computeByRooms(
  id: CleaningTypeId,
  rooms: number,
  bathrooms: number,
): number {
  const { perRoom, perBathroom } = getCleaningType(id);
  return round2(perRoom * rooms + perBathroom * bathrooms);
}

/** Canonical TipTap document holding a single plain-text paragraph. */
export function paragraphDoc(text: string): Record<string, unknown> {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

interface BuildSquareFeetItemArgs {
  mode: "squareFeet";
  typeId: CleaningTypeId;
  squareFeet: number;
}

interface BuildRoomsItemArgs {
  mode: "rooms";
  typeId: CleaningTypeId;
  rooms: number;
  bathrooms: number;
}

export type BuildCleaningItemArgs =
  | BuildSquareFeetItemArgs
  | BuildRoomsItemArgs;

/**
 * Builds the single estimate line item produced by the calculator, including a
 * plain-text TipTap description summarizing the inputs.
 */
export function buildCleaningItem(
  args: BuildCleaningItemArgs,
): CreateEstimateItemDTO {
  const cleaningType = getCleaningType(args.typeId);

  if (args.mode === "squareFeet") {
    return {
      name: cleaningType.label,
      description: paragraphDoc(
        `Approximately ${args.squareFeet} square feet.`,
      ),
      quantity: 1,
      quantityUnit: "UNITS",
      unitPrice: computeBySquareFeet(args.typeId, args.squareFeet),
    } as CreateEstimateItemDTO;
  }

  return {
    name: cleaningType.label,
    description: paragraphDoc(
      `${args.rooms} rooms and ${args.bathrooms} bathrooms to clean.`,
    ),
    quantity: 1,
    quantityUnit: "UNITS",
    unitPrice: computeByRooms(args.typeId, args.rooms, args.bathrooms),
  } as CreateEstimateItemDTO;
}
