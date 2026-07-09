"use client";

import { useEffect, useState, useCallback } from "react";
import type { ModuleKey } from "@/lib/modules";
import type { FinanzSectionKey } from "@/lib/finanzen-sections";

interface HouseholdConfig {
  enabledModules: ModuleKey[];
  enabledFinanzSections: FinanzSectionKey[];
  permissions: Record<string, { view: boolean; edit: boolean }>;
}

const DEFAULT_CONFIG: HouseholdConfig = {
  enabledModules: [],
  enabledFinanzSections: [],
  permissions: {},
};

let cachedConfig: HouseholdConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

export function useHouseholdConfig() {
  const [config, setConfig] = useState<HouseholdConfig>(cachedConfig ?? DEFAULT_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);

  const load = useCallback(async (force = false) => {
    if (!force && cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/mein-haushalt/config");
      if (res.ok) {
        const data = await res.json();
        cachedConfig = data;
        cacheTime = Date.now();
        setConfig(data);
      }
    } catch {
      // keep previous config
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isModuleEnabled = useCallback(
    (key: ModuleKey) => {
      if (config.enabledModules.length === 0) return true;
      return config.enabledModules.includes(key);
    },
    [config.enabledModules]
  );

  const isFinanzSectionEnabled = useCallback(
    (key: FinanzSectionKey) => {
      if (config.enabledFinanzSections.length === 0) return true;
      return config.enabledFinanzSections.includes(key);
    },
    [config.enabledFinanzSections]
  );

  const invalidate = useCallback(() => {
    cachedConfig = null;
    load(true);
  }, [load]);

  return { config, loading, isModuleEnabled, isFinanzSectionEnabled, refresh: invalidate };
}

/** Invalidate cached config after settings change */
export function invalidateHouseholdConfig() {
  cachedConfig = null;
  cacheTime = 0;
}
