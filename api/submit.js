const https = require('https');

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Parse body manually (@vercel/node does not auto-parse)
  let body;
  try {
    body = await readBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { participant, decisions } = body || {};
  if (!participant?.nombre) {
    return res.status(400).json({ error: 'Se requiere el nombre del participante' });
  }

  try {
    const submissions = await readGist();
    submissions.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      participant,
      decisions: decisions || {},
      submittedAt: new Date().toISOString(),
    });
    await writeGist(submissions);
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function readGist() {
  const data = await ghRequest('GET', `/gists/${GIST_ID}`, null);
  const content = data.files?.['submissions.json']?.content;
  try { return content ? JSON.parse(content) : []; } catch { return []; }
}

async function writeGist(submissions) {
  await ghRequest('PATCH', `/gists/${GIST_ID}`, {
    files: { 'submissions.json': { content: JSON.stringify(submissions) } },
  });
}

function ghRequest(method, path, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const opts = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        Authorization: `token ${GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'salvus-edge',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    };
    const req = https.request(opts, (r) => {
      let data = '';
      r.on('data', (c) => (data += c));
      r.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from GitHub API')); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
