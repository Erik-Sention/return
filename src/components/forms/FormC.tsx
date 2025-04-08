import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, ArrowRight, Calculator, PieChart, Calculator as CalculatorIcon, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

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
  totalShortSickLeaveCosts?: number;
  shortSickLeavePercentage?: number;
  totalLongSickLeaveCosts?: number;
  longSickLeavePercentage?: number;
  shortSickLeaveMentalHealthPercentage?: number;
  longSickLeaveMentalHealthPercentage?: number;
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

// Hjälpfunktion för att konvertera null till undefined
const nullToUndefined = (value: number | null | undefined): number | undefined => {
  return value === null ? undefined : value;
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

// Ersätt FetchValueButton med AutoFilledField
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

// Definiera en typ för vad som ska exponeras via ref
export interface FormCRef {
  handleSave: () => Promise<void>;
}

// Uppdatera FormCProps för att ta emot en onNavigateToForm prop
type FormCProps = React.ComponentProps<'div'> & {
  onNavigateToForm?: (formName: string) => void;
};

// Formulärinformationskomponent
const FormInfo = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
    <h3 className="text-lg font-semibold mb-2">Formulär 2 – Kostnader relaterade till mental ohälsa</h3>
    <p className="text-sm text-slate-700 dark:text-slate-300">
      I detta formulär beräknar du kostnader som är relaterade till mental ohälsa i organisationen.
      Uppgifterna baseras delvis på data från Formulär 1 och används senare för att motivera investeringar i förebyggande åtgärder.
    </p>
  </div>
);

