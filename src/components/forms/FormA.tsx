import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Info, ClipboardList, Building, LineChart, BrainCircuit, Target, ArrowRight, Calculator, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { updateSharedFieldsFromCurrentForm } from '@/lib/firebase/sharedFields';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

interface FormAData {
  organizationName: string;
  contactPerson: string;
  businessDefinition: string;
  currentSituation: string;
  stressLevel: number | undefined;
  productionLoss: number | undefined;
  sickLeaveCost: number | undefined;
  causeAnalysis: string;
  goals: string;
  interventions: string[];
  recommendation: string;
}

// Interface för FormC-data som behövs för att hämta värden
interface FormCData {
  percentHighStress?: number;
  valueProductionLoss?: number;
  totalCostSickLeaveMentalHealth?: number;
  productionLossHighStress?: number;
  // Nya fält för att kontrollera om sjukfrånvarokostnaden är komplett
  costShortSickLeave?: number;                   // C11
  percentShortSickLeaveMentalHealth?: number;    // C12
  costLongSickLeave?: number;                    // C14
  percentLongSickLeaveMentalHealth?: number;     // C15
  [key: string]: string | number | undefined | null; // Mer specifik typ istället för 'any'
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormARef {
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
  icon 
}: { 
  title: string; 
  icon: React.ReactNode 
}) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="bg-primary/10 p-2 rounded-full">
      {icon}
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
  </div>
);

const FORM_TYPE = 'A';

// Utöka FormAProps för att inkludera en onNavigateToForm prop
type FormAProps = React.ComponentProps<'div'> & {
  onNavigateToForm?: (formName: string) => void;
  projectId?: string | null;
};

// Lägg till en hjälpfunktion för att översätta formulärbokstäver till siffror
const getFormNumber = (formId: string): string => {
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
  return formMap[formId] || formId;
};

// Lägg till AutoFilledField-komponenten för att visa automatiskt hämtad data
const AutoFilledField = ({ 
  value, 
  sourceFormName,
  onNavigate,
  isEmpty = false
}: { 
  value: string; 
  sourceFormName: string;
  onNavigate: (formName: string) => void;
  isEmpty?: boolean;
}) => (
  <div className="space-y-1">
    <div className="p-2 bg-primary/5 border border-dashed border-primary/40 rounded-md flex justify-between shadow-sm items-center">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calculator className="w-3 h-3" />
        <span>Auto från Formulär {getFormNumber(sourceFormName)}</span>
      </div>
      {isEmpty ? (
        <span className="text-amber-500 font-medium">Saknar värde i formulär {getFormNumber(sourceFormName)}</span>
      ) : (
        <span className="font-semibold">{value}</span>
      )}
    </div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onNavigate(sourceFormName)}
      className="mt-1"
    >
      <ArrowRight className="h-4 w-4 mr-2" />
      Gå till Formulär {getFormNumber(sourceFormName)}
    </Button>
  </div>
);

// Formulärinformationskomponent
const FormInfo = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
    <h3 className="text-lg font-semibold mb-2">Formulär 3 – Info Organisation</h3>
    <p className="text-sm text-slate-700 dark:text-slate-300">
      I detta formulär samlar du ihop information om organisationens nuläge gällande psykisk hälsa
      och definierar verksamhetens behov. Formuläret lägger grunden för att kunna planera lämpliga insatser.
    </p>
  </div>
);

