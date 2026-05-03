# Khayal Discord Bot

بوت ديسكورد يضيف XP ونقاط لأعضاء موقع Khayal Community.

## الأوامر

- `/xp @user amount:50` — يعطي/يخصم XP
- `/point @user amount:10` — يعطي/يخصم نقاط متجر

> الربط: البوت يرسل `discord_username` (مثلاً `username#0` أو `username`). تأكد إن المستخدم بالموقع حاطط نفس اسم الديسكورد بحقل `discord_username` بالبروفايل.

## التشغيل

1. أنشئ تطبيق ديسكورد: https://discord.com/developers/applications
   - فعّل Bot، انسخ `DISCORD_TOKEN`
   - من General Information انسخ `APPLICATION_ID`
   - أضف البوت لسيرفرك بصلاحية `applications.commands` و `bot`
2. انسخ `.env.example` إلى `.env` واملأ القيم.
3. ثبّت وشغّل:
   ```bash
   npm install
   node register-commands.js   # لمرة واحدة لتسجيل الأوامر
   node bot.js
   ```

## الاستضافة المقترحة
- Railway / Render / Fly.io / VPS — أي مكان يشغّل Node بشكل دائم.

## API endpoints (مرجع)
- `POST https://safe-storage-pal.lovable.app/api/public/discord/xp`
- `POST https://safe-storage-pal.lovable.app/api/public/discord/points`

Headers: `X-Bot-Secret: <DISCORD_BOT_SECRET>`, `Content-Type: application/json`
Body: `{ "discord_username": "user", "amount": 50, "reason": "optional" }`
