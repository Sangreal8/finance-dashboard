import { useState } from "react";

export function useBrowserHydrated<T>(initialValue: T, readValue: () => T) {
  const [value] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    return readValue();
  });

  return { value, ready: true };
}