// Gör FormA till en forwardRef component
const FormA = forwardRef<FormARef, FormAProps>(function FormA(props, ref) {
  const { currentUser } = useAuth();
  const { onNavigateToForm, projectId } = props;
  const [formData, setFormData] = useState<FormAData>({
    organizationName: '',
    contactPerson: '',
    businessDefinition: '',
    currentSituation: '',
    stressLevel: undefined,
    productionLoss: undefined,
    sickLeaveCost: undefined,
    causeAnalysis: '',
    goals: '',
    interventions: [''],
    recommendation: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lägg till state för att spåra automatisk datahämtning
  const [autoFetchStatus, setAutoFetchStatus] = useState({
    hasFetched: false,
    stressLevel: false,
    productionLoss: false,
    sickLeaveCost: false,
    errorMessage: null as string | null
  });

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
          const data = await loadFormData<FormAData>(currentUser.uid, FORM_TYPE, projectId);
          if (data) {
            console.log('Loaded form data:', data);
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
      
      // Save to Firebase
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave, projectId);
      
      // Uppdatera även gemensamma fält - skicka endast nödvändiga fält
      await updateSharedFieldsFromCurrentForm(currentUser.uid, {
        organizationName: dataToSave.organizationName,
        contactPerson: dataToSave.contactPerson,
        timePeriod: '' // FormA har ingen timePeriod
      }, projectId);
      
      setSaveMessage('Formuläret har sparats!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Ett fel uppstod när formuläret skulle sparas till databasen.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormAData): FormAData => {
    const preparedData = { ...data };
    
    // Ersätt undefined med null för alla fält
    Object.keys(preparedData).forEach(key => {
      const typedKey = key as keyof FormAData;
      if (typeof preparedData[typedKey] === 'undefined') {
        (preparedData as Record<keyof FormAData, string | number | string[] | null>)[typedKey] = null;
      }
    });
    
    return preparedData;
  };

  // Hantera ändringar i formuläret
  const handleChange = useCallback((field: keyof FormAData, value: string | number | string[] | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Hjälpfunktion för att navigera till specifikt formulär
  const navigateToForm = (formName: string) => {
    if (onNavigateToForm) {
      onNavigateToForm(formName);
    } else {
      console.warn('Navigation callback is not provided to FormA component');
    }
  };
  
  // Ny useEffect för att automatiskt hämta data från Formulär 2 vid inladdning
  useEffect(() => {
    const autoFetchFromFormC = async () => {
      if (autoFetchStatus.hasFetched || !currentUser?.uid) return;
      
      try {
        // Spara aktuell status för autoFetch
        const currentStatus = { ...autoFetchStatus, hasFetched: true };
        setAutoFetchStatus(currentStatus);
        
        const formCData = await loadFormData<FormCData>(currentUser.uid, 'C');
        
        if (formCData) {
          const updatedStatus = { ...currentStatus };
          
          // Hämta stressnivå om tillgänglig
          if (formCData.percentHighStress !== undefined) {
            handleChange('stressLevel', formCData.percentHighStress);
            updatedStatus.stressLevel = true;
          }
          
          // Hämta produktionsbortfall om tillgänglig och produktionsbortfall har ett värde
          if (formCData.valueProductionLoss !== undefined && 
              typeof formCData.productionLossHighStress === 'number' && 
              formCData.productionLossHighStress > 0) {
            handleChange('productionLoss', formCData.valueProductionLoss);
            updatedStatus.productionLoss = true;
          }
          
          // Kontrollera om alla nödvändiga fält för sjukfrånvarokostnad finns
          const hasAllSickLeaveFields = 
            formCData.costShortSickLeave !== undefined && 
            formCData.percentShortSickLeaveMentalHealth !== undefined &&
            formCData.costLongSickLeave !== undefined && 
            formCData.percentLongSickLeaveMentalHealth !== undefined;
          
          // Hämta sjukfrånvarokostnad endast om alla nödvändiga fält finns
          if (formCData.totalCostSickLeaveMentalHealth !== undefined && hasAllSickLeaveFields) {
            handleChange('sickLeaveCost', formCData.totalCostSickLeaveMentalHealth);
            updatedStatus.sickLeaveCost = true;
          }
          
          setAutoFetchStatus(updatedStatus);
        }
      } catch (error) {
        console.error('Fel vid automatisk hämtning från Formulär 2:', error);
        setAutoFetchStatus(prev => ({ 
          ...prev, 
          hasFetched: true, 
          errorMessage: 'Kunde inte automatiskt hämta data från Formulär 2. Gå till Formulär 2 för att fylla i data.' 
        }));
      }
    };
    
    autoFetchFromFormC();
  }, [currentUser, autoFetchStatus, handleChange]);

  // Formatera nummer med tusentalsavgränsare
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('sv-SE');
  };

  return (
    <div className="space-y-6">
      {/* Dold OrganizationHeader för att ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={setIsOrgInfoLoading} 
          onDataLoaded={handleOrgDataLoaded}
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
              <h2 className="text-2xl font-bold">3 – Info Organisation</h2>
            </div>
            <div className="flex items-center gap-2">
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('fel') ? 'text-red-500' : 'text-green-500'}`}>
                  {saveMessage}
                </span>
              )}
              <Button 
                onClick={handleSave} 
                className="gap-2"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Sparar...' : 'Spara formulär'}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm mb-4">
              {error}
            </div>
          )}
          
          {/* Visa meddelande om automatisk hämtning av data */}
          {autoFetchStatus.hasFetched && (autoFetchStatus.stressLevel || autoFetchStatus.productionLoss || autoFetchStatus.sickLeaveCost) && (
            <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
              <p className="font-medium">Data har automatiskt hämtats från Formulär 2:</p>
              <ul className="list-disc list-inside mt-1">
                {autoFetchStatus.stressLevel && <li>Andel personalen med hög stressnivå</li>}
                {autoFetchStatus.productionLoss && <li>Värde av produktionsbortfall</li>}
                {autoFetchStatus.sickLeaveCost && <li>Kostnad för sjukfrånvaro</li>}
              </ul>
            </div>
          )}
          
          {autoFetchStatus.errorMessage && (
            <div className="p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm mb-4">
              {autoFetchStatus.errorMessage}
            </div>
          )}
          
          <div className="form-card">
            <SectionHeader 
              title="Steg 1 – Definition av verksamheten" 
              icon={<Building className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-2">
              <InfoLabel text="Beskriv verksamhetens huvudsakliga uppgifter och mål" />
              <textarea
                className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                value={formData.businessDefinition}
                onChange={(e) => handleChange('businessDefinition', e.target.value)}
                placeholder="Beskriv verksamheten..."
                style={{ userSelect: 'text' }}
              />
            </div>
          </div>

          {/* A4 */}
          <div className="form-card">
            <SectionHeader 
              title="Steg 2 – Nulägesbeskrivning, psykisk hälsa" 
              icon={<BrainCircuit className="h-5 w-5 text-primary" />}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <InfoLabel text="Beskriv nuläget gällande psykisk hälsa i verksamheten" />
                <textarea
                  className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                  value={formData.currentSituation}
                  onChange={(e) => handleChange('currentSituation', e.target.value)}
                  placeholder="Beskriv nuläget..."
                  style={{ userSelect: 'text' }}
                />
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Andel av personalen med hög stressnivå (%)</label>
                  <AutoFilledField
                    value={formatNumber(formData.stressLevel || 0) + " %"}
                    sourceFormName="C"
                    onNavigate={navigateToForm}
                    isEmpty={!autoFetchStatus.stressLevel || !formData.stressLevel}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Värde av produktionsbortfall (kr/år)</label>
                  <AutoFilledField
                    value={formatNumber(formData.productionLoss || 0) + " kr"}
                    sourceFormName="C"
                    onNavigate={navigateToForm}
                    isEmpty={!autoFetchStatus.productionLoss || !formData.productionLoss}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kostnad för sjukfrånvaro (kr/år)</label>
                  <AutoFilledField
                    value={formatNumber(formData.sickLeaveCost || 0) + " kr"}
                    sourceFormName="C"
                    onNavigate={navigateToForm}
                    isEmpty={!autoFetchStatus.sickLeaveCost || !formData.sickLeaveCost}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* A5 */}
          <div className="form-card">
            <SectionHeader 
              title="Steg 3 – Orsaksanalys och riskbedömning" 
              icon={<LineChart className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-2">
              <InfoLabel text="Identifiera orsaker till problem och bedöm risker" />
              <textarea
                className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                value={formData.causeAnalysis}
                onChange={(e) => handleChange('causeAnalysis', e.target.value)}
                placeholder="Beskriv orsaker och risker..."
                style={{ userSelect: 'text' }}
              />
            </div>
          </div>

          {/* A6 */}
          <div className="form-card">
            <SectionHeader 
              title="Steg 4 – Målformulering och Behovsanalys" 
              icon={<Target className="h-5 w-5 text-primary" />}
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
          </div>

          {/* A7 */}
          <div className="form-card">
            <SectionHeader 
              title="Steg 5 – Val av lämpliga insatser" 
              icon={<ClipboardList className="h-5 w-5 text-primary" />}
            />
            
            {formData.interventions.map((intervention, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <Input
                  value={intervention}
                  onChange={(e) => {
                    const newInterventions = [...formData.interventions];
                    newInterventions[index] = e.target.value;
                    handleChange('interventions', newInterventions);
                  }}
                  placeholder={`Insats ${index + 1}`}
                  className="bg-background/50"
                />
                {index === formData.interventions.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleChange('interventions', [...formData.interventions, ''])}
                  >
                    +
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* A9 */}
          <div className="form-card">
            <SectionHeader 
              title="Steg 7 – Rekommendation för beslut" 
              icon={<ClipboardList className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-2">
              <textarea
                className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
                value={formData.recommendation}
                onChange={(e) => handleChange('recommendation', e.target.value)}
                placeholder="Ange rekommendation..."
                style={{ userSelect: 'text' }}
              />
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

export default FormA; 