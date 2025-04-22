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
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File parsing failed' });
    }

    const uploaded = files.file?.[0];
    if (!uploaded) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = fs.readFileSync(uploaded.filepath);
      const data = await pdf(buffer);

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
                'Extract the Quote Number, Grand Total, and End User/Customer Name from a sales quote PDF. Return them as an ordered HTML list only.',
            },
            {
              role: 'user',
              content: data.text,
            },
          ],
        }),
      });

      const json = await openaiRes.json();
      const html = json.choices?.[0]?.message?.content || '<ol><li>Extraction failed</li></ol>';
      res.status(200).send(html);
    } catch (error) {
      res.status(500).json({ error: 'Error processing PDF or contacting OpenAI.' });
    }
  });
}
