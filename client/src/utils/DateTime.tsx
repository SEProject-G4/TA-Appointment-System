function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const areDatesEffectivelySame = (
    date1Str: string,
    date2Str: string,
  ): boolean => {
    if (!date1Str || !date2Str) return false;
    const date1 = new Date(date1Str).getTime();
    const date2 = new Date(date2Str).getTime();
    const tolerance = 60000; // 60 seconds in milliseconds
return Math.abs(date1 - date2) <= tolerance;
};

export { toLocalDatetimeInputValue, areDatesEffectivelySame };