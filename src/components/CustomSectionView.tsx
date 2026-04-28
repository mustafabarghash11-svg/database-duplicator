import { type CustomSection, safeHref } from "@/lib/khayal-store";
import { Button } from "@/components/ui/button";

function getYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("twitch.tv")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "videos" && parts[1]) return `https://player.twitch.tv/?video=${parts[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`;
      if (parts[0]) return `https://player.twitch.tv/?channel=${parts[0]}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`;
    }
  } catch { /* ignore */ }
  return null;
}

function socialIcon(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("twitter") || p === "x") return "𝕏";
  if (p.includes("insta")) return "📸";
  if (p.includes("tiktok")) return "🎵";
  if (p.includes("youtube")) return "▶️";
  if (p.includes("twitch")) return "🎮";
  if (p.includes("discord")) return "💬";
  if (p.includes("facebook")) return "📘";
  if (p.includes("snap")) return "👻";
  if (p.includes("telegram")) return "✈️";
  return "🔗";
}

export function CustomSectionView({ section }: { section: CustomSection }) {
  if (section.active === false) return null;
  return (
    <section id={section.slug} className="py-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-accent font-bold tracking-widest text-sm mb-3">// SECTION</p>
        <h2 className="text-4xl md:text-5xl font-black">{section.title}</h2>
      </div>
      <div className="space-y-6">
        {section.blocks.map((b) => {
          if (b.type === "heading")
            return <h3 key={b.id} className="text-2xl md:text-3xl font-bold text-center">{b.text}</h3>;

          if (b.type === "text")
            return <p key={b.id} className="text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap">{b.text}</p>;

          if (b.type === "image")
            return (
              <img
                key={b.id}
                src={b.src}
                alt={b.alt}
                loading="lazy"
                className="w-full max-w-3xl mx-auto rounded-2xl border border-border"
              />
            );

          if (b.type === "button")
            return (
              <div key={b.id} className="text-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8">
                  <a href={safeHref(b.link)} target="_blank" rel="noreferrer">{b.text}</a>
                </Button>
              </div>
            );

          if (b.type === "divider")
            return <hr key={b.id} className="border-border max-w-3xl mx-auto" />;

          if (b.type === "list")
            return (
              <ul key={b.id} className="max-w-3xl mx-auto space-y-2 text-muted-foreground list-disc pr-6">
                {b.items.map((item, i) => <li key={i} className="leading-relaxed">{item}</li>)}
              </ul>
            );

          if (b.type === "cards")
            return (
              <div key={b.id} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {b.items.map((c) => {
                  const inner = (
                    <>
                      {c.image ? (
                        <img src={c.image} alt={c.title} loading="lazy" className="w-full h-40 object-cover rounded-xl mb-3" />
                      ) : (
                        <div className="text-4xl mb-3">{c.icon || "✨"}</div>
                      )}
                      <h4 className="text-lg font-black mb-1">{c.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                    </>
                  );
                  const baseClass = "rounded-2xl bg-card border border-border p-5 hover:border-accent transition-all hover:-translate-y-1 block";
                  return c.link && c.link !== "#" ? (
                    <a key={c.id} href={safeHref(c.link)} target="_blank" rel="noreferrer" className={baseClass}>{inner}</a>
                  ) : (
                    <div key={c.id} className={baseClass}>{inner}</div>
                  );
                })}
              </div>
            );

          if (b.type === "video") {
            const embed = getYouTubeEmbed(b.url);
            return (
              <div key={b.id} className="max-w-3xl mx-auto">
                {embed ? (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-border">
                    <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={b.caption || "video"} />
                  </div>
                ) : (
                  <video src={b.url} controls className="w-full rounded-2xl border border-border" />
                )}
                {b.caption && <p className="text-center text-sm text-muted-foreground mt-2">{b.caption}</p>}
              </div>
            );
          }

          if (b.type === "social")
            return (
              <div key={b.id} className="flex flex-wrap justify-center gap-3">
                {b.items.map((s) => (
                  <a
                    key={s.id}
                    href={safeHref(s.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-accent hover:-translate-y-1 transition-all font-bold"
                  >
                    <span className="text-xl">{socialIcon(s.platform)}</span>
                    <span>{s.label || s.platform}</span>
                  </a>
                ))}
              </div>
            );

          return null;
        })}
      </div>
    </section>
  );
}
