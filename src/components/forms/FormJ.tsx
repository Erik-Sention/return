import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Calculator, Info, LineChart, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { SharedFieldsButton } from '@/components/ui/shared-fields-button';
import { updateFormWithSharedFields } from '@/lib/utils/updateFormFields';
import { SharedFields } from '@/lib/firebase/sharedFields';

// Interface för data från formulär C
interface FormCData {
  totalCostMentalHealth?: number;
  [key: string]: unknown;
}

// Interface för data från formulär G
interface FormGData {
  totalInterventionCost?: number;
  [key: string]: unknown;
}

// Definiera datamodell för formuläret
interface FormJData {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
  interventionDescription: string;
  
  // Beräkningsalternativ 1 (investeringen är känd, effekten är känd)
  totalCostMentalHealthAlt1: number | undefined;
  reducedStressPercentageAlt1: number | undefined;
  economicBenefitAlt1: number;
  totalInterventionCostAlt1: number | undefined;
  economicSurplusAlt1: number;
  roiPercentageAlt1: number;
  
  // Beräkningsalternativ 2 (investeringen är okänd, effekten är känd)
  totalCostMentalHealthAlt2: number | undefined;
  reducedStressPercentageAlt2: number | undefined;
  maxInterventionCostAlt2: number;
  
  // Beräkningsalternativ 3 (investeringen är känd, effekten okänd)
  totalInterventionCostAlt3: number | undefined;
  totalCostMentalHealthAlt3: number | undefined;
  minEffectForBreakEvenAlt3: number;
}

// Definiera ref-typen för externa metoder
export interface FormJRef {
  handleSave: () => Promise<void>;
  getData: () => FormJData;
}

// Definiera props-typen för komponenten
type FormJProps = React.ComponentProps<'div'>;

// Lägg till FetchValueButton-komponenten för att hämta värden från andra formulär
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

// ROI-beräkningarna
const calculateValues = (data: FormJData): FormJData => {
  // Säkerställ att vi har ett giltigt objekt
  const updatedData = { ...data };
  
  // Beräkningsalternativ 1
  updatedData.economicBenefitAlt1 = 
    (updatedData.totalCostMentalHealthAlt1 || 0) * 
    ((updatedData.reducedStressPercentageAlt1 || 0) / 100);
  
  updatedData.economicSurplusAlt1 = 
    updatedData.economicBenefitAlt1 - 
    (updatedData.totalInterventionCostAlt1 || 0);
  
  updatedData.roiPercentageAlt1 = 
    (updatedData.totalInterventionCostAlt1 || 0) === 0 
      ? 0 
      : (updatedData.economicSurplusAlt1 / (updatedData.totalInterventionCostAlt1 || 1)) * 100;
  
  // Beräkningsalternativ 2
  updatedData.maxInterventionCostAlt2 = 
    (updatedData.totalCostMentalHealthAlt2 || 0) * 
    ((updatedData.reducedStressPercentageAlt2 || 0) / 100);
  
  // Beräkningsalternativ 3
  updatedData.minEffectForBreakEvenAlt3 = 
    (updatedData.totalCostMentalHealthAlt3 || 0) === 0 
      ? 0 
      : ((updatedData.totalInterventionCostAlt3 || 0) / (updatedData.totalCostMentalHealthAlt3 || 1)) * 100;
  
  return updatedData;
};

// Uppdatera prepareDataForSave-funktionen med specifika typer
const prepareDataForSave = (data: FormJData): Record<string, unknown> => {
  // Skapa ett objekt med väldefinierade typer
  const cleanedData: Record<string, unknown> = {};
  
  // Loopa igenom alla keys i formData och rensa undefined/null
  Object.entries(data).forEach(([key, value]) => {
    // Spara endast definierade värden
    if (value !== undefined && value !== null) {
      cleanedData[key] = value;
    }
  });
  
  return cleanedData;
};

const FORM_TYPE = 'J';

