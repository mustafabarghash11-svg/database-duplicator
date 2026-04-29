import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function SoundToggle() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem("khayal-sound-muted") === "1");
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("khayal-sound-muted", next ? "1" : "0");
    // Reload to (de)attach listeners cleanly
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
      title={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
      className="fixed bottom-4 left-4 z-50 w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center hover:border-accent hover:-translate-y-0.5 transition-all shadow-lg"
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-accent" />}
    </button>
  );
}
