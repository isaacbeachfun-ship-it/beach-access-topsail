import type { BeachAccess } from "../types/access";

function trimRate(rate: string | null): string | null {
  const trimmed = rate?.trim();
  return trimmed ? trimmed : null;
}

function hasOwnPeriod(rate: string): boolean {
  return /\/|\b(per|daily|hourly|weekly|season|annual|vehicle)\b/i.test(rate);
}

function formatTimedRate(rate: string | null, suffix: string): string | null {
  const trimmed = trimRate(rate);
  if (!trimmed) return null;
  return hasOwnPeriod(trimmed) ? trimmed : `${trimmed}/${suffix}`;
}

function formatParkingTimeframe(access: BeachAccess): string | null {
  const text = `${access.comments} ${access.sourceDetail}`;
  const runsMatch = text.match(/paid parking runs ([^.]+)\./i);
  if (runsMatch) return `Timing: ${runsMatch[1]}`;

  const enforcedMatch = text.match(/enforced ([^.]+)\./i);
  if (enforcedMatch) return `Timing: ${enforcedMatch[1]}`;

  const requiredMatch = text.match(/required ([^.;]+)(?:[.;]|$)/i);
  if (requiredMatch) return `Timing: ${requiredMatch[1]}`;

  return null;
}

export function formatParkingRateSummary(access: BeachAccess): string | null {
  if (access.parkingSpots <= 0) return null;

  if (access.parkingFee === false) {
    return "Free parking";
  }

  if (access.parkingFee !== true) {
    return null;
  }

  const rates = [
    formatTimedRate(access.hourlyRate, "hr"),
    formatTimedRate(access.dailyRate, "day"),
    formatTimedRate(access.weeklyRate, "week"),
    trimRate(access.seasonalRate),
  ].filter((rate): rate is string => Boolean(rate));
  const rateSummary = rates.length > 0 ? `Rates: ${rates.join(", ")}` : "Paid parking";
  const timeframe = formatParkingTimeframe(access);

  return timeframe ? `${rateSummary}. ${timeframe}` : rateSummary;
}
