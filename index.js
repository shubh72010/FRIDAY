import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import express from 'express'; // For Render ping

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Optional keep-alive for Render
const app = express();
app.get('/', (_, res) => res.send('FRIDAY is awake. 🧠'));
app.listen(process.env.PORT || 3000);

client.once('ready', () => {
  console.log(`🟢 FRIDAY is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user);
  if (!isMentioned) return;

  const prompt = message.content.replace(/<@!?(\d+)>/, '').trim();
  if (!prompt) return message.reply("🗣️ You pinged me, but said nothing.");

  await message.channel.send("💭 FRIDAY is thinking...");

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cypher-alpha',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "🤖 Sorry, I blanked out.";

    message.reply(reply.slice(0, 2000));
  } catch (err) {
    console.error("💥 Error:", err);
    message.reply("❌ Something went wrong in my circuits.");
  }
});

client.login(process.env.DISCORD_TOKEN);