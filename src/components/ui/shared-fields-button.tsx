import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { loadSharedFields, SharedFields } from '@/lib/firebase/sharedFields';

interface SharedFieldsButtonProps {
  userId: string | undefined;
  onFieldsLoaded: (fields: SharedFields) => void;
  disabled?: boolean;
}

export const SharedFieldsButton = ({
  userId,
  onFieldsLoaded,
  disabled = false
}: SharedFieldsButtonProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSharedFields = async () => {
    if (!userId) {
      setMessage('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      
      const fields = await loadSharedFields(userId);
      
      if (fields) {
        onFieldsLoaded(fields);
        
        if (fields.organizationName || fields.contactPerson) {
          if (fields.startDate || fields.endDate) {
            setMessage('Namn och tidsperiod hämtade från Formulär A/D!');
          } else {
            setMessage('Organisation och kontaktperson hämtade från Formulär A!');
          }
        } else if (fields.startDate || fields.endDate) {
          setMessage('Tidsperiod hämtad från Formulär D!');
        } else {
          setMessage('Vissa uppgifter hämtades!');
        }
        
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('Inga uppgifter hittades. Fyll i Formulär A och D först.');
      }
    } catch (error) {
      console.error('Error fetching shared fields:', error);
      setMessage('Ett fel uppstod när uppgifterna skulle hämtas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={fetchSharedFields}
        disabled={disabled || isLoading}
      >
        <ArrowDown className="h-4 w-4 mr-2" />
        {isLoading ? 'Hämtar...' : 'Hämta grundinformation'}
      </Button>
      {message && (
        <span className={`text-sm ${message.includes('fel') || message.includes('inga') ? 'text-amber-500' : 'text-green-500'}`}>
          {message}
        </span>
      )}
    </div>
  );
}; 