type Props = { activeTab: string; setActiveTab: (id: string) => void };

export default function Sidebar({ activeTab, setActiveTab }: Props) {
  const items = [
    { id: "games", label: "🎮 الألعاب" },
    { id: "stats", label: "📊 الإحصائيات" },
    { id: "perks", label: "✨ المميزات" },
    { id: "streamers", label: "🎥 الستريمرز" },
    { id: "leaderboard", label: "🏆 التوب" },
    { id: "hof", label: "👑 Hall of Fame" },
    { id: "sections", label: "🧩 الأقسام" },
  ];

  return (
    <div className="w-64 bg-card border-r p-4 space-y-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full text-right px-4 py-2 rounded-xl transition ${
            activeTab === item.id ? "bg-accent text-white" : "hover:bg-muted"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
