import { useEffect, useState } from "react";

export interface PlanPermissions {
  plan: string;
  planName: string;
  canCopy: boolean;
  canDownload: boolean;
  canPrint: boolean;
  hasAiAdvisor: boolean;
  aiDailyLimit: number;
  isAdmin: boolean;
  isSuperuser: boolean;
}

const defaultPermissions: PlanPermissions = {
  plan: "free",
  planName: "Gratuito",
  canCopy: false,
  canDownload: false,
  canPrint: false,
  hasAiAdvisor: false,
  aiDailyLimit: 2,
  isAdmin: false,
  isSuperuser: false,
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function usePlan() {
  const [permissions, setPermissions] = useState<PlanPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${basePath}/api/billing/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) {
          setPermissions({
            plan: data.plan,
            planName: data.planName,
            canCopy: data.permissions.canCopy,
            canDownload: data.permissions.canDownload,
            canPrint: data.permissions.canPrint,
            hasAiAdvisor: data.permissions.hasAiAdvisor,
            aiDailyLimit: data.permissions.aiDailyLimit,
            isAdmin: data.isAdmin ?? false,
            isSuperuser: data.isSuperuser ?? false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { permissions, loading };
}
