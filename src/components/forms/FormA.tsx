import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, ClipboardList, Building, LineChart, BrainCircuit, Target, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { updateSharedFieldsFromCurrentForm } from '@/lib/firebase/sharedFields';

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

// Definiera en typ för komponentens props
type FormAProps = React.ComponentProps<'div'>;

// Lägg till en ny komponent för att hämta värde från FormC
const FetchFormCValueButton = ({ 
  onClick, 
  disabled,
  message 
}: { 
  onClick: () => void;
  disabled?: boolean;
  message?: string | null;
}) => (
  <div className="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="mt-1"
    >
      <ArrowDown className="h-4 w-4 mr-2" />
      Hämta från Formulär C
    </Button>
    {message && (
      <span className={`text-sm ${message.includes('Inget') ? 'text-amber-500' : 'text-green-500'} mt-1`}>
        {message}
      </span>
    )}
  </div>
);

// Gör FormA till en forwardRef component
const FormA = forwardRef<FormARef, FormAProps>(function FormA(props, ref) {
  const { currentUser } = useAuth();
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
  const [fetchMessageC7, setFetchMessageC7] = useState<string | null>(null);
  const [fetchMessageC10, setFetchMessageC10] = useState<string | null>(null);
  const [fetchMessageC17, setFetchMessageC17] = useState<string | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setError(null);
          const data = await loadFormData<FormAData>(currentUser.uid, FORM_TYPE);
          if (data) {
            console.log('Loaded form data:', data);
            setFormData(data);
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
          setError('Kunde inte ladda data från databasen.');
        }
      } else {
        console.log('No user logged in, cannot load data from Firebase');
      }
    };

    loadFromFirebase();
  }, [currentUser]);

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
        setSaveMessage
      );
    }

    // Cleanup timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, currentUser]);

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
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave);
      
      // Uppdatera även gemensamma fält - skicka endast nödvändiga fält
      await updateSharedFieldsFromCurrentForm(currentUser.uid, {
        organizationName: dataToSave.organizationName,
        contactPerson: dataToSave.contactPerson,
        timePeriod: '' // FormA har ingen timePeriod
      });
      
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

  const handleChange = (field: keyof FormAData, value: string | number | string[] | undefined) => {
    if (typeof value === 'number' || value === undefined) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (Array.isArray(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (typeof formData[field] === 'number') {
      if (value === '') {
        setFormData(prev => ({ ...prev, [field]: undefined }));
      } else {
        const normalizedValue = value.replace(',', '.');
        const numValue = parseFloat(normalizedValue);
        setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? undefined : numValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Lägg till useEffect för att rensa fetchMessages efter viss tid
  useEffect(() => {
    if (fetchMessageC7) {
      const timer = setTimeout(() => {
        setFetchMessageC7(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageC7]);

  useEffect(() => {
    if (fetchMessageC10) {
      const timer = setTimeout(() => {
        setFetchMessageC10(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageC10]);

  useEffect(() => {
    if (fetchMessageC17) {
      const timer = setTimeout(() => {
        setFetchMessageC17(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageC17]);

  // Hjälpfunktion för att hämta värden från Form C
  const fetchValueFromFormC = async (field: 'C7' | 'C10' | 'C17') => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setError(null);
      
      const formCData = await loadFormData<FormCData>(currentUser.uid, 'C');
      if (formCData) {
        if (field === 'C7' && formCData.percentHighStress !== undefined) {
          handleChange('stressLevel', formCData.percentHighStress);
          setFetchMessageC7(`Värde hämtat från Formulär C!`);
        } else if (field === 'C10' && formCData.valueProductionLoss !== undefined) {
          handleChange('productionLoss', formCData.valueProductionLoss);
          setFetchMessageC10(`Värde hämtat från Formulär C!`);
        } else if (field === 'C17' && formCData.totalCostSickLeaveMentalHealth !== undefined) {
          handleChange('sickLeaveCost', formCData.totalCostSickLeaveMentalHealth);
          setFetchMessageC17(`Värde hämtat från Formulär C!`);
        } else {
          if (field === 'C7') setFetchMessageC7(`Inget värde hittades i Formulär C.`);
          if (field === 'C10') setFetchMessageC10(`Inget värde hittades i Formulär C.`);
          if (field === 'C17') setFetchMessageC17(`Inget värde hittades i Formulär C.`);
        }
      } else {
        if (field === 'C7') setFetchMessageC7(`Inget värde hittades i Formulär C.`);
        if (field === 'C10') setFetchMessageC10(`Inget värde hittades i Formulär C.`);
        if (field === 'C17') setFetchMessageC17(`Inget värde hittades i Formulär C.`);
      }
    } catch (error) {
      console.error(`Error fetching value from FormC:`, error);
      setError(`Kunde inte hämta värdet från Formulär C`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">A – Verksamhetsanalys</h2>
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
        
        {/* A1 & A2 */}
        <div className="form-card">
          <SectionHeader 
            title="Organisationsinformation" 
            icon={<Building className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">A1: Organisationens namn</label>
              <InfoLabel text="Namnet på din organisation" />
              <Input
                value={formData.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                placeholder="Ange organisationens namn"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">A2: Kontaktperson</label>
              <InfoLabel text="Namn på kontaktperson" />
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Ange kontaktperson"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>

        {/* A3 */}
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
                <FormattedNumberInput
                  value={formData.stressLevel}
                  onChange={(value) => handleChange('stressLevel', value)}
                  placeholder="Ange procent"
                  className="bg-background/50"
                />
                <FetchFormCValueButton
                  onClick={async () => {
                    await fetchValueFromFormC('C7');
                  }}
                  disabled={!currentUser?.uid}
                  message={fetchMessageC7}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Värde av produktionsbortfall (kr/år)</label>
                <FormattedNumberInput
                  value={formData.productionLoss}
                  onChange={(value) => handleChange('productionLoss', value)}
                  placeholder="Ange summa i kr"
                  className="bg-background/50"
                />
                <FetchFormCValueButton
                  onClick={async () => {
                    await fetchValueFromFormC('C10');
                  }}
                  disabled={!currentUser?.uid}
                  message={fetchMessageC10}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kostnad för sjukfrånvaro (kr/år)</label>
                <FormattedNumberInput
                  value={formData.sickLeaveCost}
                  onChange={(value) => handleChange('sickLeaveCost', value)}
                  placeholder="Ange summa i kr"
                  className="bg-background/50"
                />
                <FetchFormCValueButton
                  onClick={async () => {
                    await fetchValueFromFormC('C17');
                  }}
                  disabled={!currentUser?.uid}
                  message={fetchMessageC17}
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
    </div>
  );
});

export default FormA; 