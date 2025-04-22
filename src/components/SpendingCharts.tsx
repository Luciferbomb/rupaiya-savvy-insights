
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { CategoryTotal, MonthlySpending, MerchantTotal } from '@/types';
import { ChartPie, ChartLine, IndianRupee } from 'lucide-react';

// Custom formatter for Indian Rupee
const formatRupee = (value: number) => {
  return `₹${value.toLocaleString('en-IN')}`;
};

interface SpendingChartsProps {
  categoryTotals: CategoryTotal[];
  monthlySpending: MonthlySpending[];
  merchantTotals: MerchantTotal[];
}

const SpendingCharts: React.FC<SpendingChartsProps> = ({ 
  categoryTotals, 
  monthlySpending, 
  merchantTotals 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Category Spending Pie Chart */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ChartPie className="h-5 w-5 text-rupaiya-purple" />
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="category"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupee(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Spending Trend Line Chart */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ChartLine className="h-5 w-5 text-rupaiya-purple" />
            <CardTitle className="text-lg">Monthly Spending Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip formatter={(value) => formatRupee(value as number)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6E59A5"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Merchants Bar Chart */}
      <Card className="shadow-md md:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-rupaiya-purple" />
            <CardTitle className="text-lg">Top Merchants</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchantTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="merchant" />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip formatter={(value) => formatRupee(value as number)} />
                <Bar dataKey="total" fill="#FF9F6B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingCharts;
