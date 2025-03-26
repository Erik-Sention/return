"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import FormA, { FormARef } from '@/components/forms/FormA';
import FormB, { FormBRef } from '@/components/forms/FormB';
import FormC, { FormCRef } from '@/components/forms/FormC';
import FormD, { FormDRef } from '@/components/forms/FormD';
import FormE, { FormERef } from '@/components/forms/FormE';
import FormF, { FormFRef } from '@/components/forms/FormF';
import FormG, { FormGRef } from '@/components/forms/FormG';
import FormTimeline from '@/components/forms/FormTimeline';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ROIPage() {
  const [currentForm, setCurrentForm] = useState('A');
  const [completedForms, setCompletedForms] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  // Refs till formulären med korrekta typer
  const formARef = useRef<FormARef>(null);
  const formBRef = useRef<FormBRef>(null);
  const formCRef = useRef<FormCRef>(null);
  const formDRef = useRef<FormDRef>(null);
  const formERef = useRef<FormERef>(null);
  const formFRef = useRef<FormFRef>(null);
  const formGRef = useRef<FormGRef>(null);

  useEffect(() => {
    setMounted(true);
    
    // Om användaren inte är inloggad och laddningen är klar, redirecta till login
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  const handleFormChange = (form: string) => {
    setCurrentForm(form);
    if (!completedForms.includes(currentForm)) {
      setCompletedForms([...completedForms, currentForm]);
    }
  };
  
  // Funktion för att spara aktuellt formulär via ref
  const handleSaveCurrentForm = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      if (currentForm === 'A' && formARef.current) {
        await formARef.current.handleSave();
        setSaveMessage('Formulär A har sparats!');
      } else if (currentForm === 'B' && formBRef.current) {
        await formBRef.current.handleSave();
        setSaveMessage('Formulär B har sparats!');
      } else if (currentForm === 'C' && formCRef.current) {
        await formCRef.current.handleSave();
        setSaveMessage('Formulär C har sparats!');
      } else if (currentForm === 'D' && formDRef.current) {
        await formDRef.current.handleSave();
        setSaveMessage('Formulär D har sparats!');
      } else if (currentForm === 'E' && formERef.current) {
        await formERef.current.handleSave();
        setSaveMessage('Formulär E har sparats!');
      } else if (currentForm === 'F' && formFRef.current) {
        await formFRef.current.handleSave();
        setSaveMessage('Formulär F har sparats!');
      } else if (currentForm === 'G' && formGRef.current) {
        await formGRef.current.handleSave();
        setSaveMessage('Formulär G har sparats!');
      }
      
      // Lägg till formuläret i completedForms om det inte redan finns där
      if (!completedForms.includes(currentForm)) {
        setCompletedForms(prev => [...prev, currentForm]);
      }
      
      // Dölj bekräftelsemeddelandet efter 3 sekunder
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveMessage('Ett fel uppstod när formuläret skulle sparas.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Laddar ROI-kalkylator...</div>
      </div>
    );
  }

  // Om användaren inte är inloggad, visa ingenting (vi redirectar ändå)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till start
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">ROI-kalkylator</h1>
        </div>
        
        {saveMessage && (
          <span className={`text-sm ${saveMessage.includes('fel') ? 'text-red-500' : 'text-green-500'}`}>
            {saveMessage}
          </span>
        )}
      </div>

      <div className="space-y-6">
        <FormTimeline 
          currentForm={currentForm}
          completedForms={completedForms}
          onFormChange={handleFormChange}
        />

        <div className="form-card">
          {currentForm === 'A' && <FormA ref={formARef} />}
          {currentForm === 'B' && <FormB ref={formBRef} />}
          {currentForm === 'C' && <FormC ref={formCRef} />}
          {currentForm === 'D' && <FormD ref={formDRef} />}
          {currentForm === 'E' && <FormE ref={formERef} />}
          {currentForm === 'F' && <FormF ref={formFRef} />}
          {currentForm === 'G' && <FormG ref={formGRef} />}
        </div>

        <div className="flex justify-between">
          {currentForm !== 'A' && (
            <Button 
              onClick={() => {
                const forms = 'ABCDEFGHIJ'.split('');
                const currentIndex = forms.indexOf(currentForm);
                setCurrentForm(forms[currentIndex - 1]);
              }}
            >
              Föregående
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={handleSaveCurrentForm}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Sparar...' : 'Spara formulär'}
            </Button>
            
            {currentForm !== 'J' && (
              <Button 
                onClick={() => {
                  const forms = 'ABCDEFGHIJ'.split('');
                  const currentIndex = forms.indexOf(currentForm);
                  setCurrentForm(forms[currentIndex + 1]);
                }}
              >
                Nästa
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 