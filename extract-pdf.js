const fs = require('fs');
const PDFParser = require('pdf2json');

async function extract(file) {
  return new Promise((resolve) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", (err) => { console.error(err); resolve(); });
    parser.on("pdfParser_dataReady", (pdfData) => {
      let text = '';
      if (pdfData.Pages) {
        pdfData.Pages.forEach((page, i) => {
          text += `\n--- Page ${i + 1} ---\n`;
          if (page.Texts) {
            page.Texts.forEach(t => {
              if (t.R) t.R.forEach(r => { text += decodeURIComponent(r.T) + ' '; });
              text += '\n';
            });
          }
        });
      }
      console.log(`\n===== ${file} =====`);
      console.log(text);
      resolve();
    });
    parser.loadPDF(file);
  });
}

(async () => {
  await extract('JUNE MONTH PUBLICATION Review format_260718_090756.pdf');
  await extract('Monthly Target.pdf');
})();
