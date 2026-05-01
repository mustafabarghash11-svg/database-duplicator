import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SiteData } from "@/lib/khayal-store";

const SITE_ROW_ID = "main";

const saveSiteDataSchema = z.object({
  pin: z.string().min(1).max(32),
  data: z.custom<SiteData>((value) => {
    if (!value || typeof value !== "object") return false;
    const d = value as Partial<SiteData>;
    return typeof d.siteName === "string" && Array.isArray(d.games) && Array.isArray(d.customSections);
  }, "Invalid site data"),
});

export const saveSiteData = createServerFn({ method: "POST" })
  .inputValidator((data) => saveSiteDataSchema.parse(data))
  .handler(async ({ data }) => {
    const expectedPin = (process.env.DEVK_PIN || process.env.VITE_DEVK_PIN || "87").trim();
    if (!expectedPin || data.pin.trim() !== expectedPin) {
      throw new Error("كود المطور غير صحيح");
    }

    const { error } = await supabaseAdmin
      .from("site_data")
      .upsert({ id: SITE_ROW_ID, data: data.data, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
    return data.data;
  });
