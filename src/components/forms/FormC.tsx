import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Info, ArrowRight, Calculator, PieChart, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';

interface FormCData {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
  totalPersonnelCosts?: number;
  companyProfit?: number;
  totalWorkValue: number;
  percentHighStress?: number;
  productionLossHighStress?: number;
  totalProductionLoss: number;
  valueProductionLoss: number;
  costShortSickLeave?: number;
  percentShortSickLeaveMentalHealth?: number;
  costShortSickLeaveMentalHealth: number;
  costLongSickLeave?: number;
  percentLongSickLeaveMentalHealth?: number;
  costLongSickLeaveMentalHealth: number;
  totalCostSickLeaveMentalHealth: number;
  totalCostMentalHealth: number;
}

interface FormDData {
  totalPersonnelCosts?: number;
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
  disabled 
}: { 
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className="mt-1"
  >
    <ArrowDown className="h-4 w-4 mr-2" />
    Hämta från Formulär D
  </Button>
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
    const totalWorkValue = (formData.totalPersonnelCosts ?? 0) + (formData.companyProfit ?? 0);
    const totalProductionLoss = formData.productionLossHighStress ?? 0;
    const valueProductionLoss = (totalWorkValue * totalProductionLoss) / 100;
  
    const costShortSickLeaveMentalHealth = ((formData.costShortSickLeave ?? 0) * (formData.percentShortSickLeaveMentalHealth ?? 0)) / 100;
    const costLongSickLeaveMentalHealth = ((formData.costLongSickLeave ?? 0) * (formData.percentLongSickLeaveMentalHealth ?? 0)) / 100;
  
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
    formData.productionLossHighStress,
    formData.costShortSickLeave,
    formData.percentShortSickLeaveMentalHealth,
    formData.costLongSickLeave,
    formData.percentLongSickLeaveMentalHealth
  ]);
  

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
      
      console.log('Saving form data to Firebase:', formData);
      
      // Save only to Firebase
      await saveFormData(currentUser.uid, FORM_TYPE, formData);
      
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

  const handleChange = (field: keyof FormCData, value: string | number) => {
    // Konvertera till nummer om det är ett numeriskt fält
    if (typeof formData[field] === 'number' && typeof value === 'string') {
      // Ta bort alla icke-numeriska tecken förutom decimalpunkt
      const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
      const numValue = parseFloat(cleanValue) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Hjälpfunktion för att formatera nummer med tusentalsavgränsare
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('sv-SE');
  };

  // Hjälpfunktion för att formatera input-värden
  const formatInputValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('sv-SE');
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
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">C1: Organisationens namn</label>
              <Input
                value={formData.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                placeholder="Ange organisationens namn"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C2: Kontaktperson</label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Ange kontaktperson"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C3: Tidsperiod (12 månader)</label>
              <Input
                value={formData.timePeriod}
                onChange={(e) => handleChange('timePeriod', e.target.value)}
                placeholder="t.ex. 2023-01-01 – 2023-12-31"
                className="bg-background/50"
              />
            </div>
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
              <Input
                type="text"
                value={formatInputValue(formData.totalPersonnelCosts)}
                onChange={(e) => handleChange('totalPersonnelCosts', e.target.value)}
                placeholder="Värdet kan hämtas från D9"
                className="bg-background/50"
              />
              <FetchValueButton 
                onClick={async () => {
                  try {
                    const data = await loadFormData<FormDData>(currentUser?.uid || '', 'D');
                    if (data?.totalPersonnelCosts) {
                      handleChange('totalPersonnelCosts', data.totalPersonnelCosts);
                    }
                  } catch (error) {
                    console.error('Error fetching value from FormD:', error);
                    setError('Kunde inte hämta värdet från Formulär D');
                  }
                }}
                disabled={!currentUser?.uid}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C5: Vinst i företaget, kr per år</label>
              <Input
                type="text"
                value={formatInputValue(formData.companyProfit)}
                onChange={(e) => handleChange('companyProfit', e.target.value)}
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
              <Input
                type="text"
                value={formatInputValue(formData.percentHighStress)}
                onChange={(e) => handleChange('percentHighStress', e.target.value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C8: Produktionsbortfall vid hög stressnivå (%)</label>
              <InfoLabel text="Standardvärde är 2,0% baserat på forskning" />
              <Input
                type="text"
                value={formatInputValue(formData.productionLossHighStress)}
                onChange={(e) => handleChange('productionLossHighStress', e.target.value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="C9: Totalt produktionsbortfall"
              value={`${formData.totalProductionLoss}%`}
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
              <Input
                type="text"
                value={formatInputValue(formData.costShortSickLeave)}
                onChange={(e) => handleChange('costShortSickLeave', e.target.value)}
                placeholder="Värdet kan hämtas från E8"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C12: Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)</label>
              <InfoLabel text="Standardvärde är 6% baserat på forskning" />
              <Input
                type="text"
                value={formatInputValue(formData.percentShortSickLeaveMentalHealth)}
                onChange={(e) => handleChange('percentShortSickLeaveMentalHealth', e.target.value)}
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
              <Input
                type="text"
                value={formatInputValue(formData.costLongSickLeave)}
                onChange={(e) => handleChange('costLongSickLeave', e.target.value)}
                placeholder="Värdet kan hämtas från F8"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C15: Andel av lång sjukfrånvaro som beror på psykisk ohälsa (%)</label>
              <InfoLabel text="Standardvärde är 40% baserat på forskning" />
              <Input
                type="text"
                value={formatInputValue(formData.percentLongSickLeaveMentalHealth)}
                onChange={(e) => handleChange('percentLongSickLeaveMentalHealth', e.target.value)}
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