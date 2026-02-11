import { describe, it, expect } from "vitest";
import {
  listClientsSchema,
  getClientBySequenceSchema,
  getClientByIdSchema,
  createClientSchema,
  updateClientSchema,
} from "./clients.schemas";

describe("listClientsSchema", () => {
  it("defaults to page 1 and limit 10 when query is empty", () => {
    const result = listClientsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("accepts valid page and limit", () => {
    const result = listClientsSchema.parse({ page: 2, limit: 20 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it("rejects page 0", () => {
    expect(() => listClientsSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects limit 0", () => {
    expect(() => listClientsSchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit greater than 30", () => {
    expect(() => listClientsSchema.parse({ limit: 31 })).toThrow();
  });

  it("accepts optional search string", () => {
    const result = listClientsSchema.parse({ search: "acme" });
    expect(result.search).toBe("acme");
  });
});

describe("getClientBySequenceSchema", () => {
  it("accepts positive integer sequence", () => {
    const result = getClientBySequenceSchema.parse({ sequence: 1 });
    expect(result.sequence).toBe(1);
  });

  it("coerces string to number", () => {
    const result = getClientBySequenceSchema.parse({ sequence: "5" });
    expect(result.sequence).toBe(5);
  });

  it("rejects zero", () => {
    expect(() =>
      getClientBySequenceSchema.parse({ sequence: 0 })
    ).toThrow();
  });

  it("rejects negative number", () => {
    expect(() =>
      getClientBySequenceSchema.parse({ sequence: -1 })
    ).toThrow();
  });
});

describe("getClientByIdSchema", () => {
  it("accepts positive integer id", () => {
    const result = getClientByIdSchema.parse({ id: 1 });
    expect(result.id).toBe(1);
  });

  it("rejects zero", () => {
    expect(() => getClientByIdSchema.parse({ id: 0 })).toThrow();
  });

  it("rejects negative number", () => {
    expect(() => getClientByIdSchema.parse({ id: -1 })).toThrow();
  });
});

describe("createClientSchema", () => {
  const validBase = {
    name: "Acme Corp",
    email: "contact@acme.com",
  };

  it("accepts required name and email only", () => {
    const result = createClientSchema.parse(validBase);
    expect(result.name).toBe("Acme Corp");
    expect(result.email).toBe("contact@acme.com");
  });

  it("rejects empty name", () => {
    expect(() =>
      createClientSchema.parse({ ...validBase, name: "" })
    ).toThrow();
  });

  it("rejects name longer than 255 characters", () => {
    expect(() =>
      createClientSchema.parse({ ...validBase, name: "a".repeat(256) })
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      createClientSchema.parse({ ...validBase, email: "not-an-email" })
    ).toThrow();
  });

  it("accepts valid E.164 phone when provided", () => {
    const result = createClientSchema.parse({
      ...validBase,
      phone: "+573011234567",
    });
    expect(result.phone).toBe("+573011234567");
  });

  it("rejects invalid phone format", () => {
    expect(() =>
      createClientSchema.parse({ ...validBase, phone: "123" })
    ).toThrow();
  });

  it("accepts optional address within max length", () => {
    const result = createClientSchema.parse({
      ...validBase,
      address: "123 Main St",
    });
    expect(result.address).toBe("123 Main St");
  });

  it("rejects address longer than 100 characters", () => {
    expect(() =>
      createClientSchema.parse({
        ...validBase,
        address: "a".repeat(101),
      })
    ).toThrow();
  });

  it("accepts optional nit within max 15 characters", () => {
    const result = createClientSchema.parse({
      ...validBase,
      nit: "123456789",
    });
    expect(result.nit).toBe("123456789");
  });

  it("rejects nit longer than 15 characters", () => {
    expect(() =>
      createClientSchema.parse({
        ...validBase,
        nit: "1".repeat(16),
      })
    ).toThrow();
  });

  it("accepts optional businessName within max 100 characters", () => {
    const result = createClientSchema.parse({
      ...validBase,
      businessName: "Acme Inc",
    });
    expect(result.businessName).toBe("Acme Inc");
  });
});

describe("updateClientSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateClientSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts partial update with valid name only", () => {
    const result = updateClientSchema.parse({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("applies same validation when field is provided", () => {
    expect(() =>
      updateClientSchema.parse({ email: "invalid" })
    ).toThrow();
  });
});
