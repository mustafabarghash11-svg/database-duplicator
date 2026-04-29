import { useEffect } from "react";

/**
 * Adds subtle UI sounds (hover + click) using WebAudio — no background music.
 * - Click: short crisp blip on buttons / links
 * - Hover: very soft tick on interactive elements
 * Respects prefers-reduced-motion and a localStorage mute flag (`khayal-sound-muted`).
 */
export function UISounds() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (localStorage.getItem("khayal-sound-muted") === "1") return;

    type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctor) return;
    let ctx: AudioContext | null = null;

    const ensure = () => {
      if (!ctx) ctx = new Ctor!();
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    };

    const tone = (freq: number, dur: number, vol: number, type: OscillatorType = "sine") => {
      const c = ensure();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur + 0.02);
    };

    const isInteractive = (el: EventTarget | null): HTMLElement | null => {
      if (!(el instanceof HTMLElement)) return null;
      return el.closest("button, a, [role='button'], input[type='submit'], input[type='button'], .ui-sound");
    };

    let lastHover: HTMLElement | null = null;
    const onOver = (e: MouseEvent) => {
      const target = isInteractive(e.target);
      if (!target || target === lastHover) return;
      lastHover = target;
      tone(880, 0.06, 0.025, "sine");
    };
    const onOut = (e: MouseEvent) => {
      if (isInteractive(e.target) === lastHover) lastHover = null;
    };
    const onClick = (e: MouseEvent) => {
      if (!isInteractive(e.target)) return;
      tone(660, 0.08, 0.06, "triangle");
      setTimeout(() => tone(990, 0.06, 0.04, "triangle"), 30);
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("click", onClick);
      ctx?.close().catch(() => {});
    };
  }, []);

  return null;
}
