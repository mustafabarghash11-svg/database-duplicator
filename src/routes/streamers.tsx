import { createFileRoute } from "@tanstack/react-router";
import { useSiteData } from "@/lib/khayal-store";
import { SideNav } from "@/components/SideNav";
import { StreamerCard } from "@/components/StreamerCard";

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
              <StreamerCard key={s.id} streamer={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
