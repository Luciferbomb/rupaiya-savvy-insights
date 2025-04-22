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
        
        // Modified approach for Axis Bank pattern - looking for distinct numeric amounts
        // Axis format typically has distinct numeric columns for debit, credit, and balance
        
        // Find all numbers that look like currency amounts
        const amountPattern = /([\d,]+\.\d{2})/g;
        let amountMatches = [];
        let match;
        
        while ((match = amountPattern.exec(remainingText)) !== null) {
          amountMatches.push({
            value: parseFloat(match[0].replace(/,/g, '')),
            position: match.index,
            raw: match[0]
          });
        }
        
        // Sort by position (left to right)
        amountMatches.sort((a, b) => a.position - b.position);
        
        console.log(`Found ${amountMatches.length} potential amounts:`, amountMatches);
        
        let amount = 0;
        let description = remainingText;
        let isCredit = false;
        
        // Try to figure out which amounts are debit, credit, and balance
        if (amountMatches.length >= 2) {
          // Remove all amounts from description text
          amountMatches.forEach(match => {
            description = description.replace(match.raw, '');
          });
          
          // Extract transaction description before first amount
          if (amountMatches.length > 0) {
            const beforeFirstAmount = remainingText.substring(0, amountMatches[0].position);
            description = beforeFirstAmount.trim();
          }
          
          // Clean up description
          description = description.replace(/\s+/g, ' ').trim();
          
          // Typically in Axis format:
          // For debits: First amount is debit, second is balance
          // For credits: First amount is credit, second is balance
          
          // Check if the line contains words that suggest a debit
          const isDebitIndicator = (line.toLowerCase().includes('debit') || 
              line.toLowerCase().includes('withdrawal') || 
              line.toLowerCase().includes('payment') ||
              line.toLowerCase().includes('atm') ||
              line.toLowerCase().includes('upi/p2m'));
          
          // Check if the line contains words that suggest a credit
          const isCreditIndicator = (line.toLowerCase().includes('credit') ||
              line.toLowerCase().includes('deposit') ||
              line.toLowerCase().includes('credit') ||
              line.toLowerCase().includes('salary') ||
              line.toLowerCase().includes('refund'));
              
          // For UPI, try to determine if it's debit or credit
          if (line.toLowerCase().includes('upi')) {
            if (line.toLowerCase().includes('upi/p2m')) {
              // P2M usually means payment to merchant (debit)
              amount = -Math.abs(amountMatches[0].value);
            } else if (line.toLowerCase().includes('upi/p2a')) {
              // Check context to determine direction
              if (isDebitIndicator) {
                amount = -Math.abs(amountMatches[0].value);
              } else {
                amount = Math.abs(amountMatches[0].value);
                isCredit = true;
              }
            }
          } else if (isDebitIndicator) {
            // This is likely a debit transaction
            amount = -Math.abs(amountMatches[0].value);
          } else if (isCreditIndicator) {
            // This is likely a credit transaction
            amount = Math.abs(amountMatches[0].value);
            isCredit = true;
          } else if (amountMatches.length >= 2) {
            // If we have multiple amounts and no clear indicator, use position to determine
            // First non-zero amount is usually the transaction amount
            // Negative means debit, positive means credit
            for (const match of amountMatches) {
              if (match.value !== 0) {
                amount = match.value;
                break;
              }
            }
            
            // If amount is ambiguous, make educated guess based on transaction description
            if (description.toLowerCase().includes('payment') || 
                description.toLowerCase().includes('purchase') ||
                description.toLowerCase().includes('withdrawal')) {
              amount = -Math.abs(amount);
            }
          }
        } else if (amountMatches.length === 1) {
          // Only one amount found - use context to determine if debit or credit
          amount = amountMatches[0].value;
          
          // Remove amount from description
          description = remainingText.replace(amountMatches[0].raw, '').trim();
          
          // Determine if it's debit or credit based on context
          if (description.toLowerCase().includes('debit') || 
              description.toLowerCase().includes('payment') ||
              description.toLowerCase().includes('purchase') ||
              description.toLowerCase().includes('withdrawal') ||
              description.toLowerCase().includes('dr')) {
            amount = -Math.abs(amount);
          } else if (description.toLowerCase().includes('credit') ||
                    description.toLowerCase().includes('deposit') ||
                    description.toLowerCase().includes('salary') ||
                    description.toLowerCase().includes('cr')) {
            isCredit = true;
          }
        }
        
        // Extract merchant name
        let merchant = "";
        
        // Try to extract merchant from UPI/IMPS descriptions
        if (description.includes('UPI')) {
          const upiParts = description.split('/');
          
          // Look for specific merchant names in UPI string
          for (const part of upiParts) {
            if (part.includes('ZOMATO') || 
                part.includes('ZEPTO') || 
                part.includes('BLINKIT') ||
                part.includes('AMAZON') ||
                part.includes('SWIGGY') ||
                part.includes('UBER') ||
                part.toUpperCase() !== part) { 
              merchant = part.trim();
              break;
            }
          }
          
          // If no specific merchant found, try to extract from UPI format
          if (!merchant && upiParts.length > 2) {
            merchant = upiParts[2].trim(); // Often the third segment has the merchant
          }
        } else if (description.includes('IMPS')) {
          // Handle IMPS transaction
          const impsParts = description.split('/');
          
          // Often the third or fourth segment contains recipient name
          if (impsParts.length > 3) {
            for (let i = 2; i < impsParts.length; i++) {
              const part = impsParts[i].trim();
              if (part && part.toUpperCase() !== part && part.length > 3) {
                merchant = part;
                break;
              }
            }
          }
        }
        
        // If no merchant found from UPI/IMPS, try to extract from description
        if (!merchant) {
          // Try to find name-like patterns
          const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/;
          const nameMatch = description.match(namePattern);
          
          if (nameMatch) {
            merchant = nameMatch[0];
          } else {
            // Use first part of description
            merchant = description.split(' ').slice(0, 2).join(' ');
          }
        }
        
        // Create transaction if we have a valid amount
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
  
  // Sort transactions by date (oldest first)
  return transactions
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
    
    // Load the PDF document with compatibility options
    const loadingTask = pdfjsLib.getDocument({
      data: fileData,
      disableFontFace: true // Might help with text extraction
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    // Extract text from all pages
    let textContent = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      
      // Get text content
      const content = await page.getTextContent();
      
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
