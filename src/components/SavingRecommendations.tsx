
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SavingRecommendation } from '@/types';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavingRecommendationsProps {
  recommendations: SavingRecommendation[];
  onDownloadReport: () => void;
  totalSpending: number;
  potentialSavings: number;
}

const SavingRecommendations: React.FC<SavingRecommendationsProps> = ({ 
  recommendations, 
  onDownloadReport,
  totalSpending,
  potentialSavings
}) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Saving Recommendations</CardTitle>
          <Button onClick={onDownloadReport} className="flex items-center gap-2">
            <Download size={16} />
            <span>Download Report</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-rupaiya-light to-white border-none shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-rupaiya-purple mb-2">
                <ArrowUp className="h-5 w-5" />
                <h3 className="font-bold">Total Spending</h3>
              </div>
              <p className="text-3xl font-bold text-rupaiya-purple">
                ₹{totalSpending.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-white border-none shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <ArrowDown className="h-5 w-5" />
                <h3 className="font-bold">Potential Savings</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ₹{potentialSavings.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-2">{recommendation.title}</h3>
                <p className="text-gray-600 mb-3">{recommendation.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm bg-rupaiya-light text-rupaiya-purple px-3 py-1 rounded-full">
                    {recommendation.category}
                  </span>
                  <span className="font-semibold text-green-600">
                    Save up to ₹{recommendation.potentialSavings.toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingRecommendations;
