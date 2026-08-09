import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const pdfMock = vi.fn();

vi.mock("pdf-to-img", () => ({
  pdf: (...args: unknown[]) => pdfMock(...args),
}));

import { rasterizePdfToImages } from "../rasterize-pdf.js";

/** Minimal 2x2 red PNG used as a stand-in for a PDF page raster. */
async function makePngBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();
}

describe("rasterizePdfToImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns one WebP page per PDF page with dimensions", async () => {
    const pagePng = await makePngBuffer();
    async function* pages() {
      yield pagePng;
      yield pagePng;
    }
    const doc = Object.assign(pages(), {
      length: 2,
      getPage: async (n: number) => {
        if (n < 1 || n > 2) throw new Error("out of range");
        return pagePng;
      },
    });
    pdfMock.mockResolvedValue(doc);

    const result = await rasterizePdfToImages(Buffer.from("%PDF-1.4 mock"), {
      scale: 2,
      quality: 80,
    });

    expect(pdfMock).toHaveBeenCalledWith(expect.any(Buffer), { scale: 2 });
    expect(result).toHaveLength(2);

    for (const page of result) {
      expect(page.width).toBeGreaterThan(0);
      expect(page.height).toBeGreaterThan(0);
      expect(typeof page.image).toBe("string");
      expect(page.image.length).toBeGreaterThan(0);

      const decoded = Buffer.from(page.image, "base64");
      const meta = await sharp(decoded).metadata();
      expect(meta.format).toBe("webp");
    }
  });

  it("uses default scale 2 and quality 80 when options omitted", async () => {
    const pagePng = await makePngBuffer();
    async function* pages() {
      yield pagePng;
    }
    const doc = Object.assign(pages(), {
      length: 1,
      getPage: async () => pagePng,
    });
    pdfMock.mockResolvedValue(doc);

    await rasterizePdfToImages(Buffer.from("%PDF-1.4 mock"));

    expect(pdfMock).toHaveBeenCalledWith(expect.any(Buffer), { scale: 2 });
  });
});
