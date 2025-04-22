import { Transaction } from '../types';
import { categorizeTransaction } from './transactionUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Enhanced utility to parse Axis Bank statement transaction rows from text lines
function parseAxisBankTransactions(text: string): Transaction[] {
  console.log('Raw PDF text:', text.substring(0, 1000) + '...'); // Log first 1000 chars for debugging
  
  // Preprocessing: fix common OCR issues
  text = text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
  
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log(`Total lines in PDF: ${lines.length}`);
  
  // Array to store parsed transactions
  const transactions: Transaction[] = [];
  let idCounter = 0;
  
  // Find transaction table by looking for date patterns
  const datePattern = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/;
  
  // Try to identify transaction rows by date pattern
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      console.log('Potential transaction row found:', line);
      
      try {
        // Extract the date
        const dateStr = dateMatch[0];
        
        // Format the date for consistency (YYYY-MM-DD)
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        const formattedDate = `${year}-${month}-${day}`;
        
        // Remove the date from the line to get the rest of the information
        let remainingText = line.replace(dateStr, '').trim();
        
        // Handle the case where there might be a cheque number
        if (/^\d{6,}/.test(remainingText.split(' ')[0])) {
          remainingText = remainingText.replace(/^\d{6,}\s+/, '');
        }
        
        // Extract numbers that could be amounts (look for currency patterns)
        const amountPattern = /([\d,]+\.\d{2})/g;
        const amounts = [];
        let amount = 0;
        let isCredit = false;
        let match;
        
        while ((match = amountPattern.exec(remainingText)) !== null) {
          const amountStr = match[0].replace(/,/g, '');
          amounts.push({
            value: parseFloat(amountStr),
            position: match.index
          });
        }
        
        // Extract description (everything before the first amount)
        let description = '';
        if (amounts.length > 0) {
          const firstAmountPos = amounts[0].position;
          description = remainingText.substring(0, firstAmountPos).trim();
          
          // Determine if it's a debit or credit transaction
          if (amounts.length >= 2) {
            // First amount is usually debit, second is credit, third is balance
            if (amounts[0].value > 0) {
              amount = -amounts[0].value; // Debit (negative)
            } else if (amounts[1].value > 0) {
              amount = amounts[1].value; // Credit (positive)
              isCredit = true;
            }
          } else if (amounts.length === 1) {
            // If there's only one amount, check the context
            if (remainingText.toLowerCase().includes('debit') || 
                remainingText.toLowerCase().includes('withdrawal') ||
                remainingText.toLowerCase().includes('payment')) {
              amount = -amounts[0].value; // Likely a debit
            } else {
              amount = amounts[0].value; // Assume credit
              isCredit = true;
            }
          }
        } else {
          // If no amounts found, just use the remaining text as description
          description = remainingText;
          console.log('No amounts found in transaction line');
        }
        
        // Clean up description
        description = description.replace(/\s+/g, ' ').trim();
        
        // Extract merchant from UPI/IMPS transaction descriptions
        let merchant = "";
        if (description.includes('UPI')) {
          // Look for UPI-specific patterns
          const upiMatch = description.match(/UPI\/(P2M|P2A|P2P)\/([^\/]+)/);
          if (upiMatch) {
            const upiParts = description.split('/');
            for (const part of upiParts) {
              if (part.includes('ZOMATO') || 
                  part.includes('ZEPTO') || 
                  part.includes('BLINKIT') ||
                  part.toUpperCase() !== part) { // Likely a merchant name if not all caps
                merchant = part;
                break;
              }
            }
          }
        } else if (description.includes('IMPS')) {
          // Look for IMPS-specific patterns
          const impsParts = description.split('/');
          for (const part of impsParts) {
            if (part.includes(' ') && part.toUpperCase() !== part) {
              merchant = part;
              break;
            }
          }
        }
        
        // If no merchant found, extract from description
        if (!merchant) {
          // Try to find a name-like sequence (words with capital letters)
          const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/;
          const nameMatch = description.match(namePattern);
          if (nameMatch) {
            merchant = nameMatch[0];
          } else {
            // Fall back to first few words
            merchant = description.split(' ').slice(0, 3).join(' ');
          }
        }
        
        // Only create transaction if we have a meaningful amount
        if (amount !== 0 || description) {
          const transaction: Transaction = {
            id: `trans-${idCounter++}`,
            date: formattedDate,
            description: description || 'Unnamed Transaction',
            amount: amount,
            merchant: merchant || 'Unknown Merchant',
            category: categorizeTransaction(description)
          };
          
          console.log('Extracted transaction:', transaction);
          transactions.push(transaction);
        }
      } catch (err) {
        console.error('Error parsing transaction line:', line, err);
      }
    }
  }
  
  console.log(`Total transactions extracted: ${transactions.length}`);
  
  // Sort transactions by date (oldest first) and ensure proper debit/credit sign
  return transactions
    .map(transaction => ({
      ...transaction,
      // Make sure debits are negative and credits are positive
      amount: transaction.description.toLowerCase().includes('debit') || 
              transaction.description.toLowerCase().includes('payment to') || 
              transaction.description.toLowerCase().includes('withdrawal') ? 
              -Math.abs(transaction.amount) : transaction.amount
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Fallback generic parser function (keep as backup)
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
    
    // Load the PDF document with enhanced options
    const loadingTask = pdfjsLib.getDocument({
      data: fileData,
      disableFontFace: true, // Might help with text extraction
      nativeImageDecoderSupport: 'display' // Better image handling
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    // Extract text from all pages with improved text extraction
    let textContent = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      
      // Get text with more granular options
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });
      
      // Build text content with position awareness
      const items = content.items as any[];
      items.sort((a, b) => {
        // Sort by vertical position first (rows)
        if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
          return b.transform[5] - a.transform[5]; // Higher y-value first
        }
        // If on same line, sort by horizontal position (columns)
        return a.transform[4] - b.transform[4];
      });
      
      let lastY = 0;
      for (const item of items) {
        // Add newline if significant y-position change
        if (lastY !== 0 && Math.abs(lastY - item.transform[5]) > 5) {
          textContent += '\n';
        }
        textContent += item.str + ' ';
        lastY = item.transform[5];
      }
      textContent += '\n';
    }
    
    console.log('Text extraction complete. Parsing transactions...');
    
    // Try the Axis Bank specific parser first
    let transactions = parseAxisBankTransactions(textContent);
    
    // If Axis Bank parser didn't find enough transactions, try the generic parser
    if (transactions.length < 2) {
      console.log('Axis Bank parser found too few transactions, trying generic parser');
      transactions = parseGenericBankTransactions(textContent);
    }

    // Post-process: sort by date descending for display
    transactions = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (transactions.length === 0) {
      console.warn("No transactions found. Raw text sample:", textContent.substring(0, 500));
      throw new Error("No transactions found in the PDF. The statement format may not be supported.");
    }
    
    return transactions;
  } catch (error) {
    console.error("Failed to extract data from PDF:", error);
    throw error;
  }
};

// Function to validate if a file is a PDF
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};
