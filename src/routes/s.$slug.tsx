import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useSiteData } from "@/lib/khayal-store";
import { SideNav } from "@/components/SideNav";
import { CustomSectionView } from "@/components/CustomSectionView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/s/$slug")({
  component: SectionPage,
});

function SectionPage() {
  const { slug } = useParams({ from: "/s/$slug" });
  const [data] = useSiteData();
  const section = data.customSections.find((s) => s.slug === slug);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <div className="pt-16">
        {section ? (
          <CustomSectionView section={section} />
        ) : (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-3xl font-black mb-3">القسم غير موجود</h1>
            <p className="text-muted-foreground mb-6">ربما تم حذفه أو الرابط غير صحيح</p>
            <Button asChild className="bg-accent text-accent-foreground"><Link to="/">العودة للرئيسية</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
