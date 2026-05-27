const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GITHUB_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });

  if (!r.ok) return res.status(500).json({ error: 'No se pudo leer el almacenamiento' });

  const data = await r.json();
  const content = data.files?.['submissions.json']?.content;

  let submissions = [];
  try { submissions = content ? JSON.parse(content) : []; } catch { submissions = []; }

  return res.status(200).json({ submissions });
};
