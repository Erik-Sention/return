"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import FormA, { FormARef } from '@/components/forms/FormA';
import FormB, { FormBRef } from '@/components/forms/FormB';
import FormC, { FormCRef } from '@/components/forms/FormC';
import FormD, { FormDRef } from '@/components/forms/FormD';
import FormG, { FormGRef } from '@/components/forms/FormG';
import FormH, { FormHRef } from '@/components/forms/FormH';
import FormI, { FormIRef } from '@/components/forms/FormI';
import FormJ, { FormJRef } from '@/components/forms/FormJ';
import FormTimeline from '@/components/forms/FormTimeline';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProject } from '@/lib/project/projectApi';
import { useToast } from '@/components/ui/use-toast';

export default function ROIPage() {
  const [currentForm, setCurrentForm] = useState('D');
  const [completedForms, setCompletedForms] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Projektrelaterad state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  
  // Refs till formulären med korrekta typer
  const formARef = useRef<FormARef>(null);
  const formBRef = useRef<FormBRef>(null);
  const formCRef = useRef<FormCRef>(null);
  const formDRef = useRef<FormDRef>(null);
  const formGRef = useRef<FormGRef>(null);
  const formHRef = useRef<FormHRef>(null);
  const formIRef = useRef<FormIRef>(null);
  const formJRef = useRef<FormJRef>(null);

  // Hämta projektId från URL-parametern och projektet från Firebase
  useEffect(() => {
    const projectIdFromUrl = searchParams?.get('projectId');
    if (projectIdFromUrl) {
      setProjectId(projectIdFromUrl);
      
      // Hämta projektinformation om användaren är inloggad
      if (currentUser) {
        const fetchProject = async () => {
          try {
            const project = await getProject(currentUser.uid, projectIdFromUrl);
            if (project) {
              setProjectName(project.name);
            } else {
              toast({
                title: "Projektet hittades inte",
                description: "Kunde inte hitta det angivna projektet.",
                variant: "destructive"
              });
              router.push('/roi-projects');
            }
          } catch (error) {
            console.error('Fel vid hämtning av projekt:', error);
            toast({
              title: "Ett fel uppstod",
              description: "Kunde inte hämta projektinformation.",
              variant: "destructive"
            });
          }
        };
        
        fetchProject();
      }
    }
  }, [currentUser, searchParams, router, toast]);

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
      } else if (currentForm === 'G' && formGRef.current) {
        await formGRef.current.handleSave();
        setSaveMessage('Formulär G har sparats!');
      } else if (currentForm === 'H' && formHRef.current) {
        await formHRef.current.handleSave();
        setSaveMessage('Formulär H har sparats!');
      } else if (currentForm === 'I' && formIRef.current) {
        await formIRef.current.handleSave();
        setSaveMessage('Formulär I har sparats!');
      } else if (currentForm === 'J' && formJRef.current) {
        await formJRef.current.handleSave();
        setSaveMessage('Formulär J har sparats!');
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
          <Link href={projectId ? "/roi-projects" : "/"}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {projectId ? "Tillbaka till projekt" : "Tillbaka till start"}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">ROI-kalkylator</h1>
          {projectId && projectName && (
            <div className="bg-primary/10 py-1 px-3 rounded-full text-sm font-medium">
              Projekt: {projectName}
            </div>
          )}
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
          {currentForm === 'A' && <FormA 
            ref={formARef} 
            onNavigateToForm={(formName) => {
              // Navigera till det specifika formuläret
              setCurrentForm(formName);
            }}
            projectId={projectId}
          />}
          {currentForm === 'B' && <FormB 
            ref={formBRef}
            projectId={projectId}
          />}
          {currentForm === 'C' && <FormC 
            ref={formCRef} 
            onNavigateToForm={(formName) => {
              // Navigera till det specifika formuläret
              setCurrentForm(formName);
            }}
            projectId={projectId}
          />}
          {currentForm === 'D' && <FormD 
            ref={formDRef}
            onNavigateToForm={(formName: string) => {
              // Navigera till det specifika formuläret
              setCurrentForm(formName);
            }}
            projectId={projectId}
          />}
          {currentForm === 'G' && <FormG 
            ref={formGRef}
            projectId={projectId}
          />}
          {currentForm === 'H' && <FormH 
            ref={formHRef}
            projectId={projectId}
          />}
          {currentForm === 'I' && <FormI 
            ref={formIRef}
            projectId={projectId}
          />}
          {currentForm === 'J' && <FormJ 
            ref={formJRef} 
            onNavigateToForm={(formName) => {
              // Navigera till det specifika formuläret
              setCurrentForm(formName);
            }}
            projectId={projectId}
          />}
        </div>

        <div className="flex justify-between">
          {currentForm !== 'D' && (
            <Button 
              onClick={() => {
                const forms = 'DCABGHIJ'.split('');
                const currentIndex = forms.indexOf(currentForm);
                setCurrentForm(forms[currentIndex - 1]);
              }}
            >
              Föregående
            </Button>
          )}
          
          <div className="flex-1 flex justify-center items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Formulär {(() => {
                // Mappa formulärbokstäver till siffror
                const formMap: Record<string, string> = {
                  'D': '1',
                  'C': '2',
                  'A': '3',
                  'B': '4',
                  'G': '5',
                  'H': '6',
                  'I': '7',
                  'J': '8'
                };
                return formMap[currentForm] || currentForm;
              })()}
            </span>
          </div>
          
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
                  const forms = 'DCABGHIJ'.split('');
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