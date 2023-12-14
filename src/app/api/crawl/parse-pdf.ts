// pages/api/crawl/parse-pdf.js
import pdfParse from 'pdf-parse';

export default async function handler(req, res) {
  try {
    // Expecting a POST request with the PDF file as a buffer in the body
    if (req.method === 'POST') {
      // Parse the PDF from the buffer
      const pdfData = await pdfParse(req.body);
      // Respond with the extracted text content from the PDF
      res.status(200).json({ text: pdfData.text });
    } else {
      // Handle any other HTTP method
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Failed to parse PDF: ${error}`);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
}