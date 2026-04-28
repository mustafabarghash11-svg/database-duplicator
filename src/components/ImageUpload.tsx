import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function ImageUpload({ value, onChange, placeholder = "رابط الصورة" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار صورة");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("الصورة كبيرة جداً (الحد 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      toast.success("تم رفع الصورة");
    };
    reader.onerror = () => toast.error("فشل قراءة الملف");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1" />
        <Button type="button" variant="outline" size="icon" onClick={() => ref.current?.click()} title="رفع صورة">
          <Upload className="w-4 h-4" />
        </Button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {value && (
        <img src={value} alt="معاينة" className="h-20 w-20 object-cover rounded-lg border border-border" />
      )}
    </div>
  );
}
