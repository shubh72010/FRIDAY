import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// 🟢 Keep-alive for Render
const app = express();
app.get('/', (_, res) => res.send('FRIDAY is alive 💻'));
app.listen(process.env.PORT || 3000);

// 🤖 Discord Bot Setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`✅ FRIDAY is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const mentioned = message.mentions.has(client.user);
  if (!mentioned) return;

  const prompt = message.content.replace(/<@!?(\d+)>/, '').trim();
  if (!prompt) {
    await message.reply("🗣️ You pinged me, but said nothing.");
    return;
  }

  console.log(`[FRIDAY PINGED] by ${message.author.tag}: ${prompt}`);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://friday-3xi0.onrender.com', // optional
        'X-Title': 'FRIDAY' // optional
      },
      body: JSON.stringify({
        model: 'openrouter/cypher-alpha:free',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    console.log("[OpenRouter Response]", JSON.stringify(data, null, 2));

    let reply = "🤖 Sorry, I blanked out.";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (data?.error?.message) {
      reply = `❌ OpenRouter Error: ${data.error.message}`;
    }

    message.reply(reply.slice(0, 2000)); // Limit to Discord's max
  } catch (err) {
    console.error("🔥 FRIDAY API crash:", err);
    message.reply("💥 Something went wrong. I'm rebooting my brain.");
  }
});

client.login(process.env.DISCORD_TOKEN);