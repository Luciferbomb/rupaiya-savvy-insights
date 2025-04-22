import { Transaction } from '../types';
import { categorizeTransaction } from './transactionUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Enhanced utility to parse Axis Bank statement transaction rows from text lines
function parseAxisBankTransactions(text: string): Transaction[] {
  console.log('Raw PDF text:', text); // Logging for debugging

  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Array to store parsed transactions
  const transactions: Transaction[] = [];
  let idCounter = 0;
  
  // Find the transaction table start - Look for header row with key column names
  const headerKeywords = ['Transaction Date', 'Particulars', 'Debit', 'Credit', 'Balance'];
  const startIdx = lines.findIndex(line => {
    // Check if at least 3 of the keywords are present to accommodate for varied header formats
    return headerKeywords.filter(keyword => line.includes(keyword)).length >= 3;
  });
  
  console.log('Table starts at line index:', startIdx);

  if (startIdx === -1) {
    console.warn('Could not locate transaction table header. Falling back to date pattern matching.');
  }

  // Indian date format pattern: DD-MM-YYYY
  const datePattern = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/;
  
  // Parse transactions from the identified table rows
  for (let i = (startIdx !== -1 ? startIdx + 1 : 0); i < lines.length; i++) {
    const line = lines[i];
    console.log('Processing line:', line);
    
    // Axis Bank transactions typically start with a date in DD-MM-YYYY format
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      // Extract the date
      const dateStr = dateMatch[0];
      
      // Format the date for consistency (YYYY-MM-DD)
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      const formattedDate = `${year}-${month}-${day}`;
      
      // Extract description - after the date and before amounts
      // Remove the date from the line
      let remainingText = line.replace(dateStr, '').trim();
      
      // Look for Cheque Number (skip if present)
      const chequePattern = /^\d{6,}/;
      if (chequePattern.test(remainingText.split(/\s+/)[0])) {
        // Remove cheque number
        remainingText = remainingText.replace(/^\d{6,}\s+/, '');
      }
      
      // Extract amount patterns
      // Accommodate both formats: with commas (1,234.56) and without (1234.56)
      const amountPattern = /[\d,.]+\.\d{2}/g;
      const amountMatches = [...remainingText.matchAll(amountPattern)];
      
      if (amountMatches.length >= 1) {
        // Extract description (everything before the first amount)
        const firstAmountIndex = remainingText.indexOf(amountMatches[0][0]);
        let description = remainingText.substring(0, firstAmountIndex).trim();
        
        // Clean up description
        description = description.replace(/\s+/g, ' ').trim();
        description = description || 'Unnamed Transaction';
        
        // Extract amounts
        // In Axis bank format, we might have Debit, Credit, and Balance columns
        // First check if it's a debit or credit transaction
        let amount = 0;
        let isCredit = false;
        
        // If we have at least two amount matches, the first is either debit or credit
        if (amountMatches.length >= 2) {
          // Check if the first amount slot has a value
          const amountStr = amountMatches[0][0].replace(/[,₹\s]/g, '');
          const nextAmountStr = amountMatches[1][0].replace(/[,₹\s]/g, '');
          
          // Determine if this is a debit or credit transaction
          // For Axis Bank: first column with value is debit, second is credit
          // Look at the positions to determine which one has a value
          const debitPos = remainingText.indexOf(amountMatches[0][0]);
          const creditPos = remainingText.indexOf(amountMatches[1][0]);
          
          const debitValue = parseFloat(amountStr);
          const creditValue = parseFloat(nextAmountStr);
          
          // If the first number is closer to the start and has a value, it's debit
          // Otherwise, it's credit
          if (!isNaN(debitValue) && debitPos < creditPos) {
            amount = debitValue;
            isCredit = false;
          } else if (!isNaN(creditValue)) {
            amount = creditValue;
            isCredit = true;
          }
        } else if (amountMatches.length === 1) {
          // Only one amount found, assume it's a running balance and skip
          console.log('Skipping line with only balance amount:', line);
          continue;
        }
        
        // Normalize merchant name from description
        let merchant = "";
        
        // Extract merchant from UPI patterns
        if (description.includes('UPI/P2M/') || description.includes('UPI/P2A/')) {
          const upiParts = description.split('/');
          // Try to get the merchant name from the UPI string
          for (let j = 0; j < upiParts.length; j++) {
            if (upiParts[j].includes('ZOMATO') || 
                upiParts[j].includes('ZEPTO') || 
                upiParts[j].includes('BLINKIT') ||
                upiParts[j].toUpperCase() !== upiParts[j]) { // Likely a merchant name if not all caps
              merchant = upiParts[j];
              break;
            }
          }
        } else if (description.includes('IMPS/P2A/')) {
          const impsParts = description.split('/');
          // For IMPS, try to extract recipient name
          for (let j = 0; j < impsParts.length; j++) {
            if (impsParts[j].includes(' ') && impsParts[j].toUpperCase() !== impsParts[j]) {
              merchant = impsParts[j];
              break;
            }
          }
        }
        
        // If no merchant found, use first 3 words or less
        if (!merchant) {
          merchant = description.split(' ').slice(0, 3).join(' ');
        }
        
        // Create transaction object
        const transaction: Transaction = {
          id: `axis-trans-${idCounter++}`,
          date: formattedDate,
          description: description,
          // For credits, store positive amount; for debits, store negative amount
          amount: isCredit ? amount : -amount,
          merchant: merchant,
          category: categorizeTransaction(description)
        };
        
        console.log('Extracted transaction:', transaction);
        transactions.push(transaction);
      }
    }
  }
  
  console.log(`Total transactions extracted: ${transactions.length}`);
  
  // Sort transactions by date (oldest first)
  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Enhanced utility to parse any bank statement transaction rows
function parseGenericBankTransactions(text: string): Transaction[] {
  console.log('Parsing with generic bank statement parser');
  
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // More robust header/column detection
  const headerRegex = /(?:date|transaction\s*date).*?(?:description|details|particulars).*?(?:amount|debit|credit|value)/i;
  const startIdx = lines.findIndex(line => headerRegex.test(line));

  const transactions: Transaction[] = [];
  let idCounter = 0;

  // More flexible parsing logic
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    console.log('Processing line:', line);

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
          return `20${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        })();

        const transaction: Transaction = {
          id: `generic-trans-${idCounter++}`,
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
    
    // First try Axis Bank specific parser
    let transactions = parseAxisBankTransactions(textContent);
    
    // If Axis Bank parser didn't find any transactions, try the generic parser
    if (transactions.length === 0) {
      console.log('Axis Bank parser found no transactions, trying generic parser');
      transactions = parseGenericBankTransactions(textContent);
    }

    if (transactions.length === 0) {
      console.warn("No structured transactions found in PDF text. Consider enhancing the parsing algorithm or implementing OCR.");
    }

    // Post-process: sort by date descending for display
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
