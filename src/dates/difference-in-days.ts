const millisecondsPerDay = 24 * 60 * 60 * 1000;

function utcMilliseconds(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function differenceInDays(earlierDate: string, laterDate: string): number {
  return (utcMilliseconds(laterDate) - utcMilliseconds(earlierDate)) / millisecondsPerDay;
}
