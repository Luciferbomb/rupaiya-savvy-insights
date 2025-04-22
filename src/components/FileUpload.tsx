
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, FileUp, IndianRupee, AlertCircle } from "lucide-react";
import { processPdfStatement, isPdfFile } from '@/utils/pdfUtils';
import { Transaction } from '@/types';

interface FileUploadProps {
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  onUseMockData: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onTransactionsLoaded, onUseMockData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!isPdfFile(file)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setProcessingError(null);

    try {
      console.log(`Starting to process file: ${file.name}`);
      const transactions = await processPdfStatement(file);
      
      if (transactions.length === 0) {
        setProcessingError("No transactions could be extracted from this statement. Please try a different statement or use sample data.");
        toast({
          title: "No transactions found",
          description: "The parser couldn't extract any transactions from your statement.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "File processed successfully",
          description: `Extracted ${transactions.length} transactions from ${file.name}`,
        });
        onTransactionsLoaded(transactions);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setProcessingError((error as Error).message || "Unknown processing error");
      toast({
        title: "Error processing file",
        description: "There was an error processing your bank statement",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white shadow-md">
      <CardContent className="pt-6">
        <div 
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-rupaiya-purple bg-rupaiya-light' : 'border-gray-300 hover:border-rupaiya-purple'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input 
            type="file" 
            id="fileInput" 
            className="hidden" 
            accept=".pdf" 
            onChange={handleFileInputChange}
          />
          
          {isProcessing ? (
            <div className="space-y-3">
              <p className="text-lg font-medium">Processing {fileName}...</p>
              <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-rupaiya-purple animate-pulse rounded-full"></div>
              </div>
            </div>
          ) : processingError ? (
            <div className="space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
              <h3 className="text-lg font-semibold text-red-600">Processing Error</h3>
              <p className="text-gray-600 mb-4">{processingError}</p>
              <p className="text-sm text-gray-500">Try uploading again or use sample data below</p>
            </div>
          ) : (
            <>
              <FileUp className="mx-auto h-12 w-12 text-rupaiya-purple mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Bank Statement</h3>
              <p className="text-gray-500 mb-4">Drag and drop your PDF bank statement here or click to browse</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <Download size={16} />
                <span>Only PDF files are supported</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 mb-3">Don't have a statement handy?</p>
          <Button 
            variant="outline" 
            onClick={onUseMockData}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <IndianRupee size={16} />
            <span>Use Sample Data</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
