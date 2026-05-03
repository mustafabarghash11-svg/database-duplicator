import "dotenv/config";
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("xp")
    .setDescription("إضافة أو خصم XP لعضو")
    .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
    .addIntegerOption((o) => o.setName("amount").setDescription("الكمية (سالب لخصم)").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("سبب اختياري"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("point")
    .setDescription("إضافة أو خصم نقاط متجر لعضو")
    .addUserOption((o) => o.setName("user").setDescription("العضو").setRequired(true))
    .addIntegerOption((o) => o.setName("amount").setDescription("الكمية (سالب لخصم)").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("سبب اختياري"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.APPLICATION_ID);

await rest.put(route, { body: commands });
console.log("✅ Commands registered", process.env.GUILD_ID ? "(guild)" : "(global, may take ~1h)");
