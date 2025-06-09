import fs from 'fs';

export default function handler(req, res) {
  const files = fs.readdirSync(process.cwd());
  res.status(200).json({ files });
}
