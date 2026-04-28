import type { ReactNode } from "react";
import { DiscordLiveCount } from "@/components/DiscordLiveCount";
import { useSiteData } from "@/lib/khayal-store";

type Props = { activeTab: string };

export default function ContentArea({ activeTab }: Props) {
  const [data] = useSiteData();

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {activeTab === "games" && <Section title="🎮 إدارة الألعاب" />}
      {activeTab === "stats" && (
        <Section title="📊 الإحصائيات">
          {data.discordServerId && (
            <DiscordLiveCount serverId={data.discordServerId} />
          )}
        </Section>
      )}
      {activeTab === "perks" && <Section title="✨ المميزات" />}
      {activeTab === "streamers" && <Section title="🎥 الستريمرز" />}
      {activeTab === "leaderboard" && <Section title="🏆 التوب" />}
      {activeTab === "hof" && <Section title="👑 Hall of Fame" />}
      {activeTab === "sections" && <Section title="🧩 الأقسام المخصصة" />}
    </div>
  );
}

function Section({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bg-card p-6 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button className="bg-accent text-white px-4 py-2 rounded-lg">+ إضافة</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children || <p className="text-muted-foreground">لا يوجد محتوى حالياً</p>}
      </div>
    </div>
  );
        }
