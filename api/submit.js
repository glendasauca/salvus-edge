const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { participant, decisions } = req.body || {};

  if (!participant?.nombre) {
    return res.status(400).json({ error: 'Se requiere el nombre del participante' });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const submission = {
    id,
    participant,
    decisions: decisions || {},
    submittedAt: new Date().toISOString(),
  };

  await kv.lpush('salvus:submissions', JSON.stringify(submission));

  return res.status(200).json({ success: true, id });
};
