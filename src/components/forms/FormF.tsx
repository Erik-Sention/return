import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Calculator, Users, Coins, Calendar, Calculator as CalculatorIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';

interface FormFData {
  organizationName: string;
  contactPerson: string;
  averageMonthlySalary: number | undefined;
  sickLeaveCostPercentage: number | undefined;
  sickLeaveCostPerDay: number;
  numberOfEmployees: number | undefined;
  scheduledWorkDaysPerYear: number | undefined;
  longSickLeavePercentage: number | undefined;
  totalSickDays: number;
  totalLongSickLeaveCosts: number;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormFRef {
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
    <div className={`p-2 ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-background'} border border-dashed border-muted-foreground/40 rounded-md flex justify-between shadow-sm`}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CalculatorIcon className="w-3 h-3" />
        <span>Auto</span>
      </div>
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

const FORM_TYPE = 'F';

// Definiera en typ för komponentens props
type FormFProps = React.ComponentProps<'div'>;

// Gör FormF till en forwardRef component
const FormF = forwardRef<FormFRef, FormFProps>(function FormF(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormFData>({
    organizationName: '',
    contactPerson: '',
    averageMonthlySalary: undefined,
    sickLeaveCostPercentage: undefined,
    sickLeaveCostPerDay: 0,
    numberOfEmployees: undefined,
    scheduledWorkDaysPerYear: undefined,
    longSickLeavePercentage: undefined,
    totalSickDays: 0,
    totalLongSickLeaveCosts: 0
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
          const data = await loadFormData<FormFData>(currentUser.uid, FORM_TYPE);
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
    // F3: Kostnad för lång sjukfrånvaro per sjukdag
    const sickLeaveCostPerDay = (formData.averageMonthlySalary || 0) * ((formData.sickLeaveCostPercentage || 0) / 100);
    
    // F7: Antal sjukdagar totalt (lång sjukfrånvaro)
    const totalSickDays = (formData.numberOfEmployees || 0) * 
                         (formData.scheduledWorkDaysPerYear || 220) * 
                         ((formData.longSickLeavePercentage || 0) / 100);
    
    // F8: Totala kostnader för lång sjukfrånvaro
    const totalLongSickLeaveCosts = sickLeaveCostPerDay * totalSickDays;

    setFormData(prev => ({
      ...prev,
      sickLeaveCostPerDay,
      totalSickDays,
      totalLongSickLeaveCosts
    }));
  }, [
    formData.averageMonthlySalary,
    formData.sickLeaveCostPercentage,
    formData.numberOfEmployees,
    formData.scheduledWorkDaysPerYear,
    formData.longSickLeavePercentage
  ]);

  // Setup autosave whenever formData changes
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (currentUser?.uid) {
      // Kontrollera och fixa eventuella undefined-värden innan autosave
      const safeFormData = prepareDataForSave(formData);
      
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        safeFormData,
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

  const handleChange = (field: keyof FormFData, value: string | number | undefined) => {
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
  const prepareDataForSave = (data: FormFData): Record<string, string | number | null> => {
    const preparedData: Record<string, string | number | null> = {};
    
    // Konvertera explicit alla undefineds till null eller defaultvärden
    Object.keys(data).forEach(key => {
      const typedKey = key as keyof FormFData;
      const value = data[typedKey];
      
      // Hantera specifikt undefineds för alla möjliga fält
      if (value === undefined) {
        // För numeriska fält, använd 0 eller null
        if (
          typedKey === 'averageMonthlySalary' || 
          typedKey === 'sickLeaveCostPercentage' || 
          typedKey === 'numberOfEmployees' || 
          typedKey === 'scheduledWorkDaysPerYear' || 
          typedKey === 'longSickLeavePercentage'
        ) {
          preparedData[key] = null;
        } 
        // För beräknade fält, använd 0
        else if (
          typedKey === 'sickLeaveCostPerDay' || 
          typedKey === 'totalSickDays' || 
          typedKey === 'totalLongSickLeaveCosts'
        ) {
          preparedData[key] = 0;
        }
        // För strängar, använd tom sträng
        else {
          preparedData[key] = '';
        }
      } else {
        preparedData[key] = value;
      }
    });
    
    // Dubbelkolla att inga fält fortfarande är undefined
    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === undefined) {
        console.warn(`Field ${key} is still undefined after preparation, setting to null`);
        preparedData[key] = null;
      }
    });
    
    return preparedData;
  };

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
            <h2 className="text-2xl font-bold">F – Beräkning av kostnader för lång sjukfrånvaro (dag 15–)</h2>
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
        
        {/* F1-F2 */}
        <div className="form-card">
          <SectionHeader 
            title="Grundläggande löneinformation" 
            icon={<Coins className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">F1: Genomsnittlig månadslön</label>
              <InfoLabel text="Ange den genomsnittliga månadslönen per anställd." />
              <FormattedNumberInput
                value={formData.averageMonthlySalary}
                onChange={(value) => handleChange('averageMonthlySalary', value)}
                placeholder="Ange genomsnittlig månadslön"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">F2: Kostnad för lång sjukfrånvaro per sjukdag (% av månadslön)</label>
              <InfoLabel text="Procentandel av månadslönen som utgör kostnaden per sjukdag. Standardvärde är ofta 1%." />
              <FormattedNumberInput
                value={formData.sickLeaveCostPercentage}
                onChange={(value) => handleChange('sickLeaveCostPercentage', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="F3: Kostnad för lång sjukfrånvaro per sjukdag"
              value={formatCurrency(formData.sickLeaveCostPerDay || 0)}
              info="Beräknas automatiskt som F1 × F2"
            />
          </div>
        </div>

        {/* F4-F5 */}
        <div className="form-card">
          <SectionHeader 
            title="Personalstorlek och arbetstid" 
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">F4: Antal anställda (FTE)</label>
              <InfoLabel text="Ange antal heltidsanställda. Om ni har deltidsanställda, konvertera till heltid. Exempel: 2 personer på 50% = 1 FTE." />
              <FormattedNumberInput
                value={formData.numberOfEmployees}
                onChange={(value) => handleChange('numberOfEmployees', value)}
                placeholder="Ange antal anställda"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">F5: Antal schemalagda arbetsdagar per år, per anställd</label>
              <InfoLabel text="Standard är 220 dagar." />
              <FormattedNumberInput
                value={formData.scheduledWorkDaysPerYear}
                onChange={(value) => handleChange('scheduledWorkDaysPerYear', value)}
                placeholder="Ange antal dagar"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>

        {/* F6 */}
        <div className="form-card">
          <SectionHeader 
            title="Sjukfrånvaronivå" 
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">F6: Sjukfrånvaro, lång (dag 15–) i % av schemalagd arbetstid</label>
              <InfoLabel text="Ange den procentandel av den schemalagda arbetstiden som utgörs av lång sjukfrånvaro (dag 15 och framåt)." />
              <FormattedNumberInput
                value={formData.longSickLeavePercentage}
                onChange={(value) => handleChange('longSickLeavePercentage', value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="F7: Antal sjukdagar totalt (lång sjukfrånvaro)"
              value={formData.totalSickDays.toLocaleString('sv-SE')}
              info="Beräknas automatiskt som F4 × F5 × F6"
            />
          </div>
        </div>

        {/* F8 */}
        <div className="form-card">
          <SectionHeader 
            title="Totala kostnader för lång sjukfrånvaro" 
            icon={<Calculator className="h-5 w-5 text-primary" />}
          />
          
          <div className="mt-4">
            <ReadOnlyField 
              label="F8: Totala kostnader, lång sjukfrånvaro"
              value={formatCurrency(formData.totalLongSickLeaveCosts || 0)}
              info="Beräknas automatiskt som F3 × F7. Överförs till C14"
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

export default FormF; 