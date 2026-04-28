import { createFileRoute } from "@tanstack/react-router";
import { useSiteData, safeHref } from "@/lib/khayal-store";
import { SideNav } from "@/components/SideNav";

export const Route = createFileRoute("/streamers")({
  head: () => ({
    meta: [
      { title: "المبدعون — Khayal Community" },
      { name: "description", content: "تابع أفضل المبدعين والستريمرز في مجتمع الخيال." },
    ],
  }),
  component: StreamersPage,
});

function StreamersPage() {
  const [data] = useSiteData();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-accent font-bold tracking-widest text-sm mb-3">// STREAMERS</p>
          <h1 className="text-4xl md:text-6xl font-black">المبدعون عندنا</h1>
          <p className="text-muted-foreground mt-4">تابع أفضل المبدعين على منصاتهم المختلفة</p>
        </div>

        {data.streamers.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">لا يوجد مبدعون مضافون حالياً.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.streamers.map((s) => (
              <a
                key={s.id}
                href={safeHref(s.link)}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-accent transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_oklch(0.65_0.18_215/0.4)]"
              >
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🎮</div>
                  )}
                  {s.isLive ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-white" />
                      LIVE
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Offline
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-black text-lg">{s.name}</h3>
                  {s.platform && <p className="text-xs text-muted-foreground mt-1">{s.platform}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
