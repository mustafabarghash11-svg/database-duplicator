import logo from "@/assets/khayal-logo.jpg";

export function KhayalLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Khayal Community"
      className={`${className} rounded-xl object-cover ring-2 ring-accent/40 shadow-[0_0_30px_oklch(0.65_0.18_215/0.5)]`}
    />
  );
}
