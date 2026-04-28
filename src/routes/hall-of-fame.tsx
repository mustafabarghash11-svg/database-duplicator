import { createFileRoute } from "@tanstack/react-router";
import { useSiteData } from "@/lib/khayal-store";
import { SideNav } from "@/components/SideNav";

export const Route = createFileRoute("/hall-of-fame")({
  head: () => ({
    meta: [
      { title: "قاعة الأبطال — Khayal Community" },
      { name: "description", content: "أبطال البطولات السابقة في مجتمع الخيال." },
    ],
  }),
  component: HallOfFamePage,
});

function HallOfFamePage() {
  const [data] = useSiteData();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-accent font-bold tracking-widest text-sm mb-3">// HALL OF FAME</p>
          <h1 className="text-4xl md:text-6xl font-black">قاعة الأبطال</h1>
          <p className="text-muted-foreground mt-4">أبطال البطولات السابقة</p>
        </div>

        {data.hallOfFame.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">لا يوجد أبطال مضافون بعد.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.hallOfFame.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-gradient-to-br from-accent/10 via-card to-card border border-accent/30 p-6 text-center hover:border-accent transition-all hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">🏆</div>
                <div className="h-24 w-24 mx-auto mb-4 rounded-full overflow-hidden bg-muted ring-2 ring-accent/40">
                  {c.image ? (
                    <img src={c.image} alt={c.championName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👑</div>
                  )}
                </div>
                <h3 className="font-black text-lg">{c.championName}</h3>
                <p className="text-sm text-accent mt-1">{c.tournament}</p>
                {c.year && <p className="text-xs text-muted-foreground mt-1">{c.year}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
