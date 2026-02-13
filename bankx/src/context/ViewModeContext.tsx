import { createContext, useContext, useState, type ReactNode } from "react";

export type AccountView = "sender" | "recipient";

const ViewModeContext = createContext<{
  viewMode: AccountView;
  setViewMode: (v: AccountView) => void;
} | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<AccountView>("sender");
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
