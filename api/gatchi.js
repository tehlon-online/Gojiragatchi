import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  console.log('Gatchi API handler invoked');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  // Expect { action, message, stats } from frontend
  const { action, message, stats } = req.body;
  if (!action || !stats) {
    res.status(400).json({ error: 'Missing action or stats in request body' });
    return;
  }
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    res.status(500).json({ error: 'OpenAI API key not set' });
    return;
  }

  // Read system instructions and game rules
  const sysPath = path.join(process.cwd(), '../../system_instructions.txt');
  const rulesPath = path.join(process.cwd(), '../../game_rules.txt');
  let systemInstructions = '';
  let gameRules = '';
  try {
    systemInstructions = fs.readFileSync(sysPath, 'utf-8');
    gameRules = fs.readFileSync(rulesPath, 'utf-8');
  } catch (e) {
    return res.status(500).json({ error: 'System instructions or game rules file not found.' });
  }

  // Build system prompt
  const systemPrompt = `${systemInstructions}\n\nGAME RULES:\n${gameRules}`;

  // Compose user message for the model
  const userMsg = `Action: ${action}\nMessage: ${message || ''}\nCurrent Stats: ${JSON.stringify(stats)}`;

  // Build messages array for OpenAI
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMsg }
  ];

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + openaiApiKey
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages
    })
  });

  if (!response.ok) {
    let errorMsg = 'OpenAI API error';
    try {
      const errData = await response.json();
      errorMsg = errData.error?.message || errorMsg;
    } catch {}
    return res.status(response.status).json({ error: errorMsg });
  }

  const data = await response.json();
  res.status(200).json(data);
}
