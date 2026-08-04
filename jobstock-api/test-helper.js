import { extractResumeText } from './dist/src/resume-scanner/resume-scanner.service.js';

async function run() {
  try {
    const pdfText = await extractResumeText('test-resumes/tracemonkey.pdf');
    console.log('PDF text length:', pdfText.length);
    console.log('PDF start:', pdfText.substring(0, 100).replace(/\n/g, ' '));
  } catch (err) {
    console.error('PDF error:', err);
  }

  try {
    const docxText = await extractResumeText('test-resumes/document.docx');
    console.log('\nDOCX text length:', docxText.length);
    console.log('DOCX start:', docxText.substring(0, 100).replace(/\n/g, ' '));
  } catch (err) {
    console.error('DOCX error:', err);
  }
}
run();
