import { createFileRoute, Link } from "@tanstack/react-router";
import { useSiteData, safeHref } from "@/lib/khayal-store";
import { SideNav } from "@/components/SideNav";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "الألعاب — Khayal Community" }] }),
  component: GamesPage,
});

function GamesPage() {
  const [data] = useSiteData();
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent font-bold tracking-widest text-sm mb-3">// GAMES</p>
          <h1 className="text-4xl md:text-6xl font-black">ألعابنا</h1>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.games.map((g) => (
            <a
              key={g.id}
              href={safeHref(g.link)}
              target="_blank"
              rel="noreferrer"
              className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-10px_oklch(0.65_0.18_215/0.5)]"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img src={g.image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-background via-background/90 to-transparent">
                <h3 className="text-xl font-black mb-1">{g.name}</h3>
                <p className="text-sm text-muted-foreground">{g.description}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/" className="text-accent hover:underline">← الرئيسية</Link>
        </div>
      </section>
    </div>
  );
}
