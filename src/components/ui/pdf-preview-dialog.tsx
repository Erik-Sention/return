import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download } from 'lucide-react';

interface PDFPreviewDialogProps {
  title: string;
  exportFunction: () => void;
  exportLabel?: string;
  previewComponent?: React.ReactNode;
  hasPreview?: boolean;
}

export function PDFPreviewDialog({ 
  title, 
  exportFunction, 
  exportLabel = "Exportera som PDF", 
  previewComponent,
  hasPreview = false
}: PDFPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleExport = () => {
    exportFunction();
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {exportLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {hasPreview && previewComponent ? (
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg max-h-[500px] overflow-y-auto">
              {previewComponent}
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center">
              <FileText className="h-10 w-10 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold">PDF-rapport</h3>
              <p className="text-muted-foreground mt-2">
                Rapporten kommer att innehålla alla beräkningar och resultat i ett professionellt format.
              </p>
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">
              Rapporten kommer att genereras med företagsnamn och datum, samt inkludera alla beräknade värden i ett lättläst format.
            </p>
            {!hasPreview && (
              <p className="text-sm text-muted-foreground">
                Du kommer att kunna spara filen på din dator efter att rapporten har genererats.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Generera och ladda ner PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 