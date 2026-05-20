import { useEffect } from "react";

/**
 * Custom hook to register a global keyboard shortcut (e.g., 'Escape', or a combination like 'Cmd+K' / 'Ctrl+K').
 */
export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options?: { metaOrCtrl?: boolean }
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTargetKey = e.key.toLowerCase() === key.toLowerCase();
      
      if (options?.metaOrCtrl) {
        const hasMetaOrCtrl = e.metaKey || e.ctrlKey;
        if (hasMetaOrCtrl && isTargetKey) {
          e.preventDefault();
          callback(e);
        }
      } else {
        if (isTargetKey) {
          callback(e);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, callback, options?.metaOrCtrl]);
}
