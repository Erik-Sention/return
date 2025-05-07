import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info, Target, FileText, Users, Lightbulb, ListChecks, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

interface FormBData {
  organizationName: string;
  contactPerson: string;
  purpose: string;
  goals: string;
  targetGroup: string;
  implementationPlan: string[];
  interventions: string[];
  recommendation: string;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormBRef {
  handleSave: () => Promise<void>;
}

// Lägg till InfoLabel-komponenten för att ge användaren information
const InfoLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Info className="w-3 h-3" />
    <span>{text}</span>
  </div>
);

// Lägg till SectionHeader för tydligare struktur
const SectionHeader = ({ 
  title, 
  icon,
  subtitle
}: { 
  title: string; 
  icon: React.ReactNode;
  subtitle: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="bg-primary/10 p-2 rounded-full">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

// Lägg till nya CSS-klasser i komponentens början
const FormCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-slate-900 p-5 rounded-lg border border-border shadow-sm ${className || ''}`}>
    {children}
  </div>
);

// Definiera en typ för komponentens props
type FormBProps = React.ComponentProps<'div'> & {
  projectId?: string | null;
};

const FORM_TYPE = 'B';

// Formulärinformationskomponent
const FormInfo = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
    <h3 className="text-lg font-semibold mb-2">Formulär 4 – Planering av insatser</h3>
    <p className="text-sm text-slate-700 dark:text-slate-300">
      I detta formulär planerar du insatserna som ska genomföras baserat på den information 
      som samlats in i tidigare formulär. Här definieras insatsens mål, målgrupp och genomförandeplan.
    </p>
  </div>
);

// Gör FormB till en forwardRef component
const FormB = forwardRef<FormBRef, FormBProps>(function FormB(props, ref) {
  const { currentUser } = useAuth();
  const { projectId } = props;
  const [fallbackStep, setFallbackStep] = useState('');
  const [formData, setFormData] = useState<FormBData>({
    organizationName: '',
    contactPerson: '',
    purpose: '',
    goals: '',
    targetGroup: '',
    implementationPlan: [''],
    interventions: [''],
    recommendation: ''
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  const [orgData, setOrgData] = useState<{ 
    organizationName: string; 
    contactPerson: string; 
    startDate: string;
    endDate: string;
  } | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormBData>(currentUser.uid, FORM_TYPE, projectId);
          if (data) {
            console.log('Loaded form data:', data);
            // Ensure implementationPlan and interventions are always arrays
            if (!data.implementationPlan || !Array.isArray(data.implementationPlan) || data.implementationPlan.length === 0) {
              data.implementationPlan = [''];
            }
            
            // Säkerställ att interventions alltid är en array
            if (!data.interventions || !Array.isArray(data.interventions)) {
              data.interventions = [''];
            }
            
            // Säkerställ att recommendation alltid är en sträng
            if (data.recommendation === undefined || data.recommendation === null) {
              data.recommendation = '';
            }
            
            setFormData(data);
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
          setError('Kunde inte ladda data från databasen.');
        } finally {
          setIsDataLoading(false);
        }
      } else {
        console.log('No user logged in, cannot load data from Firebase');
        setIsDataLoading(false);
      }
    };

    loadFromFirebase();
  }, [currentUser, projectId]);
  
  // Kombinera alla laddningsstatus för att avgöra om innehållet är redo att visas
  useEffect(() => {
    if (!isDataLoading && !isOrgInfoLoading) {
      setIsContentReady(true);
    }
  }, [isDataLoading, isOrgInfoLoading]);
  
  // Callback för när organisationsdata har laddats
  const handleOrgDataLoaded = useCallback((data: { 
    organizationName: string; 
    contactPerson: string; 
    startDate: string;
    endDate: string;
  } | null) => {
    setOrgData(data);
  }, []);

  // Setup autosave whenever formData changes
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Only autosave if user is logged in and form has been interacted with
    if (currentUser?.uid) {
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        formData,
        setIsSaving,
        setSaveMessage,
        projectId
      );
    }

    // Cleanup timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, currentUser, projectId]);

  // Exponera handleSave till föräldrakomponenten via ref
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      await handleSave();
    }
  }));

  const handleSave = async () => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att spara data');
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setError(null);
      
      // Förbereda data för att undvika Firebase-fel med undefined-värden
      const dataToSave = prepareDataForSave(formData);
      console.log('Saving form data to Firebase:', dataToSave);
      
      // Save only to Firebase
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave, projectId);
      
      setSaveMessage('Formuläret har sparats!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Ett fel uppstod när formuläret skulle sparas till databasen.');
      throw error; // Kasta vidare felet så att föräldrakomponenten kan fånga det
    } finally {
      setIsSaving(false);
    }
  };

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormBData): FormBData => {
    const preparedData = { ...data };
    
    // Ersätt undefined med null för alla fält
    Object.keys(preparedData).forEach(key => {
      const typedKey = key as keyof FormBData;
      if (typeof preparedData[typedKey] === 'undefined') {
        (preparedData as Record<keyof FormBData, string | string[] | null>)[typedKey] = null;
      }
    });
    
    // Säkerställ att implementationPlan och interventions alltid är arrays
    if (!preparedData.implementationPlan || !Array.isArray(preparedData.implementationPlan)) {
      preparedData.implementationPlan = [''];
    }
    
    if (!preparedData.interventions || !Array.isArray(preparedData.interventions)) {
      preparedData.interventions = [''];
    }
    
    return preparedData;
  };

  const handleChange = (field: keyof FormBData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Dold OrganizationHeader för att ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={setIsOrgInfoLoading} 
          onDataLoaded={handleOrgDataLoaded}
          projectId={projectId}
        />
      </div>
      
      <FadeIn show={isContentReady} duration={500}>
        <div className="space-y-4">
          {/* Lägg till formulärinformation */}
          <FormInfo />
          
          {/* Visa organizationInfo direkt istället för att förlita sig på OrganizationHeader-komponentens rendering */}
          {orgData && (orgData.organizationName || orgData.contactPerson || orgData.startDate || orgData.endDate) && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-md mb-4">
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="mb-2 sm:mb-0">
                  <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
                  <span className="ml-2 font-semibold">{orgData.organizationName || "Ej angiven"}</span>
                </div>
                
                <div className="mb-2 sm:mb-0">
                  <span className="text-sm font-medium text-muted-foreground">Tidsperiod:</span>
                  <span className="ml-2 font-semibold">
                    {orgData.startDate && orgData.endDate 
                      ? `${orgData.startDate} - ${orgData.endDate}`
                      : "Ej angiven"}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Kontaktperson:</span>
                  <span className="ml-2 font-semibold">{orgData.contactPerson || "Ej angiven"}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">4 – Planering av insatser</h2>
            </div>
            <div className="flex items-center gap-2">
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('fel') ? 'text-red-500' : 'text-green-500'}`}>
                  {saveMessage}
                </span>
              )}
              
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm mb-4">
              {error}
            </div>
          )}
          
          {/* Implementera tvåkolumnslayout liknande FormD.tsx */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vänsterkolumn */}
            <div className="space-y-6">
              {/* Steg 4 - Val av lämpliga insatser (från FormA) - flyttad först */}
              <FormCard>
                <SectionHeader 
                  title="Steg 1 – Val av lämpliga insatser" 
                  icon={<ClipboardList className="h-5 w-5 text-primary" />}
                  subtitle="Lista specifika insatser som ska genomföras"
                />
                
                {(formData.interventions || []).map((intervention, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <Input
                      value={intervention}
                      onChange={(e) => {
                        const newInterventions = [...(formData.interventions || [])];
                        newInterventions[index] = e.target.value;
                        handleChange('interventions', newInterventions);
                      }}
                      placeholder={`Insats ${index + 1}`}
                      className="bg-background/50"
                    />
                    {index === (formData.interventions || []).length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newInterventions = [...(formData.interventions || []), ''];
                          handleChange('interventions', newInterventions);
                        }}
                      >
                        +
                      </Button>
                    )}
                  </div>
                ))}
              </FormCard>

              {/* B5 - Syfte */}
              <FormCard>
                <SectionHeader 
                  title="Steg 2 – Syfte med insatserna" 
                  icon={<Lightbulb className="h-5 w-5 text-primary" />}
                  subtitle="Förklara varför insatsen är viktig för organisationen"
                />
                
                <div className="space-y-2">
                  <InfoLabel text="Beskriv vad insatsen skall leda till för organisationen, verksamheten och/eller personalen" />
                  <textarea
                    className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    placeholder="Beskriv syftet..."
                    style={{ userSelect: 'text' }}
                  />
                </div>
              </FormCard>

              {/* Steg 3 - Målformulering och Behovsanalys (från FormA) */}
              <FormCard>
                <SectionHeader 
                  title="Steg 3 – Målformulering och Behovsanalys" 
                  icon={<Target className="h-5 w-5 text-primary" />}
                  subtitle="Sätt tydliga mål baserade på identifierade behov"
                />
                
                <div className="space-y-2">
                  <InfoLabel text="Formulera tydliga mål baserade på identifierade behov" />
                  <textarea
                    className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                    value={formData.goals}
                    onChange={(e) => handleChange('goals', e.target.value)}
                    placeholder="Beskriv mål och behov..."
                    style={{ userSelect: 'text' }}
                  />
                </div>
              </FormCard>
            </div>

            {/* Högerkolumn */}
            <div className="space-y-6">
              {/* B9 - Målgrupp */}
              <FormCard>
                <SectionHeader 
                  title="Steg 4 – Målgrupp" 
                  icon={<Users className="h-5 w-5 text-primary" />}
                  subtitle="Definiera vilka som ska nås av insatsen"
                />
                
                <div className="space-y-2">
                  <InfoLabel text="Beskriv vilka som skall nås av insatsen samt på vilket sätt de nås" />
                  <textarea
                    className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                    value={formData.targetGroup}
                    onChange={(e) => handleChange('targetGroup', e.target.value)}
                    placeholder="Beskriv målgruppen..."
                    style={{ userSelect: 'text' }}
                  />
                </div>
              </FormCard>

              {/* Steg 6 - Rekommendation för beslut (från FormA) */}
              <FormCard>
                <SectionHeader 
                  title="Steg 5 – Rekommendation för beslut" 
                  icon={<ClipboardList className="h-5 w-5 text-primary" />}
                  subtitle="Ge en slutlig rekommendation baserad på analys"
                />
                
                <div className="space-y-2">
                  <InfoLabel text="Ange rekommendation för beslutsfattande" />
                  <textarea
                    className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                    value={formData.recommendation}
                    onChange={(e) => handleChange('recommendation', e.target.value)}
                    placeholder="Ange rekommendation..."
                    style={{ userSelect: 'text' }}
                  />
                </div>
              </FormCard>
              
              {/* B11 - Genomförandeplan (flyttad till högerkolumnen) */}
              <FormCard>
                <SectionHeader 
                  title="Steg 6 – Genomförandeplan" 
                  icon={<ListChecks className="h-5 w-5 text-primary" />}
                  subtitle="Specificera hur insatsen ska implementeras"
                />
                
                <div className="space-y-2">
                  <InfoLabel text="Beskriv hur insatsen skall genomföras; aktiviteter, tidplan, ansvar" />
                  {(formData.implementationPlan || []).length > 0 ? (
                    (formData.implementationPlan || []).map((step, index) => (
                      <div key={index} className="flex gap-2 mb-3">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const newPlan = [...(formData.implementationPlan || [])];
                            newPlan[index] = e.target.value;
                            handleChange('implementationPlan', newPlan);
                          }}
                          placeholder={`Steg ${index + 1}`}
                          className="bg-background/50"
                        />
                        {index === (formData.implementationPlan || []).length - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleChange('implementationPlan', [...(formData.implementationPlan || []), ''])}
                          >
                            +
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={fallbackStep}
                        onChange={(e) => {
                          setFallbackStep(e.target.value);
                          handleChange('implementationPlan', [e.target.value]);
                        }}
                        placeholder="Steg 1"
                        className="bg-background/50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setFallbackStep('');
                          handleChange('implementationPlan', ['']);
                        }}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>
              </FormCard>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <div></div> {/* Tom div för att behålla layoututrymmet */}
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

export default FormB; 