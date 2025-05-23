import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Info, Calculator, Coins, Calendar, Calculator as CalculatorIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { updateSharedFieldsFromCurrentForm } from '@/lib/firebase/sharedFields';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { FadeIn } from '@/components/ui/fade-in';

interface FormDData {
  organizationName: string;
  contactPerson: string;
  startDate: string;
  endDate: string;
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
  scheduledWorkDaysPerYear: number | undefined;
  shortSickLeaveCostPercentage: number | undefined;
  shortSickLeaveCostPerDay: number;
  shortSickLeavePercentage: number | undefined;
  totalShortSickDays: number;
  totalShortSickLeaveCosts: number;
  shortSickLeaveMentalHealthPercentage: number | undefined;
  longSickLeaveCostPercentage: number | undefined;
  longSickLeaveCostPerDay: number;
  longSickLeavePercentage: number | undefined;
  totalLongSickDays: number;
  totalLongSickLeaveCosts: number;
  longSickLeaveMentalHealthPercentage: number | undefined;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormDRef {
  handleSave: () => Promise<void>;
}

// Lägg till InfoLabel-komponenten för att ge användaren information
const InfoLabel = ({ text }: { text: string }) => (
  <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
    <span className="flex-1 break-words">{text}</span>
  </div>
);

// Uppdatera ReadOnlyField-komponenten för att visa beräknade fält
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
  icon,
  subtitle
}: { 
  title: string; 
  icon: React.ReactNode;
  subtitle?: string;
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <div className="bg-primary/10 p-2 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {subtitle && (
      <p className="text-sm text-muted-foreground mt-2 ml-12">{subtitle}</p>
    )}
  </div>
);

// Formulärinformationskomponent
const FormInfo = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
    <h3 className="text-lg font-semibold mb-2">Formulär 1 – Beräkning av personalkostnader</h3>
    <p className="text-sm text-slate-700 dark:text-slate-300">
      I detta formulär beräknar du personalkostnader och sjukfrånvarokostnader. 
      Dessa uppgifter kommer att användas i efterföljande formulär för att beräkna effekter av ohälsa 
      och möjliga besparingar med preventiva insatser.
    </p>
  </div>
);

const FORM_TYPE = 'D';

// Definiera en typ för komponentens props
export type FormDProps = {
  projectId?: string | null;
  onNavigateToForm?: (formName: string) => void;
};

