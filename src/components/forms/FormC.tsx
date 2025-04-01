import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, ArrowRight, Calculator, PieChart, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { SharedFieldsButton } from '@/components/ui/shared-fields-button';
import { updateFormWithSharedFields } from '@/lib/utils/updateFormFields';
import { SharedFields } from '@/lib/firebase/sharedFields';

interface FormCData {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
  totalPersonnelCosts?: number | undefined;
  companyProfit?: number | undefined;
  totalWorkValue: number;
  percentHighStress?: number | undefined;
  productionLossHighStress?: number | undefined;
  totalProductionLoss: number;
  valueProductionLoss: number;
  costShortSickLeave?: number | undefined;
  percentShortSickLeaveMentalHealth?: number | undefined;
  costShortSickLeaveMentalHealth: number;
  costLongSickLeave?: number | undefined;
  percentLongSickLeaveMentalHealth?: number | undefined;
  costLongSickLeaveMentalHealth: number;
  totalCostSickLeaveMentalHealth: number;
  totalCostMentalHealth: number;
}

interface FormDData {
  totalPersonnelCosts?: number;
}

interface FormEData {
  costShortSickLeave?: number;
  totalSickLeaveCosts?: number;
}

interface FormFData {
  costLongSickLeave?: number;
  totalLongSickLeaveCosts?: number;
}

const FORM_TYPE = 'C';

// Lägg till InfoLabel-komponenten för att ge användaren information om automatiska fält
const InfoLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Info className="w-3 h-3" />
    <span>{text}</span>
  </div>
);

