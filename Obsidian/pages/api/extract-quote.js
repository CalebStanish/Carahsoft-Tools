export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed'); 
  }

  // rest of the code...
}



import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API key' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File parsing failed' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = fs.readFileSync(file[0].filepath);
      const data = await pdf(buffer);
      const text = data.text;

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'Extract the Quote Number, Grand Total, and End User/Customer Name from a sales quote document. Return them in an ordered HTML list only, no explanations.',
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      const result = await openaiRes.json();
      const content = result.choices?.[0]?.message?.content || '<ol><li>Missing data</li></ol>';
      res.status(200).send(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to extract or process PDF' });
    }
  });
}
