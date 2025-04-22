import React, { useState } from 'react';
import { Transaction } from '@/types';
import FileUpload from '@/components/FileUpload';
import TransactionAnalysis from '@/components/TransactionAnalysis';
import { generateMockTransactions } from '@/utils/transactionUtils';
import { Badge } from '@/components/ui/badge';
import { BadgeIndianRupee, BookOpen, FileUp, ChartPie } from 'lucide-react';

const Index: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleTransactionsLoaded = (loadedTransactions: Transaction[]) => {
    setTransactions(loadedTransactions);
    
    // Scroll to analysis section
    setTimeout(() => {
      const analysisSection = document.getElementById('analysis-section');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleUseMockData = () => {
    const mockTransactions = generateMockTransactions();
    handleTransactionsLoaded(mockTransactions);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {transactions.length === 0 && (
        <section className="py-12 md:py-20 px-4 bg-gradient-hero">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="md:w-1/2 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeIndianRupee className="h-8 w-8 text-rupaiya-purple" />
                  <Badge variant="outline" className="text-sm font-semibold bg-white/50 backdrop-blur-sm shadow-sm">
                    Made for India
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Gain Financial Clarity with Rupaiya Savvy
                </h1>
                
                <p className="text-lg text-white/90">
                  Upload your bank statement and discover insights about your spending habits. 
                  Get personalized recommendations to save money and take control of your finances.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-rupaiya-teal"></span>
                    <span className="text-white text-sm">Privacy First</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-rupaiya-orange"></span>
                    <span className="text-white text-sm">Indian Categories</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-rupaiya-yellow"></span>
                    <span className="text-white text-sm">Personalized Savings</span>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 flex justify-center">
                <div className="w-80 h-80 relative animate-float">
                  <div className="absolute top-0 left-0 w-full h-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl transform rotate-6 z-10"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-rupaiya-teal/30 backdrop-blur-md rounded-3xl shadow-xl transform -rotate-3 z-20"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-xl z-30 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-10 w-20 rounded-md bg-rupaiya-purple"></div>
                      <div className="flex gap-1">
                        <div className="h-4 w-4 rounded-full bg-rupaiya-orange"></div>
                        <div className="h-4 w-4 rounded-full bg-rupaiya-yellow"></div>
                        <div className="h-4 w-4 rounded-full bg-rupaiya-teal"></div>
                      </div>
                    </div>
                    <div className="h-4 w-3/4 rounded-full bg-gray-200 mb-3"></div>
                    <div className="h-4 w-1/2 rounded-full bg-gray-200 mb-6"></div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-rupaiya-light p-2">
                        <div className="h-3 w-10 bg-rupaiya-purple/30 rounded-full mb-2"></div>
                        <div className="h-6 w-16 bg-rupaiya-purple rounded-md"></div>
                      </div>
                      <div className="rounded-lg bg-rupaiya-orange/10 p-2">
                        <div className="h-3 w-10 bg-rupaiya-orange/30 rounded-full mb-2"></div>
                        <div className="h-6 w-16 bg-rupaiya-orange rounded-md"></div>
                      </div>
                      <div className="rounded-lg bg-rupaiya-teal/10 p-2">
                        <div className="h-3 w-10 bg-rupaiya-teal/30 rounded-full mb-2"></div>
                        <div className="h-6 w-16 bg-rupaiya-teal rounded-md"></div>
                      </div>
                      <div className="rounded-lg bg-rupaiya-yellow/10 p-2">
                        <div className="h-3 w-10 bg-rupaiya-yellow/30 rounded-full mb-2"></div>
                        <div className="h-6 w-16 bg-rupaiya-yellow rounded-md"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Upload Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          {transactions.length === 0 ? (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Upload Your Bank Statement</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Securely analyze your financial data and get personalized insights. We process your data locally - nothing is sent to our servers.
                </p>
              </div>
              <FileUpload 
                onTransactionsLoaded={handleTransactionsLoaded} 
                onUseMockData={handleUseMockData} 
              />
              
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-rupaiya-light flex items-center justify-center mb-4">
                    <FileUp className="h-8 w-8 text-rupaiya-purple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload Statement</h3>
                  <p className="text-gray-500">Simply upload your PDF bank statement to get started</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-rupaiya-light flex items-center justify-center mb-4">
                    <ChartPie className="h-8 w-8 text-rupaiya-purple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">View Analysis</h3>
                  <p className="text-gray-500">See your spending patterns with beautiful visualizations</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-rupaiya-light flex items-center justify-center mb-4">
                    <BookOpen className="h-8 w-8 text-rupaiya-purple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Get Recommendations</h3>
                  <p className="text-gray-500">Receive personalized tips to help you save money</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Your Financial Analysis</h2>
              <p className="text-gray-600">
                Here's what we found in your statement. Explore your spending patterns and find ways to save.
              </p>
            </div>
          )}
        </div>
      </section>
      
      {/* Analysis Section */}
      {transactions.length > 0 && (
        <section id="analysis-section" className="py-8 px-4 bg-gray-50">
          <div className="container mx-auto">
            <TransactionAnalysis transactions={transactions} />
          </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p className="mb-2">Rupaiya Savvy — Your Personal Finance Companion</p>
          <p>Data is processed locally for your privacy and security</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
