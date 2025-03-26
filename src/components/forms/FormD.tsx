import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Calculator, Users, Clock, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';

interface FormDData {
  organizationName: string;
  contactPerson: string;
  averageMonthlySalary: number | undefined;
  socialFeesPercentage: number | undefined;
  averageSocialFeesPerMonth: number;
  numberOfEmployees: number | undefined;
  numberOfMonths: number | undefined;
  totalSalaryCosts: number;
  personnelOverheadPercentage: number | undefined;
  totalPersonnelOverhead: number;
  totalPersonnelCosts: number;
  scheduledWorkHoursPerYear: number | undefined;
  personnelCostPerHour: number;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormDRef {
  handleSave: () => Promise<void>;
}

// Lägg till InfoLabel-komponenten för att ge användaren information
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

const FORM_TYPE = 'D';

// Definiera en typ för komponentens props
type FormDProps = React.ComponentProps<'div'>;

// Gör FormD till en forwardRef component
const FormD = forwardRef<FormDRef, FormDProps>(function FormD(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormDData>({
    organizationName: '',
    contactPerson: '',
    averageMonthlySalary: undefined,
    socialFeesPercentage: undefined,
    averageSocialFeesPerMonth: 0,
    numberOfEmployees: undefined,
    numberOfMonths: undefined,
    totalSalaryCosts: 0,
    personnelOverheadPercentage: undefined,
    totalPersonnelOverhead: 0,
    totalPersonnelCosts: 0,
    scheduledWorkHoursPerYear: undefined,
    personnelCostPerHour: 0
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
          const data = await loadFormData<FormDData>(currentUser.uid, FORM_TYPE);
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
    // D3: Genomsnittliga sociala avgifter per månad
    const averageSocialFeesPerMonth = 
      (formData.averageMonthlySalary || 0) * ((formData.socialFeesPercentage || 0) / 100);
    
    // D6: Totala lönekostnader
    const totalSalaryCosts = ((formData.averageMonthlySalary || 0) + averageSocialFeesPerMonth) * 
                            (formData.numberOfEmployees || 0) * 
                            (formData.numberOfMonths || 12);
    
    // D8: Totala personalkringkostnader
    const totalPersonnelOverhead = totalSalaryCosts * ((formData.personnelOverheadPercentage || 0) / 100);
    
    // D9: Totala personalkostnader
    const totalPersonnelCosts = totalSalaryCosts + totalPersonnelOverhead;
    
    // D11: Personalkostnad per arbetad timme
    const personnelCostPerHour = (formData.scheduledWorkHoursPerYear || 0) > 0 && (formData.numberOfEmployees || 0) > 0
      ? totalPersonnelCosts / (formData.numberOfEmployees || 1) / (formData.scheduledWorkHoursPerYear || 1) 
      : 0;

    setFormData(prev => ({
      ...prev,
      averageSocialFeesPerMonth,
      totalSalaryCosts,
      totalPersonnelOverhead,
      totalPersonnelCosts,
      personnelCostPerHour
    }));
  }, [
    formData.averageMonthlySalary,
    formData.socialFeesPercentage,
    formData.numberOfEmployees,
    formData.numberOfMonths,
    formData.personnelOverheadPercentage,
    formData.scheduledWorkHoursPerYear
  ]);

  // Setup autosave whenever formData changes
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (currentUser?.uid) {
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        formData,
        setIsSaving,
        setSaveMessage
      );
    }

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

  const handleChange = (field: keyof FormDData, value: string | number | undefined) => {
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

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormDData): FormDData => {
    const preparedData = { ...data };
    
    // Ersätt undefined med null för alla fält
    Object.keys(preparedData).forEach(key => {
      const typedKey = key as keyof FormDData;
      if (typeof preparedData[typedKey] === 'undefined') {
        (preparedData as Record<keyof FormDData, string | number | null>)[typedKey] = null;
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
      
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave);
      
      setSaveMessage('Formuläret har sparats!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Ett fel uppstod när formuläret skulle sparas till databasen.');
      throw error;
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
            <h2 className="text-2xl font-bold">D – Beräkning av personalkostnader</h2>
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
        
        {/* D1-D2 */}
        <div className="form-card">
          <SectionHeader 
            title="Grundläggande löneinformation" 
            icon={<Coins className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">D1: Genomsnittlig månadslön</label>
              <InfoLabel text="Inkludera alla lönekomponenter som grundlön, OB, övertidstillägg och andra fasta tillägg." />
              <FormattedNumberInput
                value={formData.averageMonthlySalary}
                onChange={(value) => handleChange('averageMonthlySalary', value)}
                placeholder="Ange genomsnittlig månadslön"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">D2: Sociala avgifter (%)</label>
              <InfoLabel text="Standardvärde är 42% för de flesta branscher. Detta inkluderar: Arbetsgivaravgift (31.42%), Tjänstepension (4.5%), Försäkringar (6%). Vård & Omsorg har ofta högre avgifter pga särskilda pensionsavtal. IT-branschen kan ha lägre avgifter pga högre pensionsnivåer." />
              <FormattedNumberInput
                value={formData.socialFeesPercentage}
                onChange={(value) => handleChange('socialFeesPercentage', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="D3: Genomsnittliga sociala avgifter per månad"
              value={formatCurrency(formData.averageSocialFeesPerMonth)}
              info="Beräknas automatiskt som D1 × D2"
            />
          </div>
        </div>

        {/* D4-D5 */}
        <div className="form-card">
          <SectionHeader 
            title="Personalstorlek och tidsperiod" 
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">D4: Antal anställda (FTE)</label>
              <InfoLabel text="Ange antal heltidsanställda. Om ni har deltidsanställda, konvertera till heltid. Exempel: 2 personer på 50% = 1 FTE." />
              <FormattedNumberInput
                value={formData.numberOfEmployees}
                onChange={(value) => handleChange('numberOfEmployees', value)}
                placeholder="Ange antal anställda"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">D5: Antal månader</label>
              <InfoLabel text="Standard är 12 månader" />
              <FormattedNumberInput
                value={formData.numberOfMonths}
                onChange={(value) => handleChange('numberOfMonths', value)}
                placeholder="Ange antal månader"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="D6: Totala lönekostnader"
              value={formatCurrency(formData.totalSalaryCosts)}
              info="Beräknas automatiskt som (D1 + D3) × D4 × D5"
            />
          </div>
        </div>

        {/* D7-D8 */}
        <div className="form-card">
          <SectionHeader 
            title="Personalkringkostnader" 
            icon={<Calculator className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">D7: Personalkringkostnader (%)</label>
              <InfoLabel text="Standardvärde är 30% för de flesta branscher. Detta varierar mellan branscher: Vård & Omsorg (35-40% pga utrustning, skyddskläder), IT (25-30% pga utvecklingsverktyg, licenser), Finans (20-25% pga kontorsutrustning), Handel (15-20% pga butiksinredning). Inkluderar utbildning, utrustning, lokaler, IT-system och andra resurser." />
              <FormattedNumberInput
                value={formData.personnelOverheadPercentage}
                onChange={(value) => handleChange('personnelOverheadPercentage', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="D8: Totala personalkringkostnader"
              value={formatCurrency(formData.totalPersonnelOverhead)}
              info="Beräknas automatiskt som D6 × D7"
            />
          </div>
        </div>

        {/* D9 */}
        <div className="form-card">
          <SectionHeader 
            title="Totala personalkostnader" 
            icon={<Calculator className="h-5 w-5 text-primary" />}
          />
          
          <div className="mt-4">
            <ReadOnlyField 
              label="D9: Totala personalkostnader"
              value={formatCurrency(formData.totalPersonnelCosts)}
              info="Beräknas automatiskt som D6 + D8. Överförs till C4"
              highlight={true}
            />
          </div>
        </div>

        {/* D10-D11 */}
        <div className="form-card">
          <SectionHeader 
            title="Kostnad per arbetad timme" 
            icon={<Clock className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">D10: Schemalagd arbetstid (timmar/år)</label>
              <InfoLabel text="Standard är 1760 timmar per år (220 dagar × 8 timmar). Detta varierar mellan branscher: Vård & Omsorg (1680 timmar pga skiftarbete), IT (1760-1840 timmar), Finans (1760 timmar), Handel (1600-1680 timmar pga öppettider). Inkludera endast schemalagd arbetstid, exkludera övertid." />
              <FormattedNumberInput
                value={formData.scheduledWorkHoursPerYear}
                onChange={(value) => handleChange('scheduledWorkHoursPerYear', value)}
                placeholder="Ange antal timmar"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="D11: Personalkostnad per arbetad timme"
              value={formatCurrency(formData.personnelCostPerHour)}
              info="Beräknas automatiskt som D9 ÷ D4 ÷ D10"
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

export default FormD; 