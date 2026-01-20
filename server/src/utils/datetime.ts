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

module.exports = {
  areDatesEffectivelySame,
};