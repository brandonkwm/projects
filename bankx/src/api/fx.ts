/**
 * Fetch FX rates from Frankfurter (free, no API key).
 * https://www.frankfurter.dev/
 */

const API_BASE = "https://api.frankfurter.app";

export type FXRates = Record<string, number>;

export interface FXResponse {
  amount: number;
  base: string;
  date: string;
  rates: FXRates;
}

export async function fetchRates(from: string, to: string[]): Promise<FXRates> {
  if (to.length === 0) return {};
  if (from === "USD" && to.every((c) => c === "USD")) return { USD: 1 };
  const toParam = [...new Set(to)].filter((c) => c !== from).join(",");
  if (!toParam) return { [from]: 1 };
  const url = `${API_BASE}/latest?from=${from}&to=${toParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch FX rates");
  const data: FXResponse = await res.json();
  const rates: FXRates = { [from]: 1, ...data.rates };
  return rates;
}
