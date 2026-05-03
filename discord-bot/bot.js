import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function callSite(path, payload) {
  const res = await fetch(`${process.env.SITE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bot-Secret": process.env.BOT_SECRET,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

client.once(Events.ClientReady, (c) => console.log(`✅ Logged in as ${c.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;
  if (commandName !== "xp" && commandName !== "point") return;

  await interaction.deferReply({ ephemeral: true });
  const user = interaction.options.getUser("user", true);
  const amount = interaction.options.getInteger("amount", true);
  const reason = interaction.options.getString("reason") ?? undefined;

  const path = commandName === "xp" ? "/api/public/discord/xp" : "/api/public/discord/points";
  // discord.js v14: username is the new global handle (no discriminator).
  const discord_username = user.username;

  const { ok, status, json } = await callSite(path, { discord_username, amount, reason });

  if (!ok) {
    await interaction.editReply(`❌ فشل (${status}): ${json.error ?? "خطأ غير معروف"}`);
    return;
  }

  if (commandName === "xp") {
    await interaction.editReply(`✅ تم تحديث XP لـ <@${user.id}> → XP: **${json.xp}** (Lv ${json.level})`);
  } else {
    await interaction.editReply(`✅ تم تحديث النقاط لـ <@${user.id}> → النقاط: **${json.points}**`);
  }
});

client.login(process.env.DISCORD_TOKEN);