// Gör FormD till en forwardRef component
const FormD = forwardRef<FormDRef, FormDProps>(function FormD(props, ref) {
  const { currentUser } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId, onNavigateToForm } = props;
  const [formData, setFormData] = useState<FormDData>({
    organizationName: '',
    contactPerson: '',
    startDate: '',
    endDate: '',
    averageMonthlySalary: undefined,
    socialFeesPercentage: 42,
    averageSocialFeesPerMonth: 0,
    numberOfEmployees: undefined,
    numberOfMonths: 12,
    totalSalaryCosts: 0,
    personnelOverheadPercentage: 30,
    totalPersonnelOverhead: 0,
    totalPersonnelCosts: 0,
    scheduledWorkHoursPerYear: 1760,
    personnelCostPerHour: 0,
    scheduledWorkDaysPerYear: 220,
    shortSickLeaveCostPercentage: 10,
    shortSickLeaveCostPerDay: 0,
    shortSickLeavePercentage: 2.5,
    totalShortSickDays: 0,
    totalShortSickLeaveCosts: 0,
    shortSickLeaveMentalHealthPercentage: 6,
    longSickLeaveCostPercentage: 1,
    longSickLeaveCostPerDay: 0,
    longSickLeavePercentage: 3,
    totalLongSickDays: 0,
    totalLongSickLeaveCosts: 0,
    longSickLeaveMentalHealthPercentage: 40
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormDData>(currentUser.uid, FORM_TYPE, projectId);
          if (data) {
            console.log('Loaded form data:', data);
            // Säkerställ att startDate och endDate alltid är strängar
            const safeData = {
              ...data,
              startDate: data.startDate || '',
              endDate: data.endDate || ''
            };
            setFormData(safeData);
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
  
  // Ställ in när innehållet är redo att visas
  useEffect(() => {
    if (!isDataLoading) {
      setIsContentReady(true);
    }
  }, [isDataLoading]);

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
      
    // Beräkningar för kort sjukfrånvaro
    // Kostnad för kort sjukfrånvaro per sjukdag
    const shortSickLeaveCostPerDay = (formData.averageMonthlySalary || 0) * ((formData.shortSickLeaveCostPercentage || 0) / 100);
    
    // Antal sjukdagar totalt (kort sjukfrånvaro)
    const totalShortSickDays = (formData.numberOfEmployees || 0) * 
                           (formData.scheduledWorkDaysPerYear || 220) * 
                           ((formData.shortSickLeavePercentage || 0) / 100);
    
    // Totala kostnader för kort sjukfrånvaro
    const totalShortSickLeaveCosts = shortSickLeaveCostPerDay * totalShortSickDays;
    
    // Beräkningar för lång sjukfrånvaro
    // Kostnad för lång sjukfrånvaro per sjukdag
    const longSickLeaveCostPerDay = (formData.averageMonthlySalary || 0) * ((formData.longSickLeaveCostPercentage || 0) / 100);
    
    // Antal sjukdagar totalt (lång sjukfrånvaro)
    const totalLongSickDays = (formData.numberOfEmployees || 0) * 
                          (formData.scheduledWorkDaysPerYear || 220) * 
                          ((formData.longSickLeavePercentage || 0) / 100);
    
    // Totala kostnader för lång sjukfrånvaro
    const totalLongSickLeaveCosts = longSickLeaveCostPerDay * totalLongSickDays;

    setFormData(prev => ({
      ...prev,
      averageSocialFeesPerMonth,
      totalSalaryCosts,
      totalPersonnelOverhead,
      totalPersonnelCosts,
      personnelCostPerHour,
      shortSickLeaveCostPerDay,
      totalShortSickDays,
      totalShortSickLeaveCosts,
      longSickLeaveCostPerDay,
      totalLongSickDays,
      totalLongSickLeaveCosts
    }));
  }, [
    formData.averageMonthlySalary,
    formData.socialFeesPercentage,
    formData.numberOfEmployees,
    formData.numberOfMonths,
    formData.personnelOverheadPercentage,
    formData.scheduledWorkHoursPerYear,
    formData.shortSickLeaveCostPercentage,
    formData.scheduledWorkDaysPerYear,
    formData.shortSickLeavePercentage,
    formData.longSickLeaveCostPercentage,
    formData.longSickLeavePercentage
  ]);

  // Setup autosave whenever formData changes
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (currentUser?.uid) {
      // Förbereda data för autosparande för att undvika Firebase-fel med undefined
      const safeFormData = prepareDataForSave(formData);
      
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        safeFormData,
        setIsSaving,
        setSaveMessage,
        projectId
      );
    }

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
  const prepareDataForSave = (data: FormDData): Record<string, string | number | null> => {
    const preparedData: Record<string, string | number | null> = {};
    
    // Säkerställ att alla fält har giltiga värden för Firebase
    Object.keys(data).forEach(key => {
      const typedKey = key as keyof FormDData;
      const value = data[typedKey];
      
      // Strängar ska alltid vara strängar, aldrig null
      if (typedKey === 'organizationName' || typedKey === 'contactPerson' || 
          typedKey === 'startDate' || typedKey === 'endDate') {
        preparedData[key] = (value as string) || '';
      } 
      // Konvertera undefined och NaN till null för numeriska värden
      else if (value === undefined || (typeof value === 'number' && isNaN(value))) {
        preparedData[key] = null;
      }
      // Behåll alla andra värden som de är
      else {
        preparedData[key] = value as string | number;
      }
    });
    
    // Extra validering för att säkerställa att inga undefined förekommer
    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === undefined) {
        preparedData[key] = null;
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
      
      // Export av relevanta värden till interface som Formulär C förväntar sig
      const exportData = {
        totalPersonnelCosts: formData.totalPersonnelCosts,
        totalShortSickLeaveCosts: formData.totalShortSickLeaveCosts,
        shortSickLeavePercentage: formData.shortSickLeavePercentage,
        shortSickLeaveMentalHealthPercentage: formData.shortSickLeaveMentalHealthPercentage,
        totalLongSickLeaveCosts: formData.totalLongSickLeaveCosts,
        longSickLeavePercentage: formData.longSickLeavePercentage,
        longSickLeaveMentalHealthPercentage: formData.longSickLeaveMentalHealthPercentage
      };
      
      console.log('Saving form data to Firebase:', dataToSave);
      console.log('Exporting data for Form C:', exportData);
      
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave, projectId);
      
      // Uppdatera gemensamma fält för användaren
      await updateSharedFieldsFromCurrentForm(currentUser.uid, dataToSave, projectId);
      
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
    <div className="space-y-6">
      <FadeIn show={isContentReady} duration={500}>
        <div className="space-y-4">
          {/* Lägg till formulärinformation */}
          <FormInfo />
          
          {/* Organisationsinformation - centralt för alla formulär */}
          <div className="form-card bg-primary/5 border border-primary/20">
            <SectionHeader 
              title="Organisationsinformation" 
              icon={<Info className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organisationens namn</label>
                <InfoLabel text="Namnet på din organisation (visas i alla formulär)" />
                <Input
                  value={formData.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  placeholder="Ange organisationens namn"
                  className="bg-white dark:bg-slate-800 font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Kontaktperson</label>
                <InfoLabel text="Namn på kontaktperson (visas i alla formulär)" />
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  placeholder="Ange kontaktperson"
                  className="bg-white dark:bg-slate-800 font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tidsperiod (startdatum)</label>
                <InfoLabel text="Ange startdatum i formatet ÅÅÅÅ-MM-DD (visas i alla formulär)" />
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="bg-white dark:bg-slate-800 font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tidsperiod (slutdatum)</label>
                <InfoLabel text="Ange slutdatum i formatet ÅÅÅÅ-MM-DD (visas i alla formulär)" />
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="bg-white dark:bg-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">1 – Beräkning av personalkostnader</h2>
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
          
          {/* Gruppera alla inmatningsfält i ett enda kort för kompakt layout */}
          <div className="form-card">
            <SectionHeader 
              title="Personalkostnadsberäkning" 
              icon={<Coins className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {/* Grundläggande löneinformation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Genomsnittlig månadslön</label>
                <InfoLabel text="Inkludera alla lönekomponenter som grundlön, OB, övertidstillägg och andra fasta tillägg." />
                <FormattedNumberInput
                  value={formData.averageMonthlySalary}
                  onChange={(value) => handleChange('averageMonthlySalary', value)}
                  placeholder="Ange genomsnittlig månadslön"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sociala avgifter (%)</label>
                <InfoLabel text="Standardvärde är 42% för de flesta branscher." />
                <FormattedNumberInput
                  value={formData.socialFeesPercentage}
                  onChange={(value) => handleChange('socialFeesPercentage', value)}
                  placeholder="Ange procent"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Antal anställda (FTE)</label>
                <InfoLabel text="Ange antal heltidsanställda. Om ni har deltidsanställda, konvertera till heltid." />
                <FormattedNumberInput
                  value={formData.numberOfEmployees}
                  onChange={(value) => handleChange('numberOfEmployees', value)}
                  placeholder="Ange antal anställda"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Antal månader</label>
                <InfoLabel text="Standard är 12 månader" />
                <FormattedNumberInput
                  value={formData.numberOfMonths}
                  onChange={(value) => handleChange('numberOfMonths', value)}
                  placeholder="Ange antal månader"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Personalkringkostnader (%)</label>
                <InfoLabel text="Standardvärde är 30% för de flesta branscher." />
                <FormattedNumberInput
                  value={formData.personnelOverheadPercentage}
                  onChange={(value) => handleChange('personnelOverheadPercentage', value)}
                  placeholder="Ange procent"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Schemalagd arbetstid (timmar/år)</label>
                <InfoLabel text="Standard är 1760 timmar per år (220 dagar × 8 timmar)." />
                <FormattedNumberInput
                  value={formData.scheduledWorkHoursPerYear}
                  onChange={(value) => handleChange('scheduledWorkHoursPerYear', value)}
                  placeholder="Ange antal timmar"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Antal schemalagda arbetsdagar per år</label>
                <InfoLabel text="Standard är 220 dagar." />
                <FormattedNumberInput
                  value={formData.scheduledWorkDaysPerYear}
                  onChange={(value) => handleChange('scheduledWorkDaysPerYear', value)}
                  placeholder="Ange antal dagar"
                  className="bg-background/50"
                />
              </div>
            </div>
            
            {/* Automatiskt beräknade fält */}
            <div className="grid gap-4 mt-6 md:grid-cols-2">
              <ReadOnlyField 
                label="Genomsnittliga sociala avgifter per månad"
                value={formatCurrency(formData.averageSocialFeesPerMonth)}
                info="Beräknas automatiskt baserat på månadslön och sociala avgifter"
              />
              
              <ReadOnlyField 
                label="Totala lönekostnader"
                value={formatCurrency(formData.totalSalaryCosts)}
                info="Beräknas automatiskt baserat på lön, sociala avgifter, antal anställda och månader"
              />
              
              <ReadOnlyField 
                label="Totala personalkringkostnader"
                value={formatCurrency(formData.totalPersonnelOverhead)}
                info="Beräknas automatiskt baserat på lönekostnader och personalkringkostnader"
              />
              
              <ReadOnlyField 
                label="Personalkostnad per arbetad timme"
                value={formatCurrency(formData.personnelCostPerHour)}
                info="Beräknas automatiskt baserat på totala personalkostnader och arbetstimmar"
              />
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Totala personalkostnader"
                value={formatCurrency(formData.totalPersonnelCosts)}
                info="Beräknas automatiskt. Överförs till Formulär 2"
                highlight={true}
              />
            </div>
          </div>
          
          {/* Sjukfrånvarofält */}
          <div className="form-card">
            <SectionHeader 
              title="Sjukfrånvaro" 
              icon={<Calendar className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              {/* Kort sjukfrånvaro - Vänsterkolumn */}
              <div className="space-y-5">
                <div className="border-b border-primary/20 pb-2">
                  <h4 className="font-medium text-primary/80">Kort sjukfrånvaro</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kort sjukfrånvaro, kostnad per dag (% av månadslön)</label>
                  <InfoLabel text="Standardvärde är 10% för de flesta branscher." />
                  <FormattedNumberInput
                    value={formData.shortSickLeaveCostPercentage}
                    onChange={(value) => handleChange('shortSickLeaveCostPercentage', value)}
                    placeholder="Ange procent"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kort sjukfrånvaro (dag 1–14) % av arbetstid</label>
                  <InfoLabel text="Standardvärde är 2.5% för de flesta branscher." />
                  <FormattedNumberInput
                    value={formData.shortSickLeavePercentage}
                    onChange={(value) => handleChange('shortSickLeavePercentage', value)}
                    placeholder="Ange procent"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)</label>
                  <InfoLabel text="Standardvärde är 6% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (8-10%), IT (5-7%), Finans (4-6%), Handel (3-5%). Kort sjukfrånvaro definieras som 1-14 dagar och inkluderar stressrelaterade symptom, utmattning och ångest." />
                  <FormattedNumberInput
                    value={formData.shortSickLeaveMentalHealthPercentage}
                    onChange={(value) => handleChange('shortSickLeaveMentalHealthPercentage', value)}
                    placeholder="Ange procent"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="mt-12 space-y-4">
                  <ReadOnlyField
                    label="Kostnad för kort sjukfrånvaro per sjukdag"
                    value={formatCurrency(formData.shortSickLeaveCostPerDay || 0)}
                    info="Beräknas automatiskt baserat på månadslön och kostnadsprocent"
                  />
                  
                  <ReadOnlyField
                    label="Antal sjukdagar totalt (kort sjukfrånvaro)"
                    value={(formData.totalShortSickDays || 0).toLocaleString('sv-SE')}
                    info="Beräknas automatiskt baserat på antal anställda, arbetsdagar och frånvaroprocent"
                  />
                  
                  <ReadOnlyField 
                    label="Totala kostnader, kort sjukfrånvaro"
                    value={formatCurrency(formData.totalShortSickLeaveCosts || 0)}
                    info="Beräknas automatiskt. Överförs till Formulär 2"
                    highlight={true}
                  />
                </div>
              </div>
              
              {/* Lång sjukfrånvaro - Högerkolumn */}
              <div className="space-y-5">
                <div className="border-b border-primary/20 pb-2">
                  <h4 className="font-medium text-primary/80">Lång sjukfrånvaro</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lång sjukfrånvaro, kostnad per dag (% av månadslön)</label>
                  <InfoLabel text="Standardvärde är ofta 1%." />
                  <FormattedNumberInput
                    value={formData.longSickLeaveCostPercentage}
                    onChange={(value) => handleChange('longSickLeaveCostPercentage', value)}
                    placeholder="Ange procent"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lång sjukfrånvaro (dag 15–) % av arbetstid</label>
                  <InfoLabel text="Ange procentandel av schemalagd arbetstid." />
                  <FormattedNumberInput
                    value={formData.longSickLeavePercentage}
                    onChange={(value) => handleChange('longSickLeavePercentage', value)}
                    placeholder="Ange procent"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Andel av lång sjukfrånvaro som beror på psykisk ohälsa (%)</label>
                  <InfoLabel text="Standardvärde är 40% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (45-50%), IT (35-40%), Finans (30-35%), Handel (25-30%). Lång sjukfrånvaro definieras som 15+ dagar och inkluderar depression, utmattningssyndrom och andra psykiska diagnoser." />
                  <FormattedNumberInput
                    value={formData.longSickLeaveMentalHealthPercentage}
                    onChange={(value) => handleChange('longSickLeaveMentalHealthPercentage', value)}
                    placeholder="Ange procent"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="mt-12 space-y-4">
                  <ReadOnlyField
                    label="Kostnad för lång sjukfrånvaro per sjukdag"
                    value={formatCurrency(formData.longSickLeaveCostPerDay || 0)}
                    info="Beräknas automatiskt baserat på månadslön och kostnadsprocent"
                  />
                  
                  <ReadOnlyField
                    label="Antal sjukdagar totalt (lång sjukfrånvaro)"
                    value={(formData.totalLongSickDays || 0).toLocaleString('sv-SE')}
                    info="Beräknas automatiskt baserat på antal anställda, arbetsdagar och frånvaroprocent"
                  />
                  
                  <ReadOnlyField 
                    label="Totala kostnader, lång sjukfrånvaro"
                    value={formatCurrency(formData.totalLongSickLeaveCosts || 0)}
                    info="Beräknas automatiskt. Överförs till Formulär 2"
                    highlight={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

export default FormD; 