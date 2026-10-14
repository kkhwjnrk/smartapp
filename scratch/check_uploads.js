// Parse the OCR data from the prompt
import fs from 'fs';

// Let's read the PDF file if it was saved locally, or parse OCR text
// Check if the uploaded PDF exists in the artifacts directory
const artifactsDir = 'C:\\Users\\Kukuh\\.gemini\\antigravity-ide\\brain\\70867881-6231-4698-8c95-72d0456d0b25\\.user_uploaded';
console.log('Artifacts files:', fs.readdirSync(artifactsDir));
