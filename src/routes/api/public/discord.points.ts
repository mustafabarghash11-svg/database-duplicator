import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Bot-Secret",
};

const Schema = z.object({
  discord_username: z.string().min(1).max(100).optional(),
  user_id: z.string().uuid().optional(),
  amount: z.number().int().min(-100000).max(100000),
  reason: z.string().max(280).optional(),
}).refine((d) => d.discord_username || d.user_id, { message: "discord_username or user_id required" });

export const Route = createFileRoute("/api/public/discord/points")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const secret = request.headers.get("x-bot-secret");
        if (!secret || secret !== process.env.DISCORD_BOT_SECRET) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        let body: unknown;
        try { body = await request.json(); } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: parsed.error.issues }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        const { discord_username, user_id, amount } = parsed.data;

        let query = supabaseAdmin.from("profiles").select("user_id, points");
        query = user_id ? query.eq("user_id", user_id) : query.eq("discord_username", discord_username!);
        const { data: profile, error: pErr } = await query.maybeSingle();
        if (pErr) return new Response(JSON.stringify({ error: pErr.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        if (!profile) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });

        const newPoints = Math.max(0, (profile.points ?? 0) + amount);
        const { error: uErr } = await supabaseAdmin.from("profiles")
          .update({ points: newPoints })
          .eq("user_id", profile.user_id);
        if (uErr) return new Response(JSON.stringify({ error: uErr.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

        return new Response(JSON.stringify({ success: true, user_id: profile.user_id, points: newPoints }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
