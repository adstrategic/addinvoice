import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { DocumentImageViewer } from "./document-image-viewer";

describe("DocumentImageViewer", () => {
  it("renders one img per page with lazy/priority attributes and aspect sizing", async () => {
    const resolvePageSrc = vi.fn(async (page: number) => `blob:page-${page}`);

    render(
      <DocumentImageViewer
        pages={[
          { page: 1, width: 800, height: 1131 },
          { page: 2, width: 800, height: 1131 },
        ]}
        resolvePageSrc={resolvePageSrc}
        isLoading={false}
        ariaLabel="Invoice preview"
        containerClassName="preview-container"
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("img")).toHaveLength(2);
    });

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[1]).toHaveAttribute("loading", "lazy");
    expect(images[0]).toHaveAttribute("src", "blob:page-1");
    expect(images[1]).toHaveAttribute("src", "blob:page-2");

    const wrappers = document.querySelectorAll("[data-page]");
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0]).toHaveStyle({ aspectRatio: "800 / 1131" });
  });

  it("shows loading state while metadata is pending", () => {
    render(
      <DocumentImageViewer
        pages={undefined}
        resolvePageSrc={async () => ""}
        isLoading
        ariaLabel="Invoice preview"
      />,
    );
    expect(screen.getByText(/loading preview/i)).toBeInTheDocument();
  });
});
