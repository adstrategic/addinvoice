import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getPageNumbers } from "@/lib/utils";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  itemLabel?: string; // e.g., "invoices", "products", "items"
}

/**
 * Reusable pagination component for tables.
 * Single Responsibility: Pagination UI and logic
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  emptyMessage = "No items found",
  itemLabel = "items",
}: TablePaginationProps) {
  return (
    <div className="flex flex-col-reverse gap-4 items-center justify-center pt-8">
      <div className="text-sm text-muted-foreground">
        {!currentPage || !totalPages ? (
          emptyMessage
        ) : (
          <>
            Showing page {currentPage} of {totalPages}
          </>
        )}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={
                currentPage <= 1 || totalPages <= 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {getPageNumbers(totalPages, currentPage).map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={
                currentPage >= totalPages || totalPages <= 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
