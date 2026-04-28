import { createFileRoute } from "@tanstack/react-router";
import { useSiteData } from "@/lib/khayal-store";
import { SideNav } from "@/components/SideNav";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "أفضل اللاعبين — Khayal Community" },
      { name: "description", content: "ترتيب أفضل اللاعبين في مجتمع الخيال." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [data] = useSiteData();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-accent font-bold tracking-widest text-sm mb-3">// LEADERBOARD</p>
          <h1 className="text-4xl md:text-6xl font-black">أفضل اللاعبين</h1>
          <p className="text-muted-foreground mt-4">ترتيب نخبة لاعبي السيرفر</p>
        </div>

        {data.leaderboard.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">لا يوجد لاعبون مضافون بعد.</div>
        ) : (
          <div className="space-y-3">
            {[...data.leaderboard].sort((a, b) => a.rank - b.rank).map((p) => {
              const medal = p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4 hover:border-accent transition-all"
                >
                  <div className="text-3xl font-black w-14 text-center">{medal}</div>
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-muted shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black truncate">{p.name}</div>
                    {p.badge && <div className="text-xs text-accent">{p.badge}</div>}
                  </div>
                  <div className="text-2xl font-black text-accent tabular-nums">
                    {p.points.toLocaleString("en-US")}
                    <span className="text-xs text-muted-foreground font-normal mr-1">نقطة</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
