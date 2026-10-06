import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches
  );
}

/** En dessous de 900 px de large, l'éditeur n'est pas utilisable confortablement (US9-2). */
export const useIsPhone = () => useMediaQuery("(max-width: 899px)");
