
import { Transaction } from '../types';
import { categorizeTransaction } from './transactionUtils';

// This is a mock PDF processing function
// In a real app, you'd use a library like pdf.js or a backend service with OCR capabilities
export const processPdfStatement = async (file: File): Promise<Transaction[]> => {
  console.log(`Processing PDF file: ${file.name}`);
  
  // In a real implementation, this would extract text from PDF
  // and parse it into structured transaction data
  // For now, we'll return a promise that simulates processing time
  // and then returns mock data
  
  return new Promise((resolve) => {
    // Simulate processing delay
    setTimeout(() => {
      // Create some mock transactions based on the file name for demonstration
      const transactions: Transaction[] = [];
      const today = new Date();
      
      // Generate 20 mock transactions from last month
      for (let i = 0; i < 20; i++) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - 1);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        
        const merchants = [
          'BigBasket', 'Swiggy', 'Zomato', 'Amazon', 'Flipkart', 
          'Netflix', 'Airtel', 'Uber', 'Apollo Pharmacy', 'HDFC Credit Card',
          'TATA CLiQ', 'Reliance Mart', 'BookMyShow', 'MakeMyTrip', 'Myntra'
        ];
        
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const amount = Math.floor(Math.random() * 5000) + 100; // Random amount between 100 and 5100
        
        const transaction: Transaction = {
          id: `pdf-trans-${i}`,
          date: date.toISOString().split('T')[0],
          description: `Payment to ${merchant}`,
          amount: amount,
          merchant: merchant,
          category: categorizeTransaction(`Payment to ${merchant}`)
        };
        
        transactions.push(transaction);
      }
      
      resolve(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, 2000); // Simulate 2 second processing time
  });
};

// Function to validate if a file is a PDF
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};
