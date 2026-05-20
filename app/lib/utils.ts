/**
 * A custom lightweight utility for conditionally joining CSS class names together.
 * Resolves nested arrays, strings, and object-based conditional keys.
 * 
 * Example:
 *   cn("nav-item", { "active": active === "charts", "disabled": isDisabled })
 */
export function cn(...inputs: any[]): string {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string") return [input];
      if (typeof input === "number") return [String(input)];
      if (Array.isArray(input)) return [cn(...input)];
      if (typeof input === "object") {
        return Object.entries(input)
          .filter(([_, value]) => !!value)
          .map(([key]) => key);
      }
      return [];
    })
    .filter(Boolean)
    .join(" ");
}
