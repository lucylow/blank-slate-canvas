import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { generateCOTAReportPDF } from '@/utils/pdfGenerator';

export const COTAPDFReportGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generateCOTAReportPDF();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 w-5 h-5 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
          Download Circuit of the Americas Report PDF
        </>
      )}
    </Button>
  );
};

export default COTAPDFReportGenerator;
