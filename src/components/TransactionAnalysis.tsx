
import React, { useState, useEffect } from 'react';
import { Transaction, CategoryTotal, MonthlySpending, MerchantTotal, SavingRecommendation } from '@/types';
import { 
  calculateCategoryTotals, 
  calculateMonthlySpending, 
  calculateMerchantTotals,
  generateSavingRecommendations
} from '@/utils/transactionUtils';
import SpendingCharts from './SpendingCharts';
import SavingRecommendations from './SavingRecommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from '@/components/ui/table';
import { Calendar, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionAnalysisProps {
  transactions: Transaction[];
}

const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({ transactions }) => {
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);
  const [merchantTotals, setMerchantTotals] = useState<MerchantTotal[]>([]);
  const [recommendations, setRecommendations] = useState<SavingRecommendation[]>([]);
  const [totalSpending, setTotalSpending] = useState<number>(0);
  const [potentialSavings, setPotentialSavings] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (transactions.length > 0) {
      // Calculate analytics
      const categories = calculateCategoryTotals(transactions);
      const monthly = calculateMonthlySpending(transactions);
      const merchants = calculateMerchantTotals(transactions);
      const recs = generateSavingRecommendations(transactions);
      
      setCategoryTotals(categories);
      setMonthlySpending(monthly);
      setMerchantTotals(merchants);
      setRecommendations(recs);
      
      // Calculate total spending
      const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      setTotalSpending(total);
      
      // Calculate potential savings
      const savings = recs.reduce((sum, rec) => sum + rec.potentialSavings, 0);
      setPotentialSavings(savings);
    }
  }, [transactions]);

  const handleDownloadReport = () => {
    // This would generate a PDF report in a real application
    // For now, we'll show a toast notification
    toast({
      title: "Report Download Started",
      description: "Your financial report is being generated and will download shortly."
    });
    
    // Create a simple text report for demonstration
    const reportContent = `
    RUPAIYA SAVVY - FINANCIAL REPORT
    ===============================
    
    SUMMARY
    -------
    Total Spending: ₹${totalSpending.toLocaleString('en-IN')}
    Potential Savings: ₹${potentialSavings.toLocaleString('en-IN')}
    
    SPENDING BY CATEGORY
    -------------------
    ${categoryTotals.map(cat => `${cat.category}: ₹${cat.total.toLocaleString('en-IN')}`).join('\n')}
    
    TOP MERCHANTS
    ------------
    ${merchantTotals.map(merchant => `${merchant.merchant}: ₹${merchant.total.toLocaleString('en-IN')}`).join('\n')}
    
    RECOMMENDATIONS
    --------------
    ${recommendations.map(rec => `${rec.title}: Save up to ₹${rec.potentialSavings.toLocaleString('en-IN')}\n${rec.description}`).join('\n\n')}
    `;
    
    // Create a blob and download it
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rupaiya-savvy-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format a date string in Indian format (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6">Your Financial Insights</h2>
      
      <SpendingCharts 
        categoryTotals={categoryTotals} 
        monthlySpending={monthlySpending} 
        merchantTotals={merchantTotals} 
      />
      
      <SavingRecommendations 
        recommendations={recommendations} 
        onDownloadReport={handleDownloadReport}
        totalSpending={totalSpending}
        potentialSavings={potentialSavings}
      />
      
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-rupaiya-purple" />
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="highest">Highest Value</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-opacity-20"
                                style={{ backgroundColor: categoryTotals.find(c => c.category === transaction.category)?.color + '30',
                                         color: categoryTotals.find(c => c.category === transaction.category)?.color }}>
                            {transaction.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{transaction.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-opacity-20"
                                style={{ backgroundColor: categoryTotals.find(c => c.category === transaction.category)?.color + '30',
                                         color: categoryTotals.find(c => c.category === transaction.category)?.color }}>
                            {transaction.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{transaction.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="highest" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...transactions].sort((a, b) => b.amount - a.amount).slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-opacity-20"
                                style={{ backgroundColor: categoryTotals.find(c => c.category === transaction.category)?.color + '30',
                                         color: categoryTotals.find(c => c.category === transaction.category)?.color }}>
                            {transaction.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{transaction.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadReport}>
              <Download size={16} />
              <span>Export Transactions</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionAnalysis;
