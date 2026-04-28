import { type CustomSection, safeHref } from "@/lib/khayal-store";
import { Button } from "@/components/ui/button";

export function CustomSectionView({ section }: { section: CustomSection }) {
  return (
    <section id={section.slug} className="py-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-accent font-bold tracking-widest text-sm mb-3">// SECTION</p>
        <h2 className="text-4xl md:text-5xl font-black">{section.title}</h2>
      </div>
      <div className="space-y-6">
        {section.blocks.map((b) => {
          if (b.type === "heading") return <h3 key={b.id} className="text-2xl md:text-3xl font-bold text-center">{b.text}</h3>;
          if (b.type === "text") return <p key={b.id} className="text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap">{b.text}</p>;
          if (b.type === "image") return (
            <img
              key={b.id}
              src={b.src}
              alt={b.alt}
              loading="lazy"
              className="w-full max-w-3xl mx-auto rounded-2xl border border-border"
            />
          );
          if (b.type === "button") return (
            <div key={b.id} className="text-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8">
                <a href={safeHref(b.link)} target="_blank" rel="noreferrer">{b.text}</a>
              </Button>
            </div>
          );
          return null;
        })}
      </div>
    </section>
  );
}
