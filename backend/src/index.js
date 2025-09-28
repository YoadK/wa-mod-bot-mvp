require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect, Event, Blacklist, Whitelist, Member } = require('./db');
const { log, err } = require('./utils/logger');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());

const PORT = process.env.PORT || 3000;

connect(process.env.MONGO_URL).then(() => log('Mongo connected')).catch(err);

app.get('/healthz', (_req, res) => res.send('ok'));

app.get('/api/stats', async (_req, res) => {
  const since = new Date(); since.setHours(0,0,0,0);
  const totalToday = await Event.countDocuments({ createdAt: { $gte: since }, status: 'DONE', decision: 'block' });
  const topRules = await Event.aggregate([
    { $match: { createdAt: { $gte: since }, decision: 'block' } },
    { $group: { _id: '$ruleId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  res.json({ totalToday, topRules });
});

app.get('/api/events', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const docs = await Event.find().sort({ createdAt: -1 }).limit(limit).lean();
  res.json(docs);
});

app.get('/api/blacklist', async (_req, res) => {
  const items = await Blacklist.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post('/api/blacklist', async (req, res) => {
  const { phone, reason, ruleId } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone is required' });
  await Blacklist.updateOne({ phone }, { $set: { reason: reason || 'manual', ruleId: ruleId || 'manual' } }, { upsert: true });
  res.json({ ok: true });
});

app.delete('/api/blacklist/:phone', async (req, res) => {
  await Blacklist.deleteOne({ phone: req.params.phone });
  res.json({ ok: true });
});

app.post('/webhooks/green', async (req, res) => {
  res.sendStatus(200);
  try {
    const b = req.body || {};
    if (b?.typeWebhook !== 'incomingMessageReceived') return;

    const chatId = b.senderData?.chatId;
    if (!chatId || !chatId.endsWith('@g.us')) return;

    const idMessage = b.idMessage;
    const type = b.messageData?.typeMessage || 'unknown';
    const text = b.messageData?.textMessageData?.textMessage
      || b.messageData?.extendedTextMessageData?.text || '';

    const sender = b.senderData?.sender;
    if (sender) {
      await Member.updateOne(
        { phone: sender },
        { $setOnInsert: { firstSeen: new Date() }, $set: { lastSeen: new Date() } },
        { upsert: true }
      );
    }

    await Event.create({ idMessage, chatId, sender, type, text, status: 'NEW' });
  } catch (e) {
    if (!String(e.message).includes('duplicate key')) err('webhook error', e?.response?.data || e.message);
  }
});

app.listen(PORT, () => log(`API listening on :${PORT}`));
