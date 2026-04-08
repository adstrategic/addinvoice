export function fixedDateFromPrisma(date: Date): Date {
  // Prisma returns @db.Date as a DateTime at midnight UTC (e.g. "2024-03-15T00:00:00.000Z").
  // Interpreting that directly in a local timezone can shift the calendar day.
  // We normalize by taking the UTC year/month/day and constructing a local Date
  // at midnight for that same calendar day, so it renders consistently.
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}
