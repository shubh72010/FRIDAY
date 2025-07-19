import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // serve static files like PNG

// Serve UI
app.get('/', (req, res) => {
  res.send(readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
});

// Frontend AI chat endpoint
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
        model: 'openrouter/cypher-alpha:free',
        messages: [
          { role: 'system', content: 'You are FRIDAY, a helpful assistant.' },
          { role: 'user', content: userMsg }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '⚠️ No response.';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: '💥 Server error. Please try again later.' });
  }
});

// Discord bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
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
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          { role: 'system', content: 'You are FRIDAY, a helpful assistant.' },
          { role: 'user', content: message.cleanContent }
        ]
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || 'Sorry, I blanked out.';
    message.reply(reply);
  } catch (error) {
    console.error(error);
    message.reply('There was an error.');
  }
});

client.login(process.env.TOKEN);

// Launch UI
app.listen(PORT, () => {
  console.log(`🌐 Web UI running at http://localhost:${PORT}`);
});