import express from 'express';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve UI
app.get('/', (req, res) => {
  res.send(readFileSync('./index.html', 'utf8'));
});

// API endpoint for frontend chat
app.post('/api/chat', async (req, res) => {
  const userMsg = req.body.message;
  if (!userMsg) return res.status(400).json({ error: 'Missing message' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://friday-3xi0.onrender.com/',
        'X-Title': 'FRIDAY'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: [
          { role: 'system', content: 'You are FRIDAY, a helpful assistant.' },
          { role: 'user', content: userMsg }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response.';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Discord bot code (unchanged)
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://friday-3xi0.onrender.com/',
        'X-Title': 'FRIDAY'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: [
          { role: 'system', content: 'You are FRIDAY, a helpful assistant.' },
          { role: 'user', content: message.cleanContent }
        ]
      })
    });

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content || 'Sorry, I blanked out.';
    message.reply(response);
  } catch (error) {
    console.error(error);
    message.reply('There was an error.');
  }
});

client.login(process.env.TOKEN);

app.listen(PORT, () => {
  console.log(`🌐 Web UI running on port ${PORT}`);
});