import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { usePlan } from "@/hooks/usePlan";
import { PHASES } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

const PHASE_COLORS: Record<number, string> = {
  1: "#7724FD", 2: "#2D9CDB", 3: "#00C2A8",
  4: "#F59E0B", 5: "#EC4899", 6: "#22D3A0",
};

interface PhaseStatus {
  status: string;
}

interface AppSidebarProps {
  currentPhase?: number;
  projectId?: number;
  projectName?: string;
  phaseStatuses?: PhaseStatus[];
  completedPhases?: number;
}

export function AppSidebar({
  currentPhase,
  projectId,
  projectName,
  phaseStatuses,
  completedPhases = 0,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { permissions } = usePlan();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const isProjectContext = !!projectId;

  const mainNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, match: "/dashboard" },
    { label: "Assinatura", href: "/billing", icon: BillingIcon, match: "/billing" },
    { label: "AI Advisor", href: permissions.hasAiAdvisor ? `/projects/${projectId}/advisor` : "/pricing", icon: AdvisorIcon, match: "/advisor", planGated: !permissions.hasAiAdvisor },
    { label: "Atendimento", href: "/atendimento", icon: SupportIcon, match: "/atendimento" },
    { label: "Configurações", href: "/settings", icon: SettingsIcon, match: "/settings" },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <img
            src={`${basePath}/logo.svg`}
            alt="Logo"
            className="w-7 h-7 rounded-xl flex-shrink-0"
            style={{ background: "var(--phase-accent-soft)", border: "1px solid var(--phase-border)" }}
          />
          {!collapsed && (
            <span className="font-serif font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              FoundersFlow
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      {/* Project context — phase pipeline */}
      {isProjectContext && (
        <div className="px-3 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          {!collapsed && projectName && (
            <div className="px-2 mb-3">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
                Projeto
              </p>
              <Link href={`/projects/${projectId}`}>
                <p className="text-xs font-semibold truncate transition-colors hover:text-[var(--phase-accent)]" style={{ color: "var(--text-primary)" }}>
                  {projectName}
                </p>
              </Link>
            </div>
          )}

          <div className="space-y-0.5">
            {PHASES.slice(0, 6).map((phase, i) => {
              const phaseNum = i + 1;
              const status = phaseStatuses?.[i]?.status ?? "locked";
              const isDone = status === "completed";
              const isActive = phaseNum === currentPhase;
              const isLocked = status === "locked" && !isActive;
              const color = PHASE_COLORS[phaseNum] ?? "#7724FD";

              return (
                <Link
                  key={phaseNum}
                  href={isLocked ? "#" : `/projects/${projectId}/phases/${phaseNum}`}
                  className="sidebar-nav-item"
                  style={{
                    opacity: isLocked ? 0.4 : 1,
                    color: isActive ? color : isDone ? "var(--text-secondary)" : "var(--text-tertiary)",
                    borderLeftColor: isActive ? color : "transparent",
                    background: isActive ? `${color}18` : "transparent",
                    pointerEvents: isLocked ? "none" : "auto",
                    padding: collapsed ? "8px" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: isDone ? color : isActive ? `${color}28` : "var(--bg-surface-raised)",
                      border: `1px solid ${isActive || isDone ? color : "var(--border-subtle)"}`,
                      color: isDone ? "#fff" : isActive ? color : "var(--text-tertiary)",
                      boxShadow: isActive ? `0 0 10px ${color}55` : "none",
                    }}
                  >
                    {isDone ? "✓" : phaseNum}
                  </span>
                  {!collapsed && (
                    <span className="text-xs leading-snug truncate font-medium">
                      {phase.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {!collapsed && !isProjectContext && null}
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = location.startsWith(item.match);
          if (item.label === "AI Advisor" && !isProjectContext) return null;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="sidebar-nav-item"
              style={{
                color: isActive ? "var(--phase-accent)" : "var(--text-secondary)",
                borderLeftColor: isActive ? "var(--phase-accent)" : "transparent",
                background: isActive ? "var(--phase-accent-soft)" : "transparent",
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px" : "10px 16px",
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.planGated && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
                  Pro
                </span>
              )}
            </Link>
          );
        })}
        {permissions.isAdmin && (
          <Link
            href="/admin"
            className="sidebar-nav-item"
            style={{
              color: location.startsWith("/admin") ? "var(--phase-accent)" : "var(--text-secondary)",
              borderLeftColor: location.startsWith("/admin") ? "var(--phase-accent)" : "transparent",
              background: location.startsWith("/admin") ? "var(--phase-accent-soft)" : "transparent",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "10px" : "10px 16px",
            }}
            title={collapsed ? "Admin" : undefined}
          >
            <AdminIcon size={18} />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <Link
          href="/settings"
          className="sidebar-nav-item"
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px" : "10px 12px",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--phase-accent-soft)", color: "var(--phase-accent)", border: "1px solid var(--phase-border)" }}
          >
            {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {user?.firstName ?? "Conta"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                {permissions.planName}
              </p>
            </div>
          )}
        </Link>
        <div className={`mt-1 flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
          <div className="flex items-center gap-1">
            <ThemeToggle size={16} />
            {!collapsed && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Tema</span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors hover:bg-muted"
              style={{ color: "var(--text-tertiary)" }}
              title="Sair"
            >
              <SignOutIcon size={14} />
              Sair
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-muted"
              style={{ color: "var(--text-tertiary)" }}
              title="Sair"
            >
              <SignOutIcon size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ——— Icon components ——— */
function DashboardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function BillingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="2" /><path d="M2 8h16M7 12h2" />
    </svg>
  );
}
function AdvisorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2a6 6 0 0 1 6 6c0 2.5-1.5 4.6-3.6 5.6L12 17H8l-.4-3.4A6 6 0 0 1 10 2Z" /><path d="M8 17h4" />
    </svg>
  );
}
function SupportIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /><path d="M10 14h.01M10 10a1.5 1.5 0 0 1 0-3 1.5 1.5 0 0 1 1.5 1.5c0 1-1.5 1.5-1.5 2.5" />
    </svg>
  );
}
function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" /><path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M15.78 4.22l-1.06 1.06M5.28 14.72l-1.06 1.06" />
    </svg>
  );
}
function AdminIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L3 5v5c0 4 3 7.5 7 8.5C17 17.5 20 14 20 10V5l-7-3z" transform="scale(0.85) translate(1.5 1.5)" />
    </svg>
  );
}
function SignOutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3M13 14l4-4-4-4M17 10H7" />
    </svg>
  );
}
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {collapsed
        ? <><path d="M3 7h8M7 3l4 4-4 4" /></>
        : <><path d="M11 7H3M7 3L3 7l4 4" /></>
      }
    </svg>
  );
}
