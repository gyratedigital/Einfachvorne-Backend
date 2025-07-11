export function formatGermanDate(dateInput: number | Date): string {
  const date =
    typeof dateInput === "number"
      ? new Date(dateInput < 1e12 ? dateInput * 1000 : dateInput) // handles seconds or ms
      : dateInput;

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}