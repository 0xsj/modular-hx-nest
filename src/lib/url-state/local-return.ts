export function localReturnTo(value: unknown): string {
  const fallback = "/app";
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return fallback;
  if (
    [...value].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    return fallback;
  try {
    const target = new URL(value, "https://flover.invalid");
    const decoded = decodeURIComponent(target.pathname);
    if (
      target.origin !== "https://flover.invalid" ||
      decoded.includes("\\") ||
      decoded.includes("//") ||
      decoded.split("/").some((part) => part === "." || part === "..")
    )
      return fallback;
    if (
      [...decoded].some(
        (character) =>
          character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      )
    )
      return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
