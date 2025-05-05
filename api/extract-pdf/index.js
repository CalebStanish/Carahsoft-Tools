const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const multiparty = require('multiparty');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function (context, req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        context.res = { status: 400, body: "Invalid form data" };
        return resolve();
      }

      const filePath = files.file[0].path;
      const fileBuffer = fs.readFileSync(filePath);
      const text = await pdfParse(fileBuffer).then(res => res.text);

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: `Analyze this PDF content:\n${text}` }],
      });

      context.res = {
        status: 200,
        body: response.choices[0].message.content,
      };

      return resolve();
    });
  });
};
