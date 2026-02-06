import { createContext, useContext, useMemo, useState } from 'react'
import type { Config } from '../types'
import { DEFAULT_CONFIG } from '../types'

interface ConfigContextValue {
  config: Config
  setConfig: React.Dispatch<React.SetStateAction<Config>>
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(() => ({ ...DEFAULT_CONFIG }))
  const value = useMemo(() => ({ config, setConfig }), [config])
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}
