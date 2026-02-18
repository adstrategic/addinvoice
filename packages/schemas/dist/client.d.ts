import { z } from "zod";
/**
 * Phone number regex for international format.
 * Pattern: +[1-9][digits] where digits are 1-14 more digits.
 * Example: +573011234567 (Colombia), +1234567890 (USA)
 */
export declare const PHONE_REGEX: RegExp;
/**
 * Schema for creating a client.
 * Single source of truth for backend and agent.
 */
export declare const createClientSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    businessName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reminderBeforeDueIntervalDays: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reminderAfterDueIntervalDays: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    nit?: string | null | undefined;
    businessName?: string | null | undefined;
    reminderBeforeDueIntervalDays?: number | null | undefined;
    reminderAfterDueIntervalDays?: number | null | undefined;
}, {
    name: string;
    email: string;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    nit?: string | null | undefined;
    businessName?: string | null | undefined;
    reminderBeforeDueIntervalDays?: number | null | undefined;
    reminderAfterDueIntervalDays?: number | null | undefined;
}>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
//# sourceMappingURL=client.d.ts.map