import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Settings } from 'lucide-react';

interface CompanyFormProps {
  companyName: string;
  onCompanyNameChange: (name: string) => void;
}

export function CompanyForm({ companyName, onCompanyNameChange }: CompanyFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  
  const handleSave = () => {
    onCompanyNameChange(localCompanyName);
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Ändra företagsinformation</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Företagsinformation för rapport
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Företagsnamn</Label>
            <Input
              id="companyName"
              value={localCompanyName}
              onChange={(e) => setLocalCompanyName(e.target.value)}
              placeholder="Ange företagets namn"
            />
            <p className="text-sm text-muted-foreground">
              Detta namn kommer att användas i PDF-rapporter och utskrifter.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Spara</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 