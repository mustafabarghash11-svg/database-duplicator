import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/discord-callback`;

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (url.searchParams.get("action") === "login") {
    const appOrigin = url.searchParams.get("origin") || "";
    const state = btoa(JSON.stringify({ origin: appOrigin }));
    const authUrl = new URL("https://discord.com/oauth2/authorize");
    authUrl.searchParams.set("client_id", DISCORD_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "identify email");
    authUrl.searchParams.set("state", state);
    return Response.redirect(authUrl.toString(), 302);
  }

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code) return new Response("Missing code", { status: 400 });

  let appOrigin = "";
  try { appOrigin = JSON.parse(atob(stateParam || "")).origin || ""; } catch (_) {}

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!tokenRes.ok) return new Response(`Token exchange failed: ${await tokenRes.text()}`, { status: 500 });
  const tokenData = await tokenRes.json();

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const discordUser = await userRes.json();
  const discordId: string = discordUser.id;
  const username: string = discordUser.global_name || discordUser.username;
  const email: string = discordUser.email || `${discordId}@discord.user`;
  const avatar = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
    : null;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  let userId: string | null = null;
  const { data: existing } = await admin
    .from("profiles").select("user_id").eq("discord_id", discordId).maybeSingle();

  if (existing?.user_id) {
    userId = existing.user_id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { discord_id: discordId, username, avatar_url: avatar, provider: "discord" },
    });
    if (createErr || !created.user) {
      const { data: list } = await admin.auth.admin.listUsers();
      const found = list.users.find((u) => u.email === email);
      if (!found) return new Response(`Create user failed: ${createErr?.message}`, { status: 500 });
      userId = found.id;
    } else {
      userId = created.user.id;
    }
    await admin.from("profiles").upsert(
      { user_id: userId, discord_id: discordId, username, avatar_url: avatar, email },
      { onConflict: "user_id" },
    );
  }

  await admin.from("profiles")
    .update({ username, avatar_url: avatar, email })
    .eq("user_id", userId);

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: appOrigin || url.origin },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return new Response(`Link gen failed: ${linkErr?.message}`, { status: 500 });
  }

  return Response.redirect(linkData.properties.action_link, 302);
});
  
