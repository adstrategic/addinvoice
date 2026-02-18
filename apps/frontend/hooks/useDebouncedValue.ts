import { useEffect, useState } from "react";

/**
 * useDebouncedValue
 * Returns a debounced version of a value. It updates only after the delay has passed
 * without further changes. Useful for search inputs to avoid excessive requests.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
