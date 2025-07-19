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
app.use(express.static(__dirname));

// Serve UI
app.get('/', (req, res) => {
  res.send(readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
});

// Frontend AI chat endpoint using Groq
app.post('/api/chat', async (req, res) => {
  const userMsg = req.body.message;
  if (!userMsg) return res.status(400).json({ error: 'Missing message' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are FRIDAY, a helpful assistant.' },
          { role: 'user', content: userMsg }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '⚠️ No response.';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: '💥 Server error. Please try again later.' });
  }
});

// Discord bot using Groq
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are FRIDAY, a helpful assistant.' },
          { role: 'user', content: message.cleanContent }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I blanked out.';
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