// Lägg till ReadOnlyField-komponenten för att visa beräknade fält
const ReadOnlyField = ({ 
  label, 
  value, 
  info, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  info: string;
  highlight?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    <InfoLabel text={info} />
    <div className={`p-2 ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-background'} border rounded-md flex justify-end shadow-sm`}>
      <span className={`font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
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

// Lägg till en ny komponent för att hämta värde från FormD
const FetchValueButton = ({ 
  onClick, 
  disabled,
  formName,
  message 
}: { 
  onClick: () => void;
  disabled?: boolean;
  formName: string;
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
      Hämta från Formulär {formName}
    </Button>
    {message && (
      <span className={`text-sm ${message.includes('Inget') ? 'text-amber-500' : 'text-green-500'} mt-1`}>
        {message}
      </span>
    )}
  </div>
);

// Definiera en typ för vad som ska exponeras via ref
export interface FormCRef {
  handleSave: () => Promise<void>;
}

// Definiera en typ för komponentens props
type FormCProps = React.ComponentProps<'div'>;

// Gör FormC till en forwardRef component
const FormC = forwardRef<FormCRef, FormCProps>(function FormC(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormCData>({
    organizationName: '',
    contactPerson: '',
    timePeriod: '',
    totalPersonnelCosts: undefined,
    companyProfit: undefined,
    totalWorkValue: 0,
    percentHighStress: undefined,
    productionLossHighStress: undefined,
    totalProductionLoss: 0,
    valueProductionLoss: 0,
    costShortSickLeave: undefined,
    percentShortSickLeaveMentalHealth: undefined,
    costShortSickLeaveMentalHealth: 0,
    costLongSickLeave: undefined,
    percentLongSickLeaveMentalHealth: undefined,
    costLongSickLeaveMentalHealth: 0,
    totalCostSickLeaveMentalHealth: 0,
    totalCostMentalHealth: 0
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchMessageFormD, setFetchMessageFormD] = useState<string | null>(null);
  const [fetchMessageFormE, setFetchMessageFormE] = useState<string | null>(null);
  const [fetchMessageFormF, setFetchMessageFormF] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setError(null);
          const data = await loadFormData<FormCData>(currentUser.uid, FORM_TYPE);
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

  // Beräkna automatiska värden när relevanta fält ändras
  useEffect(() => {
    // Konvertera till nummer innan addition för att förhindra strängkonkatenering
    const personnelCosts = Number(formData.totalPersonnelCosts || 0);
    const profit = Number(formData.companyProfit || 0);
    const totalWorkValue = personnelCosts + profit;
    
    // C9 = C7 × C8 (percentage of staff with high stress × production loss at high stress)
    const totalProductionLoss = ((formData.percentHighStress || 0) * (formData.productionLossHighStress || 0)) / 100;
    
    // C10 = C6 × C9 ÷ 100
    const valueProductionLoss = (totalWorkValue * totalProductionLoss) / 100;
  
    const costShortSickLeaveMentalHealth = ((formData.costShortSickLeave || 0) * (formData.percentShortSickLeaveMentalHealth || 0)) / 100;
    const costLongSickLeaveMentalHealth = ((formData.costLongSickLeave || 0) * (formData.percentLongSickLeaveMentalHealth || 0)) / 100;
  
    const totalCostSickLeaveMentalHealth = costShortSickLeaveMentalHealth + costLongSickLeaveMentalHealth;
    const totalCostMentalHealth = valueProductionLoss + totalCostSickLeaveMentalHealth;
  
    setFormData(prev => ({
      ...prev,
      totalWorkValue,
      totalProductionLoss,
      valueProductionLoss,
      costShortSickLeaveMentalHealth,
      costLongSickLeaveMentalHealth,
      totalCostSickLeaveMentalHealth,
      totalCostMentalHealth
    }));
  }, [
    formData.totalPersonnelCosts,
    formData.companyProfit,
    formData.percentHighStress,
    formData.productionLossHighStress,
    formData.costShortSickLeave,
    formData.percentShortSickLeaveMentalHealth,
    formData.costLongSickLeave,
    formData.percentLongSickLeaveMentalHealth
  ]);
  
  // Rensa fetchMessage efter en viss tid - uppdatera för varje enskilt meddelande
  useEffect(() => {
    if (fetchMessageFormD) {
      const timer = setTimeout(() => {
        setFetchMessageFormD(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageFormD]);

  useEffect(() => {
    if (fetchMessageFormE) {
      const timer = setTimeout(() => {
        setFetchMessageFormE(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageFormE]);

  useEffect(() => {
    if (fetchMessageFormF) {
      const timer = setTimeout(() => {
        setFetchMessageFormF(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageFormF]);

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

  const handleChange = (field: keyof FormCData, value: string | number | undefined) => {
    // Om värdet är ett nummer eller undefined, uppdatera direkt
    if (typeof value === 'number' || value === undefined) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      // För strängar, konvertera till nummer om fältet är numeriskt
      if (typeof formData[field] === 'number') {
        // Om värdet är tomt, sätt till undefined
        if (value === '') {
          setFormData(prev => ({ ...prev, [field]: undefined }));
        } else {
          // Konvertera kommatecken till decimalpunkt
          const normalizedValue = value.replace(',', '.');
          const numValue = parseFloat(normalizedValue);
          setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? undefined : numValue }));
        }
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  // Hjälpfunktion för att formatera nummer med tusentalsavgränsare
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('sv-SE');
  };

  // Hjälpfunktion för att hämta värden från andra formulär
  const fetchValueFromForm = async (formType: string) => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setError(null);
      
      if (formType === 'D') {
        const data = await loadFormData<FormDData>(currentUser.uid, formType);
        if (data && data.totalPersonnelCosts !== undefined) {
          // Avrunda värdet till heltal för att undvika decimalproblem
          const roundedValue = Math.round(data.totalPersonnelCosts);
          handleChange('totalPersonnelCosts', roundedValue);
          setFetchMessageFormD(`Värde hämtat från Formulär ${formType}!`);
        } else {
          setFetchMessageFormD(`Inget värde hittades i Formulär ${formType}.`);
        }
      } else if (formType === 'E') {
        const data = await loadFormData<FormEData>(currentUser.uid, formType);
        if (data && data.totalSickLeaveCosts !== undefined) {
          // Avrunda värdet till heltal för att undvika decimalproblem
          const roundedValue = Math.round(data.totalSickLeaveCosts);
          handleChange('costShortSickLeave', roundedValue);
          setFetchMessageFormE(`Värde hämtat från Formulär ${formType}!`);
        } else {
          setFetchMessageFormE(`Inget värde hittades i Formulär ${formType}.`);
        }
      } else if (formType === 'F') {
        const data = await loadFormData<FormFData>(currentUser.uid, formType);
        if (data && data.totalLongSickLeaveCosts !== undefined) {
          // Avrunda värdet till heltal för att undvika decimalproblem
          const roundedValue = Math.round(data.totalLongSickLeaveCosts);
          handleChange('costLongSickLeave', roundedValue);
          setFetchMessageFormF(`Värde hämtat från Formulär ${formType}!`);
        } else {
          setFetchMessageFormF(`Inget värde hittades i Formulär ${formType}.`);
        }
      }
    } catch (error) {
      console.error(`Error fetching value from Form${formType}:`, error);
      setError(`Kunde inte hämta värdet från Formulär ${formType}`);
    }
  };

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormCData): FormCData => {
    const preparedData = { ...data };
    
    // Ersätt undefined med null för alla fält
    Object.keys(preparedData).forEach(key => {
      const typedKey = key as keyof FormCData;
      if (typeof preparedData[typedKey] === 'undefined') {
        (preparedData as Record<keyof FormCData, string | number | undefined | null>)[typedKey] = null;
      }
    });
    
    return preparedData;
  };

  // Uppdatera handleSave för att använda prepareDataForSave
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
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave);
      
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

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">C – Beräkningsmodell för ekonomiska konsekvenser av psykisk ohälsa</h2>
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
        
        {/* C1-C3 */}
        <div className="form-card">
          <SectionHeader 
            title="Grundinformation" 
            icon={<Info className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">C1: Organisationens namn</label>
              <InfoLabel text="Namnet på din organisation" />
              <Input
                value={formData.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                placeholder="Ange organisationens namn"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C2: Kontaktperson</label>
              <InfoLabel text="Namn på kontaktperson" />
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Ange kontaktperson"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C3: Tidsperiod (12 månader)</label>
              <InfoLabel text="Ange tidsperiod i formatet ÅÅÅÅ-MM-DD - ÅÅÅÅ-MM-DD" />
              <Input
                value={formData.timePeriod}
                onChange={(e) => handleChange('timePeriod', e.target.value)}
                placeholder="Ange tidsperiod"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <SharedFieldsButton 
              userId={currentUser?.uid}
              onFieldsLoaded={(fields: SharedFields) => {
                setFormData(prevData => updateFormWithSharedFields(prevData, fields, { includeTimePeriod: true }));
              }}
              disabled={!currentUser?.uid}
            />
          </div>
        </div>

        <div className="form-card">
          <SectionHeader 
            title="Beräkning av kostnad för produktionsbortfall pga psykisk ohälsa" 
            icon={<Calculator className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                C4: Totala personalkostnader (lön + sociala + kringkostnader), kr per år
              </label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär D9" />
              <FormattedNumberInput
                value={formData.totalPersonnelCosts}
                onChange={(value) => handleChange('totalPersonnelCosts', value)}
                placeholder="Värdet kan hämtas från D9"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={async () => {
                  await fetchValueFromForm('D');
                }}
                disabled={!currentUser?.uid}
                formName="D"
                message={fetchMessageFormD}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C5: Vinst i företaget, kr per år</label>
              <FormattedNumberInput
                value={formData.companyProfit}
                onChange={(value) => handleChange('companyProfit', value)}
                placeholder="Ange summa i kr"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C6: Summa, värde av arbete"
              value={`${formatNumber(formData.totalWorkValue)} kr`}
              info="Beräknas automatiskt som summan av C4 + C5"
            />
          </div>
        </div>

        <div className="form-card">
          <SectionHeader 
            title="Stressnivå och produktionsbortfall" 
            icon={<ArrowRight className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">C7: Andel av personalen med hög stressnivå (%)</label>
              <InfoLabel text="Baserat på forskning varierar detta mellan branscher: Vård & Omsorg (25-35%), IT (20-30%), Finans (15-25%), Handel (10-20%). Standardvärde är 22% för genomsnittlig verksamhet. Mät detta genom medarbetarundersökningar eller screening." />
              <FormattedNumberInput
                value={formData.percentHighStress}
                onChange={(value) => handleChange('percentHighStress', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C8: Produktionsbortfall vid hög stressnivå (%)</label>
              <InfoLabel text="Enligt Myndigheten för arbetsmiljökunskap innebär stressrelaterad psykisk ohälsa i snitt ett produktionsbortfall på minst nio procent. Detta är en låg uppskattning, vilket innebär att den faktiska kostnaden sannolikt är högre." />
              <FormattedNumberInput
                value={formData.productionLossHighStress}
                onChange={(value) => handleChange('productionLossHighStress', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C9: Totalt produktionsbortfall"
              value={`${formatNumber(formData.totalProductionLoss)}%`}
              info="Beräknas automatiskt baserat på värdet i C8"
            />
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C10: Värde av produktionsbortfall (för över till ruta C18)"
              value={`${formatNumber(formData.valueProductionLoss)} kr`}
              info="Beräknas automatiskt som (C6 × C9 ÷ 100)"
              highlight={true}
            />
          </div>
        </div>

        <div className="form-card">
          <SectionHeader 
            title="Beräkning av kostnad för sjukfrånvaro pga psykisk ohälsa" 
            icon={<Calculator className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">C11: Total kostnad för kort sjukfrånvaro (dag 1–14), kr per år</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär E8" />
              <FormattedNumberInput
                value={formData.costShortSickLeave}
                onChange={(value) => handleChange('costShortSickLeave', value)}
                placeholder="Värdet kan hämtas från E8"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={async () => {
                  await fetchValueFromForm('E');
                }}
                disabled={!currentUser?.uid}
                formName="E"
                message={fetchMessageFormE}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C12: Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)</label>
              <InfoLabel text="Standardvärde är 6% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (8-10%), IT (5-7%), Finans (4-6%), Handel (3-5%). Kort sjukfrånvaro definieras som 1-14 dagar och inkluderar stressrelaterade symptom, utmattning och ångest." />
              <FormattedNumberInput
                value={formData.percentShortSickLeaveMentalHealth}
                onChange={(value) => handleChange('percentShortSickLeaveMentalHealth', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C13: Kostnad för kort sjukfrånvaro beroende på psykisk ohälsa, kr per år"
              value={`${formatNumber(formData.costShortSickLeaveMentalHealth)} kr`}
              info="Beräknas automatiskt som (C11 × C12 ÷ 100)"
            />
          </div>
        </div>

        <div className="form-card">
          <SectionHeader 
            title="Kostnad för lång sjukfrånvaro" 
            icon={<ArrowRight className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">C14: Total kostnad för lång sjukfrånvaro (dag 15–), kr per år</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär F8" />
              <FormattedNumberInput
                value={formData.costLongSickLeave}
                onChange={(value) => handleChange('costLongSickLeave', value)}
                placeholder="Värdet kan hämtas från F8"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={async () => {
                  await fetchValueFromForm('F');
                }}
                disabled={!currentUser?.uid}
                formName="F"
                message={fetchMessageFormF}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C15: Andel av lång sjukfrånvaro som beror på psykisk ohälsa (%)</label>
              <InfoLabel text="Standardvärde är 40% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (45-50%), IT (35-40%), Finans (30-35%), Handel (25-30%). Lång sjukfrånvaro definieras som 15+ dagar och inkluderar depression, utmattningssyndrom och andra psykiska diagnoser." />
              <FormattedNumberInput
                value={formData.percentLongSickLeaveMentalHealth}
                onChange={(value) => handleChange('percentLongSickLeaveMentalHealth', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C16: Kostnad för lång sjukfrånvaro beroende på psykisk ohälsa, kr per år"
              value={`${formatNumber(formData.costLongSickLeaveMentalHealth)} kr`}
              info="Beräknas automatiskt som (C14 × C15 ÷ 100)"
            />
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C17: Kostnad för sjukfrånvaro beroende på psykisk ohälsa, kr per år"
              value={`${formatNumber(formData.totalCostSickLeaveMentalHealth)} kr`}
              info="Beräknas automatiskt som summan av C13 + C16"
              highlight={true}
            />
          </div>
        </div>

        <div className="form-card">
          <SectionHeader 
            title="Summering av kostnad pga psykisk ohälsa" 
            icon={<PieChart className="h-5 w-5 text-primary" />}
          />
          
          <div className="mt-4">
            <ReadOnlyField 
              label="C18: Värde av produktionsbortfall, kr per år"
              value={`${formatNumber(formData.valueProductionLoss)} kr`}
              info="Samma värde som C10, överförs automatiskt"
            />
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C19: Kostnad för sjukfrånvaro beroende på psykisk ohälsa, kr per år"
              value={`${formatNumber(formData.totalCostSickLeaveMentalHealth)} kr`}
              info="Samma värde som C17, överförs automatiskt"
            />
          </div>
          
          <div className="mt-6 pb-2">
            <ReadOnlyField 
              label="C20: Total kostnad för psykisk ohälsa, kr per år"
              value={`${formatNumber(formData.totalCostMentalHealth)} kr`}
              info="Beräknas automatiskt som summan av C18 + C19"
              highlight={true}
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

export default FormC; 