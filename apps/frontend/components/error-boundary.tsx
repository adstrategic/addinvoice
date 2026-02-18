import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ErrorBoundaryProps {
  error: Error;
  entityName: string;
  url?: {
    path: string;
    displayText: string;
  };
}

export const ErrorBoundary = ({
  error,
  entityName,
  url,
}: ErrorBoundaryProps) => {
  const router = useRouter();

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <h3 className="font-bold">Error loading {entityName}</h3>
      <p className="mt-1">
        {error.message || `An error occurred while loading ${entityName}`}
      </p>
      <Button
        onClick={() => {
          if (url) {
            router.push(url.path);
          } else {
            router.refresh();
          }
        }}
        className="mt-2 bg-red-600 hover:bg-red-700"
        size="sm"
      >
        {url?.displayText || "Retry"}
      </Button>
    </div>
  );
};
