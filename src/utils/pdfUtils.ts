
import { Transaction } from '../types';
import { categorizeTransaction } from './transactionUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Utility to guess and parse transaction rows from text lines
function parseTransactionsFromText(text: string): Transaction[] {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  // Very basic header/column detection (adapt as needed for bank formats)
  const probableHeaderIdx = lines.findIndex(line =>
    /date.*desc.*amount|date.*details.*amount/i.test(line)
  );
  const startIdx = probableHeaderIdx >= 0 ? probableHeaderIdx + 1 : 0;

  const dateRegex = /(\d{2,4}[-/]\d{2}[-/]\d{2,4})/;
  const amountRegex = /([+-]?[₹]?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;

  const transactions: Transaction[] = [];
  let idCounter = 0;

  for (let i = startIdx; i < lines.length; i++) {
    // Example row: "12/03/2024 Amazon Shopping 2,100.50"
    const line = lines[i];
    const dateMatch = line.match(dateRegex);
    const amounts = line.match(amountRegex);

    if (dateMatch && amounts) {
      const [dateRaw] = dateMatch;
      const rest = line.replace(dateRegex, '').trim();
      const [descMatch] = rest.match(/([a-zA-Z0-9 ,.\-_/]+)/) || ['Transaction'];
      
      // Prefer last number as amount, strip ₹, commas
      const amountRaw = amounts[amounts.length - 1].replace(/[₹, ]/g, '');
      const amount = parseFloat(amountRaw);
      const description = descMatch.trim() || line.slice(0, 60);
      const merchant = description.split(' ').slice(-4).join(' ');

      const formattedDate = (() => {
        // Try to parse date to YYYY-MM-DD
        const parts = dateRaw.split(/[/-]/);
        if (parts[0].length === 4) return [parts[0], parts[1].padStart(2,'0'), parts[2].padStart(2,'0')].join('-');
        if (parts[2].length === 4) return [parts[2], parts[1].padStart(2,'0'), parts[0].padStart(2,'0')].join('-');
        return dateRaw;
      })();

      transactions.push({
        id: `pdf-trans-${idCounter++}`,
        date: formattedDate,
        description,
        amount: isNaN(amount) ? 0 : amount,
        merchant,
        category: categorizeTransaction(description)
      });
    }
  }
  return transactions;
}

export const processPdfStatement = async (file: File): Promise<Transaction[]> => {
  console.log(`Processing PDF file: ${file.name}`);

  try {
    // Read the PDF file as an ArrayBuffer
    const fileData = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: fileData });
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages
    let textContent = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      textContent += pageText + '\n';
    }
    
    let transactions = parseTransactionsFromText(textContent);

    if (transactions.length === 0) {
      console.warn("No structured transactions found in PDF text. Consider enhancing the parsing algorithm or implementing OCR.");
    }

    // Post-process: sort by date descending
    transactions = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return transactions;
  } catch (error) {
    console.error("Failed to extract data from PDF:", error);
    throw new Error("Unable to process PDF file. Please check if the file is accessible and properly formatted.");
  }
};

// Function to validate if a file is a PDF
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};
