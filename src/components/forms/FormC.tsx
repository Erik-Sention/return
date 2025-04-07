import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, ArrowRight, Calculator, PieChart, Calculator as CalculatorIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { SharedFieldsButton } from '@/components/ui/shared-fields-button';
import { updateFormWithSharedFields } from '@/lib/utils/updateFormFields';
import { SharedFields } from '@/lib/firebase/sharedFields';
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
        <CalculatorIcon className="w-3 h-3" />
        <span>Auto från Formulär {sourceFormName}</span>
      </div>
      {isEmpty ? (
        <span className="text-amber-500 font-medium">Saknar värde i formulär {sourceFormName}</span>
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
      Gå till Formulär {sourceFormName}
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
    longSickLeaveCosts: false,     // Om långtidssjukfrånvarokostnader har hämtats från FormD
    longSickLeavePercent: false,   // Om lång sjukfrånvaroprocent har hämtats från FormD
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
      {/* Dold OrganizationHeader för att ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={setIsOrgInfoLoading} 
          onDataLoaded={handleOrgDataLoaded}
        />
      </div>
      
      <FadeIn show={isContentReady} duration={500}>
        <div className="space-y-4">
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
              <h2 className="text-2xl font-bold">2 – Beräkning av psykosocial ohälsa</h2>
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
                                          autoFetchStatus.longSickLeaveCosts || 
                                          autoFetchStatus.longSickLeavePercent) && (
            <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
              <p className="font-medium">Följande data har automatiskt hämtats från Formulär D:</p>
              <ul className="list-disc list-inside mt-1">
                {autoFetchStatus.personnelCosts && <li>Totala personalkostnader (D9)</li>}
                {autoFetchStatus.shortSickLeaveCosts && <li>Kostnader för kort sjukfrånvaro (D17)</li>}
                {autoFetchStatus.shortSickLeavePercent && <li>Procent kort sjukfrånvaro (D15)</li>}
                {autoFetchStatus.longSickLeaveCosts && <li>Kostnader för lång sjukfrånvaro (D22)</li>}
                {autoFetchStatus.longSickLeavePercent && <li>Procent lång sjukfrånvaro (D20)</li>}
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
              title="Tidsperiod" 
              icon={<Info className="h-5 w-5 text-primary" />}
            />
            
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
                <InfoLabel text="Detta fält hämtas automatiskt från formulär D9" />
                <AutoFilledField
                  value={`${formatNumber(formData.totalPersonnelCosts || 0)} kr`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.personnelCosts || !formData.totalPersonnelCosts}
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
                <InfoLabel text="Enligt Arbetsmiljöverket rapporterar 10-20% av arbetstagare höga stressnivåer. Inom sjukvård, socialtjänst och utbildning är siffrorna ofta 20-25%, medan tillverkningsindustri och IT oftast har 8-15%" />
                <FormattedNumberInput
                  value={formData.percentHighStress}
                  onChange={(value) => handleChange('percentHighStress', value)}
                  placeholder="Ange procent"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">C8: Produktionsbortfall vid hög stressnivå (%)</label>
                <InfoLabel text="Enligt Myndigheten för arbetsmiljökunskap innebär stressrelaterad psykisk ohälsa i snitt ett produktionsbortfall på minst 9%. Detta är en låg uppskattning, vilket innebär att den faktiska kostnaden sannolikt är högre." />
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
                <InfoLabel text="Detta fält hämtas automatiskt från formulär D17" />
                <AutoFilledField
                  value={`${formatNumber(formData.costShortSickLeave || 0)} kr`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.shortSickLeaveCosts || !formData.costShortSickLeave}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">C12: Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)</label>
                <InfoLabel text="Standardvärde är 6% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (8-10%), IT (5-7%), Finans (4-6%), Handel (3-5%). Kort sjukfrånvaro definieras som 1-14 dagar och inkluderar stressrelaterade symptom, utmattning och ångest." />
                <AutoFilledField
                  value={`${formatNumber(formData.percentShortSickLeaveMentalHealth || 0)} %`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.shortSickLeavePercent || !formData.percentShortSickLeaveMentalHealth}
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
                <InfoLabel text="Detta fält hämtas automatiskt från formulär D22" />
                <AutoFilledField
                  value={`${formatNumber(formData.costLongSickLeave || 0)} kr`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.longSickLeaveCosts || !formData.costLongSickLeave}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">C15: Andel av lång sjukfrånvaro som beror på psykisk ohälsa (%)</label>
                <InfoLabel text="Standardvärde är 40% baserat på forskning. Detta varierar mellan branscher: Vård & Omsorg (45-50%), IT (35-40%), Finans (30-35%), Handel (25-30%). Lång sjukfrånvaro definieras som 15+ dagar och inkluderar depression, utmattningssyndrom och andra psykiska diagnoser." />
                <AutoFilledField
                  value={`${formatNumber(formData.percentLongSickLeaveMentalHealth || 0)} %`}
                  sourceFormName="D"
                  onNavigate={navigateToForm}
                  isEmpty={!autoFetchStatus.longSickLeavePercent || !formData.percentLongSickLeaveMentalHealth}
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
      </FadeIn>
    </div>
  );
});

export default FormC; 