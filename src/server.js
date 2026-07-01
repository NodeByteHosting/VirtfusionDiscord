require('dotenv').config();
const express = require('express');
const { formatEvent } = require('./formatEvent');
const { postToDiscord } = require('./discord');

const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhooks/virtfusion';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post(WEBHOOK_PATH, async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload.event !== 'string') {
    return res.status(400).json({ error: 'missing event field' });
  }
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL is not configured');
    return res.status(500).json({ error: 'relay not configured' });
  }

  try {
    const embed = formatEvent(payload);
    await postToDiscord(DISCORD_WEBHOOK_URL, embed);
    res.status(204).end();
  } catch (err) {
    console.error(`Failed to relay VirtFusion event "${payload.event}":`, err);
    res.status(502).json({ error: 'failed to relay to discord' });
  }
});

app.get('/healthz', (req, res) => res.status(200).send('ok'));

app.listen(PORT, () => {
  console.log(`VirtFusion -> Discord relay listening on port ${PORT}, webhook path ${WEBHOOK_PATH}`);
});