// Gör FormC till en forwardRef component
const FormC = forwardRef<FormCRef, FormCProps>(function FormC(props, ref) {
  const { currentUser } = useAuth();
  const { onNavigateToForm } = props;
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
  
  // Lägg till state för att spåra automatisk datahämtning
  const [autoFetchStatus, setAutoFetchStatus] = useState({
    hasFetched: false,             // Om datahämtning har körts
    personnelCosts: false,         // Om personalkostnader har hämtats från FormD
    shortSickLeaveCosts: false,    // Om korttidssjukfrånvarokostnader har hämtats från FormD
    shortSickLeavePercent: false,  // Om kort sjukfrånvaroprocent har hämtats från FormD
    shortSickLeaveMentalHealthPercent: false, // Om psykisk ohälsa för kort sjukfrånvaro har hämtats från FormD
    longSickLeaveCosts: false,     // Om långtidssjukfrånvarokostnader har hämtats från FormD
    longSickLeavePercent: false,   // Om lång sjukfrånvaroprocent har hämtats från FormD
    longSickLeaveMentalHealthPercent: false, // Om psykisk ohälsa för lång sjukfrånvaro har hämtats från FormD
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

  // Hantera ändringar i formuläret
  const handleChange = useCallback((field: keyof FormCData, value: string | number | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormCData>(currentUser.uid, FORM_TYPE);
          if (data) {
            console.log('Loaded form data:', data);
            console.log('Loaded totalCostMentalHealth value:', data.totalCostMentalHealth);
            
            // Ensure we have a valid totalCostMentalHealth value
            if (typeof data.totalCostMentalHealth === 'undefined' || data.totalCostMentalHealth === null) {
              console.warn('Loaded data has undefined or null totalCostMentalHealth, setting to 0');
              data.totalCostMentalHealth = 0;
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
  }, [currentUser]);

  // Lägg till automatisk datahämtning från FormD vid inladdning
  useEffect(() => {
    const autoFetchFromOtherForms = async () => {
      if (autoFetchStatus.hasFetched || !currentUser?.uid) return;
      
      try {
        // Spara aktuell status för autoFetch
        const currentStatus = { ...autoFetchStatus, hasFetched: true };
        setAutoFetchStatus(currentStatus);
        
        // Hämta data från FormD
        const formDData = await loadFormData<FormDData>(currentUser.uid, 'D');
        if (formDData) {
          // Hämta totalPersonnelCosts om det finns
          if (formDData.totalPersonnelCosts !== undefined) {
            const roundedValue = Math.round(formDData.totalPersonnelCosts);
            handleChange('totalPersonnelCosts', roundedValue);
            currentStatus.personnelCosts = true;
          }
          
          // Hämta totalShortSickLeaveCosts om det finns
          if (formDData.totalShortSickLeaveCosts !== undefined) {
            const roundedValue = Math.round(formDData.totalShortSickLeaveCosts);
            handleChange('costShortSickLeave', roundedValue);
            currentStatus.shortSickLeaveCosts = true;
          }
          
          // Hämta procentsats för kort sjukfrånvaro om det finns
          if (formDData.shortSickLeavePercentage !== undefined) {
            handleChange('percentShortSickLeaveMentalHealth', formDData.shortSickLeavePercentage);
            currentStatus.shortSickLeavePercent = true;
          }
          
          // Hämta procentsats för psykisk ohälsa i kort sjukfrånvaro om det finns
          if (formDData.shortSickLeaveMentalHealthPercentage !== undefined) {
            handleChange('percentShortSickLeaveMentalHealth', formDData.shortSickLeaveMentalHealthPercentage);
            currentStatus.shortSickLeaveMentalHealthPercent = true;
          }
          
          // Hämta totalLongSickLeaveCosts om det finns
          if (formDData.totalLongSickLeaveCosts !== undefined) {
            const roundedValue = Math.round(formDData.totalLongSickLeaveCosts);
            handleChange('costLongSickLeave', roundedValue);
            currentStatus.longSickLeaveCosts = true;
          }
          
          // Hämta procentsats för lång sjukfrånvaro om det finns
          if (formDData.longSickLeavePercentage !== undefined) {
            handleChange('percentLongSickLeaveMentalHealth', formDData.longSickLeavePercentage);
            currentStatus.longSickLeavePercent = true;
          }
          
          // Hämta procentsats för psykisk ohälsa i lång sjukfrånvaro om det finns
          if (formDData.longSickLeaveMentalHealthPercentage !== undefined) {
            handleChange('percentLongSickLeaveMentalHealth', formDData.longSickLeaveMentalHealthPercentage);
            currentStatus.longSickLeaveMentalHealthPercent = true;
          }
        }
        
        setAutoFetchStatus(currentStatus);
      } catch (error) {
        console.error('Fel vid automatisk hämtning från andra formulär:', error);
        setAutoFetchStatus(prev => ({ 
          ...prev, 
          hasFetched: true, 
          errorMessage: 'Kunde inte automatiskt hämta data från formulär D.' 
        }));
      }
    };
    
    autoFetchFromOtherForms();
  }, [currentUser, autoFetchStatus, handleChange]);

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
    
    console.log('FormC calculated values:', {
      valueProductionLoss,
      totalCostSickLeaveMentalHealth,
      totalCostMentalHealth
    });
  
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
  
  // Setup autosave whenever formData changes
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Only autosave if user is logged in and form has been interacted with
    if (currentUser?.uid) {
      // Ensure we're saving data with proper totalCostMentalHealth
      const dataToAutosave = prepareDataForSave(formData);
      console.log('[Autosave] Preparing data for autosave, totalCostMentalHealth =', dataToAutosave.totalCostMentalHealth);
      
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        dataToAutosave,
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

  // Hjälpfunktion för att formatera nummer med tusentalsavgränsare
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('sv-SE');
  };

  // Hjälpfunktion för att navigera till specifikt formulär
  const navigateToForm = (formName: string) => {
    if (onNavigateToForm) {
      onNavigateToForm(formName);
    } else {
      console.warn('Navigation callback is not provided to FormC component');
    }
  };

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormCData): FormCData => {
    const preparedData = { ...data };
    
    // Säkerställ att totalCostMentalHealth aldrig är undefined innan vi sparar
    if (typeof preparedData.totalCostMentalHealth === 'undefined') {
      preparedData.totalCostMentalHealth = 0;
    }
    
    // Ersätt undefined med null för alla fält
    Object.keys(preparedData).forEach(key => {
      const typedKey = key as keyof FormCData;
      if (typeof preparedData[typedKey] === 'undefined') {
        (preparedData as Record<keyof FormCData, string | number | undefined | null>)[typedKey] = null;
      }
    });
    
    console.log('FormC data prepared for save, totalCostMentalHealth =', preparedData.totalCostMentalHealth);
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
      console.log('totalCostMentalHealth value being saved:', dataToSave.totalCostMentalHealth);
      
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

  // Kombinera alla laddningsstatus för att avgöra om innehållet är redo att visas
  useEffect(() => {
    // Om alla data är laddade, ställ in isContentReady till true
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

  return (
    <div className="space-y-6">
      <FadeIn show={isContentReady} duration={500}>
        <div className="space-y-4">
          {/* Lägg till formulärinformation */}
          <FormInfo />
          
          {/* Dold OrganizationHeader för att ladda data */}
          <div className="sr-only">
            <OrganizationHeader 
              onLoadingChange={setIsOrgInfoLoading} 
              onDataLoaded={handleOrgDataLoaded}
            />
          </div>
          
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
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">2 – Kostnader relaterade till mental ohälsa</h2>
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
          
          {/* Visa information om automatiskt hämtad data */}
          {autoFetchStatus.hasFetched && (autoFetchStatus.personnelCosts || 
                                          autoFetchStatus.shortSickLeaveCosts || 
                                          autoFetchStatus.shortSickLeavePercent || 
                                          autoFetchStatus.shortSickLeaveMentalHealthPercent ||
                                          autoFetchStatus.longSickLeaveCosts || 
                                          autoFetchStatus.longSickLeavePercent ||
                                          autoFetchStatus.longSickLeaveMentalHealthPercent) && (
            <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
              <p className="font-medium">Följande data har automatiskt hämtats från Formulär 1:</p>
              <ul className="list-disc list-inside mt-1">
                {autoFetchStatus.personnelCosts && <li>Totala personalkostnader </li>}
                {autoFetchStatus.shortSickLeaveCosts && <li>Kostnader för kort sjukfrånvaro </li>}
                {autoFetchStatus.shortSickLeavePercent && <li>Procent kort sjukfrånvaro </li>}
                {autoFetchStatus.shortSickLeaveMentalHealthPercent && <li>Andel kort sjukfrånvaro pga psykisk ohälsa</li>}
                {autoFetchStatus.longSickLeaveCosts && <li>Kostnader för lång sjukfrånvaro </li>}
                {autoFetchStatus.longSickLeavePercent && <li>Procent lång sjukfrånvaro </li>}
                {autoFetchStatus.longSickLeaveMentalHealthPercent && <li>Andel lång sjukfrånvaro pga psykisk ohälsa</li>}
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
              title="Beräkning av kostnad för produktionsbortfall pga psykisk ohälsa" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Totala personalkostnader (lön + sociala + kringkostnader), kr per år</label>
                <InfoLabel text="Detta värde hämtas från Formulär 1 (totala personalkostnader)" />
                <AutoFilledField
                  value={`${formatNumber(formData.totalPersonnelCosts || 0)} kr`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.personnelCosts || !formData.totalPersonnelCosts}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vinst i företaget, kr per år</label>
                <InfoLabel text="Detta fält är valfritt. Om din organisation inte har vinst kan fältet lämnas tomt." />
                <FormattedNumberInput
                  value={nullToUndefined(formData.companyProfit)}
                  onChange={(value) => handleChange('companyProfit', value)}
                  placeholder="Ange belopp"
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Summa, värde av arbete"
                value={`${formatNumber(formData.totalWorkValue)} kr`}
                info="Beräknas automatiskt som summan av personalkostnader och vinst"
              />
            </div>
          </div>

          <div className="form-card">
            <SectionHeader 
              title="Produktionsbortfall på grund av stress" 
              icon={<Brain className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Andel av personalen med hög stressnivå (%)</label>
                <InfoLabel text="Detta är andelen anställda som upplever hög eller mycket hög stress, vanligtvis 15-30% i svenska organisationer." />
                <FormattedNumberInput
                  value={nullToUndefined(formData.percentHighStress)}
                  onChange={(value) => handleChange('percentHighStress', value)}
                  placeholder="Ange procent"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Produktionsbortfall vid hög stressnivå (%)</label>
                <InfoLabel text="Standardvärde är 9% baserat på forskning. Detta är effektivitetsförlusten hos anställda med hög/mycket hög stress." />
                <FormattedNumberInput
                  value={nullToUndefined(formData.productionLossHighStress)}
                  onChange={(value) => handleChange('productionLossHighStress', value)}
                  placeholder="Ange procent"
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Totalt produktionsbortfall"
                value={`${formatNumber(formData.totalProductionLoss)}%`}
                info="Beräknas automatiskt baserat på andel av personalen med hög stressnivå"
              />
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Värde av produktionsbortfall"
                value={`${formatNumber(formData.valueProductionLoss)} kr`}
                info="Beräknas automatiskt baserat på värdet av arbete och produktionsbortfall"
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
                <label className="text-sm font-medium">Total kostnad för kort sjukfrånvaro (dag 1–14), kr per år</label>
                <InfoLabel text="Detta värde hämtas från Formulär 1 (kort sjukfrånvaro)" />
                <AutoFilledField
                  value={`${formatNumber(formData.costShortSickLeave || 0)} kr`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.shortSickLeaveCosts || !formData.costShortSickLeave}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)</label>
                <InfoLabel text="Standardvärde är 6% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (8-10%), IT (5-7%), Finans (4-6%), Handel (3-5%). Kort sjukfrånvaro definieras som 1-14 dagar och inkluderar stressrelaterade symptom, utmattning och ångest." />
                <AutoFilledField
                  value={`${formatNumber(formData.percentShortSickLeaveMentalHealth || 0)} %`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.shortSickLeaveMentalHealthPercent || !formData.percentShortSickLeaveMentalHealth}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Kostnad för kort sjukfrånvaro beroende på psykisk ohälsa, kr per år"
                value={`${formatNumber(formData.costShortSickLeaveMentalHealth)} kr`}
                info="Beräknas automatiskt baserat på total kort sjukfrånvaro och andel som beror på psykisk ohälsa"
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
                <label className="text-sm font-medium">Total kostnad för lång sjukfrånvaro (dag 15–), kr per år</label>
                <InfoLabel text="Detta värde hämtas från Formulär 1 (lång sjukfrånvaro)" />
                <AutoFilledField
                  value={`${formatNumber(formData.costLongSickLeave || 0)} kr`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.longSickLeaveCosts || !formData.costLongSickLeave}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Andel av lång sjukfrånvaro som beror på psykisk ohälsa (%)</label>
                <InfoLabel text="Standardvärde är 40% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (45-50%), IT (35-40%), Finans (30-35%), Handel (25-30%). Lång sjukfrånvaro definieras som 15+ dagar och inkluderar depression, utmattningssyndrom och andra psykiska diagnoser." />
                <AutoFilledField
                  value={`${formatNumber(formData.percentLongSickLeaveMentalHealth || 0)} %`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.longSickLeaveMentalHealthPercent || !formData.percentLongSickLeaveMentalHealth}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Kostnad för lång sjukfrånvaro beroende på psykisk ohälsa, kr per år"
                value={`${formatNumber(formData.costLongSickLeaveMentalHealth)} kr`}
                info="Beräknas automatiskt baserat på total lång sjukfrånvaro och andel som beror på psykisk ohälsa"
              />
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Kostnad för sjukfrånvaro beroende på psykisk ohälsa, kr per år"
                value={`${formatNumber(formData.totalCostSickLeaveMentalHealth)} kr`}
                info="Beräknas automatiskt som summan av kort och lång sjukfrånvaro"
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
                label="Värde av produktionsbortfall, kr per år"
                value={`${formatNumber(formData.valueProductionLoss)} kr`}
                info="Samma värde som beräknat ovan, överförs automatiskt"
              />
            </div>
            
            <div className="mt-6">
              <ReadOnlyField 
                label="Kostnad för sjukfrånvaro beroende på psykisk ohälsa, kr per år"
                value={`${formatNumber(formData.totalCostSickLeaveMentalHealth)} kr`}
                info="Samma värde som beräknat ovan, överförs automatiskt"
              />
            </div>
            
            <div className="mt-6 pb-2">
              <ReadOnlyField 
                label="Total kostnad för psykisk ohälsa, kr per år"
                value={`${formatNumber(formData.totalCostMentalHealth)} kr`}
                info="Beräknas automatiskt som summan av produktionsbortfall och sjukfrånvaro"
                highlight={true}
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

export default FormC; 