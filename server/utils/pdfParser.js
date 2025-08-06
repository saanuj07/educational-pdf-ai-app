const pdfParse = require('pdf-parse');

async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

module.exports = { parsePdf };
