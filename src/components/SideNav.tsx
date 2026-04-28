import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, User as UserIcon } from "lucide-react";
import { useSiteData, safeHref } from "@/lib/khayal-store";
import { useAuth } from "@/hooks/useAuth";
import { KhayalLogo } from "./KhayalLogo";

export function SideNav() {
  const [open, setOpen] = useState(false);
  const [data] = useSiteData();
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        className="fixed top-5 right-5 z-40 p-3 rounded-xl bg-card/80 backdrop-blur border border-border hover:border-accent transition-colors"
      >
        <Menu className="w-6 h-6 text-accent" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      <aside
        dir="rtl"
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl transition-transform duration-300 overflow-y-auto ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <KhayalLogo className="h-10 w-10" />
            <span className="font-bold">{data.siteName}</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="إغلاق" className="p-2 hover:text-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mounted && user && profile && (
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="block mx-5 mt-5 p-3 rounded-xl bg-gradient-to-l from-accent/15 to-transparent border border-accent/30 hover:border-accent transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{profile.display_name}</div>
                <div className="text-xs text-accent">Lv {profile.level} · {profile.points} نقطة</div>
              </div>
            </div>
          </Link>
        )}

        <nav className="p-5 space-y-1">
          <NavLink to="/" onClick={() => setOpen(false)}>الصفحة الرئيسية</NavLink>
          <NavLink to="/games" onClick={() => setOpen(false)}>الألعاب</NavLink>
          <NavLink to="/tournaments" onClick={() => setOpen(false)}>البطولات</NavLink>
          <NavLink to="/shop" onClick={() => setOpen(false)}>متجر النقاط</NavLink>
          <NavLink to="/streamers" onClick={() => setOpen(false)}>المبدعون</NavLink>
          <NavLink to="/leaderboard" onClick={() => setOpen(false)}>أفضل اللاعبين</NavLink>
          <NavLink to="/hall-of-fame" onClick={() => setOpen(false)}>قاعة الأبطال</NavLink>

          {mounted && !user && (
            <NavLink to="/auth" onClick={() => setOpen(false)}>تسجيل الدخول</NavLink>
          )}
          {mounted && user && (
            <NavLink to="/account" onClick={() => setOpen(false)}>حسابي</NavLink>
          )}

          {data.customSections.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border">
              <p className="px-4 pb-2 text-xs text-muted-foreground tracking-widest">// أقسام</p>
              {data.customSections.map((s) => (
                <Link
                  key={s.id}
                  to="/s/$slug"
                  params={{ slug: s.slug }}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-lg text-base hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  {s.title}
                </Link>
              ))}
            </div>
          )}

          <a
            href={safeHref(data.discordLink)}
            target="_blank"
            rel="noreferrer"
            className="block mt-4 px-4 py-3 rounded-lg bg-accent text-accent-foreground text-center font-bold hover:bg-accent/90"
          >
            انضم للديسكورد
          </a>
        </nav>
      </aside>
    </>
  );
}

type NavTo = "/" | "/games" | "/tournaments" | "/shop" | "/streamers" | "/leaderboard" | "/hall-of-fame" | "/auth" | "/account";

function NavLink({ to, onClick, children }: { to: NavTo; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: true }}
      activeProps={{ className: "block px-4 py-3 rounded-lg text-base bg-accent/15 text-accent font-bold transition-colors" }}
      inactiveProps={{ className: "block px-4 py-3 rounded-lg text-base hover:bg-accent/10 hover:text-accent transition-colors" }}
    >
      {children}
    </Link>
  );
                                                          }
