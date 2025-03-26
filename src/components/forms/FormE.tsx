import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Info, Calculator, Users, Calendar, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';

interface FormEData {
  organizationName: string;
  contactPerson: string;
  averageMonthlySalary: number;
  sickLeaveCostPercentage: number;
  sickLeaveCostPerDay: number;
  numberOfEmployees: number;
  scheduledWorkDaysPerYear: number;
  shortSickLeavePercentage: number;
  totalSickDays: number;
  totalSickLeaveCosts: number;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormERef {
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

const FORM_TYPE = 'E';

// Definiera en typ för komponentens props
type FormEProps = React.ComponentProps<'div'>;

// Gör FormE till en forwardRef component
const FormE = forwardRef<FormERef, FormEProps>(function FormE(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormEData>({
    organizationName: '',
    contactPerson: '',
    averageMonthlySalary: 0,
    sickLeaveCostPercentage: 0,
    sickLeaveCostPerDay: 0,
    numberOfEmployees: 0,
    scheduledWorkDaysPerYear: 220,
    shortSickLeavePercentage: 0,
    totalSickDays: 0,
    totalSickLeaveCosts: 0
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
          const data = await loadFormData<FormEData>(currentUser.uid, FORM_TYPE);
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
    // E3: Kostnad för kort sjukfrånvaro per sjukdag
    const sickLeaveCostPerDay = (formData.averageMonthlySalary || 0) * ((formData.sickLeaveCostPercentage || 0) / 100);
    
    // E7: Antal sjukdagar totalt
    const totalSickDays = (formData.numberOfEmployees || 0) * 
                         (formData.scheduledWorkDaysPerYear || 0) * 
                         ((formData.shortSickLeavePercentage || 0) / 100);
    
    // E8: Totala kostnader för kort sjukfrånvaro
    const totalSickLeaveCosts = sickLeaveCostPerDay * totalSickDays;

    setFormData(prev => ({
      ...prev,
      sickLeaveCostPerDay,
      totalSickDays,
      totalSickLeaveCosts
    }));
  }, [
    formData.averageMonthlySalary,
    formData.sickLeaveCostPercentage,
    formData.numberOfEmployees,
    formData.scheduledWorkDaysPerYear,
    formData.shortSickLeavePercentage
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
      
      await saveFormData(currentUser.uid, FORM_TYPE, formData);
      
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

  const handleChange = (field: keyof FormEData, value: string | number) => {
    // Om värdet är en sträng, konvertera till nummer om det är ett numeriskt fält
    if (typeof formData[field] === 'number' && typeof value === 'string') {
      // Konvertera kommatecken till decimalpunkt
      const normalizedValue = value.replace(',', '.');
      const numValue = parseFloat(normalizedValue) || 0;
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

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">E – Beräkning av kostnader för kort sjukfrånvaro (dag 1–14)</h2>
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
        
        {/* E1-E2 */}
        <div className="form-card">
          <SectionHeader 
            title="Grundläggande löneinformation" 
            icon={<Coins className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">E1: Genomsnittlig månadslön</label>
              <InfoLabel text="Inkludera alla lönekomponenter som grundlön, OB, övertidstillägg och andra fasta tillägg." />
              <Input
                type="number"
                step="any"
                value={formData.averageMonthlySalary ?? ''}
                onChange={(e) => handleChange('averageMonthlySalary', e.target.value)}
                placeholder="Ange genomsnittlig månadslön"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E2: Kostnad för kort sjukfrånvaro per sjukdag (% av månadslön)</label>
              <InfoLabel text="Standardvärde är 10% för de flesta branscher. Detta varierar mellan branscher: Vård & Omsorg (12-15% pga ersättningskostnader), IT (8-10%), Finans (8-10%), Handel (10-12%)." />
              <Input
                type="number"
                step="any"
                value={formData.sickLeaveCostPercentage ?? ''}
                onChange={(e) => handleChange('sickLeaveCostPercentage', e.target.value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="E3: Kostnad för kort sjukfrånvaro per sjukdag"
              value={formatCurrency(formData.sickLeaveCostPerDay || 0)}
              info="Beräknas automatiskt som E1 × E2"
            />
          </div>
        </div>

        {/* E4-E5 */}
        <div className="form-card">
          <SectionHeader 
            title="Personalstorlek och arbetstid" 
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">E4: Antal anställda (FTE)</label>
              <InfoLabel text="Ange antal heltidsanställda. Om ni har deltidsanställda, konvertera till heltid. Exempel: 2 personer på 50% = 1 FTE." />
              <Input
                type="number"
                step="any"
                value={formData.numberOfEmployees ?? ''}
                onChange={(e) => handleChange('numberOfEmployees', e.target.value)}
                placeholder="Ange antal anställda"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E5: Antal schemalagda arbetsdagar per år, per anställd</label>
              <InfoLabel text="Standard är 220 dagar. Detta varierar mellan branscher: Vård & Omsorg (210 dagar pga skiftarbete), IT (220 dagar), Finans (220 dagar), Handel (200-210 dagar pga öppettider)." />
              <Input
                type="number"
                step="any"
                value={formData.scheduledWorkDaysPerYear ?? ''}
                onChange={(e) => handleChange('scheduledWorkDaysPerYear', e.target.value)}
                placeholder="Ange antal dagar"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>

        {/* E6 */}
        <div className="form-card">
          <SectionHeader 
            title="Sjukfrånvaronivå" 
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">E6: Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid</label>
              <InfoLabel text="Standardvärde är 2.5% för de flesta branscher. Detta varierar mellan branscher: Vård & Omsorg (3-4% pga högre risk för smitta), IT (2-2.5%), Finans (2-2.5%), Handel (2.5-3% pga kundkontakt)." />
              <Input
                type="number"
                step="any"
                value={formData.shortSickLeavePercentage ?? ''}
                onChange={(e) => handleChange('shortSickLeavePercentage', e.target.value)}
                placeholder="Ange procent"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <ReadOnlyField 
              label="E7: Antal sjukdagar totalt (kort sjukfrånvaro)"
              value={formatNumber(formData.totalSickDays)}
              info="Beräknas automatiskt som E4 × E5 × E6"
            />
          </div>
        </div>

        {/* E8 */}
        <div className="form-card">
          <SectionHeader 
            title="Totala kostnader för kort sjukfrånvaro" 
            icon={<Calculator className="h-5 w-5 text-primary" />}
          />
          
          <div className="mt-4">
            <ReadOnlyField 
              label="E8: Totala kostnader, kort sjukfrånvaro"
              value={formatCurrency(formData.totalSickLeaveCosts || 0)}
              info="Beräknas automatiskt som E3 × E7. Överförs till C11"
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

export default FormE; 