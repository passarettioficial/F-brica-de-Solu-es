import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

const TYPE_COLORS: Record<string, string> = {
  info: "bg-primary",
  success: "bg-green-500",
  warning: "bg-accent",
  alert: "bg-red-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/api/notifications`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as Notification[];
        setNotifications(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: number) {
    await fetch(`${basePath}/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    await fetch(`${basePath}/api/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        aria-label="Notificações"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[9px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-card border border-card-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-medium text-sm text-foreground">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${!n.isRead ? "bg-primary/3" : ""}`}
                  onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${TYPE_COLORS[n.type] ?? TYPE_COLORS.info} ${n.isRead ? "opacity-30" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border bg-muted/20">
            <Link href="/atendimento" className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpen(false)}>
              Precisa de ajuda? → Atendimento
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
