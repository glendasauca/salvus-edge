const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GITHUB_TOKEN;

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

  const submissions = await readGist();

  const submission = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    participant,
    decisions: decisions || {},
    submittedAt: new Date().toISOString(),
  };
  submissions.push(submission);

  await writeGist(submissions);

  return res.status(200).json({ success: true, id: submission.id });
};

async function readGist() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  const data = await r.json();
  const content = data.files?.['submissions.json']?.content;
  try { return content ? JSON.parse(content) : []; } catch { return []; }
}

async function writeGist(submissions) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: { 'submissions.json': { content: JSON.stringify(submissions) } } }),
  });
}
