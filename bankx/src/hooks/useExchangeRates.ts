import { useState, useEffect } from "react";
import { fetchRates } from "../api/fx";
import type { FXRates } from "../api/fx";
import { REDEEM_CURRENCIES } from "../constants";

const CODES = REDEEM_CURRENCIES.map((c) => c.code);
const TO_CODES = CODES.filter((c) => c !== "USD");

export function useExchangeRates() {
  const [rates, setRates] = useState<FXRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRates("USD", TO_CODES)
      .then((r) => {
        if (!cancelled) {
          setRates({ USD: 1, ...r });
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load rates");
          setRates({ USD: 1 }); // fallback so dropdown still works
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rates, loading, error };
}
