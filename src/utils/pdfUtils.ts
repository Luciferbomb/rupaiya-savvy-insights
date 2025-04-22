
import { Transaction } from '../types';
import { categorizeTransaction } from './transactionUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Enhanced utility to parse transaction rows from text lines
function parseTransactionsFromText(text: string): Transaction[] {
  console.log('Raw PDF text:', text); // Added logging for debugging

  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // More robust header/column detection
  const headerRegex = /(?:date|transaction\s*date).*?(?:description|details).*?(?:amount|value)/i;
  const startIdx = lines.findIndex(line => headerRegex.test(line));

  const transactions: Transaction[] = [];
  let idCounter = 0;

  // More flexible parsing logic
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    console.log('Processing line:', line); // Logging each line for debugging

    // Extended regex to capture various date and amount formats
    const dateMatch = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    const amountMatch = line.match(/([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);

    if (dateMatch && amountMatch) {
      try {
        const [dateStr] = dateMatch;
        const [amountStr] = amountMatch;

        // Clean and parse amount
        const cleanAmount = parseFloat(amountStr.replace(/[,₹\s]/g, ''));

        // Remove date and amount from line to get description
        const description = line
          .replace(dateStr, '')
          .replace(amountStr, '')
          .trim();

        // Standardize date format
        const formattedDate = (() => {
          const parts = dateStr.split(/[/-]/);
          if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
          if (parts[0]?.length === 4) return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
          return dateStr;
        })();

        const transaction: Transaction = {
          id: `pdf-trans-${idCounter++}`,
          date: formattedDate,
          description: description || 'Unnamed Transaction',
          amount: cleanAmount || 0,
          merchant: description.split(' ').slice(0, 3).join(' '),
          category: categorizeTransaction(description)
        };

        transactions.push(transaction);
      } catch (err) {
        console.warn('Could not parse transaction from line:', line, err);
      }
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
    
    // Extract text from all pages with improved text extraction
    let textContent = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
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

