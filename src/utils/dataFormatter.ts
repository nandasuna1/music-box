export function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function formatReleaseDate(date: string) {
  if (!date) return "";

  const [year, month] = date.split("-");
  return `${month}/${year}`;
}