const FormJ = forwardRef<FormJRef, FormJProps>(function FormJ(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormJData>({
    organizationName: '',
    contactPerson: '',
    timePeriod: '',
    interventionDescription: '',
    
    totalCostMentalHealthAlt1: undefined,
    reducedStressPercentageAlt1: undefined,
    economicBenefitAlt1: 0,
    totalInterventionCostAlt1: undefined,
    economicSurplusAlt1: 0,
    roiPercentageAlt1: 0,
    
    totalCostMentalHealthAlt2: undefined,
    reducedStressPercentageAlt2: undefined,
    maxInterventionCostAlt2: 0,
    
    totalInterventionCostAlt3: undefined,
    totalCostMentalHealthAlt3: undefined,
    minEffectForBreakEvenAlt3: 0
  });
  
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const safeFormData = useMemo<FormJData>(() => {
    return calculateValues({ ...formData });
  }, [formData]);
  
  // Clear transferMessage after a timeout
  useEffect(() => {
    if (transferMessage) {
      const timer = setTimeout(() => {
        setTransferMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [transferMessage]);
  
  // Ladda data från Firebase vid komponentladdning
  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        try {
          const data = await loadFormData(currentUser.uid, FORM_TYPE);
          if (data) {
            setFormData(prev => calculateValues({...prev, ...data}));
          }
        } catch (error) {
          console.error("Fel vid laddning av data:", error);
        }
      }
    };
    
    loadData();
  }, [currentUser]);
  
  // Hantera ändringar i formuläret
  const handleChange = <K extends keyof FormJData>(field: K, value: FormJData[K]) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
      return calculateValues(updatedData);
    });
  };
  
  // Funktion för att hämta värden från andra formulär
  const fetchValueFromForm = async (formType: string, targetField: keyof FormJData, setMessage: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (!currentUser?.uid) {
      setTransferMessage('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setTransferMessage(null);
      
      if (formType === 'C') {
        const data = await loadFormData<FormCData>(currentUser.uid, formType);
        if (data && data.totalCostMentalHealth !== undefined) {
          // Avrunda värdet till heltal för att undvika decimalproblem
          const roundedValue = Math.round(data.totalCostMentalHealth);
          handleChange(targetField, roundedValue as FormJData[keyof FormJData]);
          setMessage(`Värde hämtat från Formulär ${formType}!`);
        } else {
          setMessage(`Inget värde hittades i Formulär ${formType}.`);
        }
      } else if (formType === 'G') {
        const data = await loadFormData<FormGData>(currentUser.uid, formType);
        if (data && data.totalInterventionCost !== undefined) {
          // Avrunda värdet till heltal för att undvika decimalproblem
          const roundedValue = Math.round(data.totalInterventionCost);
          handleChange(targetField, roundedValue as FormJData[keyof FormJData]);
          setMessage(`Värde hämtat från Formulär ${formType}!`);
        } else {
          setMessage(`Inget värde hittades i Formulär ${formType}.`);
        }
      }
    } catch (error) {
      console.error(`Error fetching data from Form ${formType}:`, error);
      setMessage(`Ett fel uppstod när data skulle hämtas från Formulär ${formType}.`);
    }

    // Rensa meddelandet efter 3 sekunder
    setTimeout(() => setMessage(null), 3000);
  };
  
  // Spara data till Firebase
  const handleSave = async () => {
    if (!currentUser?.uid) {
      setTransferMessage('Du måste vara inloggad för att spara data');
      return Promise.reject('Du måste vara inloggad för att spara data');
    }

    try {
      setTransferMessage(null);
      
      // Förbereda data för att undvika Firebase-fel med undefined-värden
      const dataToSave = prepareDataForSave(safeFormData);
      
      // Save to Firebase
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave);
      
      setTransferMessage('Formuläret har sparats!');
      setTimeout(() => setTransferMessage(null), 3000);
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving form data:', error);
      setTransferMessage('Ett fel uppstod när formuläret skulle sparas till databasen.');
      return Promise.reject(error);
    }
  };
  
  // Setup autosave whenever formData changes
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Only autosave if user is logged in
    if (currentUser?.uid) {
      // Förbereda data för att undvika Firebase-fel med undefined-värden
      const dataToSave = prepareDataForSave(safeFormData);
      
      // Skapa en wrapper-funktion för att hantera type-skillnaden
      const handleSavingStateChange = () => {
        // Vi ignorerar denna parameter eftersom vi inte längre använder separate meddelanden
      };
      
      const handleSaveMessageChange = (msg: string | null) => {
        if (msg) setTransferMessage(msg);
      };
      
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        dataToSave,
        handleSavingStateChange,
        handleSaveMessageChange
      );
    }

    // Cleanup timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [currentUser, safeFormData]);
  
  // Exponera metoder via ref
  useImperativeHandle(ref, () => ({
    async handleSave() {
      return await handleSave();
    },
    getData() {
      return formData;
    }
  }));
  
  // Huvudinnehåll
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Formulär J - Return on Investment (ROI)</h2>
      
      {/* Grundinformation */}
      <div className="form-card">
        <SectionHeader 
          title="Grundinformation" 
          icon={<Info className="h-5 w-5 text-primary" />}
        />
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">J1: Organisationens namn</label>
            <InfoLabel text="Namnet på din organisation" />
            <Input
              value={safeFormData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              placeholder="Ange organisationens namn"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">J2: Kontaktperson</label>
            <InfoLabel text="Namn på kontaktperson" />
            <Input
              value={safeFormData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              placeholder="Ange kontaktperson"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">J3: Tidsperiod</label>
            <InfoLabel text="Ange tidsperiod i formatet ÅÅÅÅ-MM-DD - ÅÅÅÅ-MM-DD" />
            <Input
              value={safeFormData.timePeriod}
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
      
      {/* Insatsbeskrivning */}
      <div className="form-card">
        <SectionHeader 
          title="Beskriv insatsen som beräkningen avser" 
          icon={<LineChart className="h-5 w-5 text-primary" />}
        />
        
        <div className="space-y-2">
          <label className="text-sm font-medium">J4: Insatsbeskrivning</label>
          <InfoLabel text="Summering av alla insatser, se formulär G samt respektive underformulär" />
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
            value={safeFormData.interventionDescription}
            onChange={(e) => handleChange('interventionDescription', e.target.value)}
            placeholder="Beskriv insatsen..."
          />
        </div>
      </div>
      
      {/* Beräkningsalternativ 1 */}
      <div className="form-card">
        <SectionHeader 
          title="Beräkningsalternativ 1" 
          icon={<Calculator className="h-5 w-5 text-primary" />}
        />
        <div className="text-sm text-muted-foreground mb-4">
          (investeringen är känd, effekten är känd, beräkna ROI)
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">J5: Total kostnad för psykisk ohälsa, kr per år</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär C20" />
              <FormattedNumberInput
                value={safeFormData.totalCostMentalHealthAlt1}
                onChange={(value) => handleChange('totalCostMentalHealthAlt1', value)}
                allowDecimals={false}
                placeholder="0"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={() => fetchValueFromForm('C', 'totalCostMentalHealthAlt1', setTransferMessage)}
                disabled={!currentUser?.uid}
                formName="C"
                message={transferMessage}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">J6: Minskad andel av personal med hög stressnivå</label>
              <div className="flex items-center gap-2">
                <FormattedNumberInput
                  value={safeFormData.reducedStressPercentageAlt1}
                  onChange={(value) => handleChange('reducedStressPercentageAlt1', value)}
                  allowDecimals={true}
                  placeholder="0"
                  className="bg-background/50"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-t border-dashed">
            <label className="text-sm font-medium">J7: Ekonomisk nytta av insatsen, kr per år</label>
            <div className="text-xl font-semibold">
              {formatCurrency(safeFormData.economicBenefitAlt1)}
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">J8: Total kostnad för insatsen, kr</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär G34" />
              <FormattedNumberInput
                value={safeFormData.totalInterventionCostAlt1}
                onChange={(value) => handleChange('totalInterventionCostAlt1', value)}
                allowDecimals={false}
                placeholder="0"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={() => fetchValueFromForm('G', 'totalInterventionCostAlt1', setTransferMessage)}
                disabled={!currentUser?.uid}
                formName="G"
                message={transferMessage}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-t border-dashed">
            <label className="text-sm font-medium">J9: Ekonomiskt överskott av insatsen (kr)</label>
            <div className="text-xl font-semibold">
              {formatCurrency(safeFormData.economicSurplusAlt1)}
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-dashed border-t border-b">
            <label className="text-sm font-medium">J10: Total kostnad för insatsen, kr</label>
            <div className="text-xl font-semibold">
              {formatCurrency(safeFormData.totalInterventionCostAlt1 || 0)}
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 bg-primary/5 rounded-md px-3">
            <label className="text-base font-bold">J11: Return on investment (ROI), %, alt 1.</label>
            <div className="text-2xl font-bold text-primary">
              {formatPercentage(safeFormData.roiPercentageAlt1)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Beräkningsalternativ 2 */}
      <div className="form-card">
        <SectionHeader 
          title="Beräkningsalternativ 2" 
          icon={<Calculator className="h-5 w-5 text-primary" />}
        />
        <div className="text-sm text-muted-foreground mb-4">
          (investeringen är okänd, effekten är känd, beräkna maximal insatskostnad)
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">J12: Total kostnad för psykisk ohälsa, kr per år</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär C20" />
              <FormattedNumberInput
                value={safeFormData.totalCostMentalHealthAlt2}
                onChange={(value) => handleChange('totalCostMentalHealthAlt2', value)}
                allowDecimals={false}
                placeholder="0"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={() => fetchValueFromForm('C', 'totalCostMentalHealthAlt2', setTransferMessage)}
                disabled={!currentUser?.uid}
                formName="C"
                message={transferMessage}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">J13: Minskad andel av personal med hög stressnivå</label>
              <div className="flex items-center gap-2">
                <FormattedNumberInput
                  value={safeFormData.reducedStressPercentageAlt2}
                  onChange={(value) => handleChange('reducedStressPercentageAlt2', value)}
                  allowDecimals={true}
                  placeholder="0"
                  className="bg-background/50"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 bg-primary/5 rounded-md px-3">
            <label className="text-base font-bold">J14: Maximal kostnad för insatsen, alt 2.</label>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(safeFormData.maxInterventionCostAlt2)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Beräkningsalternativ 3 */}
      <div className="form-card">
        <SectionHeader 
          title="Beräkningsalternativ 3" 
          icon={<Calculator className="h-5 w-5 text-primary" />}
        />
        <div className="text-sm text-muted-foreground mb-4">
          (investeringen är känd, effekten okänd, beräkna minsta effekt för att nå break-even)
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">J15: Total kostnad för insatsen, kr</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär G34" />
              <FormattedNumberInput
                value={safeFormData.totalInterventionCostAlt3}
                onChange={(value) => handleChange('totalInterventionCostAlt3', value)}
                allowDecimals={false}
                placeholder="0"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={() => fetchValueFromForm('G', 'totalInterventionCostAlt3', setTransferMessage)}
                disabled={!currentUser?.uid}
                formName="G"
                message={transferMessage}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">J16: Total kostnad för psykisk ohälsa, kr per år</label>
              <InfoLabel text="Detta fält kan hämtas automatiskt från formulär C20" />
              <FormattedNumberInput
                value={safeFormData.totalCostMentalHealthAlt3}
                onChange={(value) => handleChange('totalCostMentalHealthAlt3', value)}
                allowDecimals={false}
                placeholder="0"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={() => fetchValueFromForm('C', 'totalCostMentalHealthAlt3', setTransferMessage)}
                disabled={!currentUser?.uid}
                formName="C"
                message={transferMessage}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 bg-primary/5 rounded-md px-3">
            <label className="text-base font-bold">J17: Minskad andel av personal med hög stressnivå för break even, %, alt 3.</label>
            <div className="text-2xl font-bold text-primary">
              {formatPercentage(safeFormData.minEffectForBreakEvenAlt3)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FormJ; 