import z from "zod";

// Generic helper for nullable optional fields that converts empty strings to null
export const nullableOptional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    schema.nullable(),
  );
