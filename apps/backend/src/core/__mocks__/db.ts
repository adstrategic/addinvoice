import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@addinvoice/db";
import { beforeEach } from "vitest";

beforeEach(() => {
  mockReset(prismaMock);
});

/**
 * Deep mock of Prisma Client for unit tests. All nested properties (e.g. prisma.client.findMany)
 * are automatically mocked. Use in tests via vi.mock("../../../core/db", ...) and reset with
 * vi.clearAllMocks() or mock per-test return values.
 * @see https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o
 */
const prismaMock = mockDeep<PrismaClient>();
export default prismaMock;
