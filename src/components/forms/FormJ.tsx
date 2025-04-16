import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Calculator, Info, ArrowDown, ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

// Interface för data från formulär C
interface FormCData {
  totalCostMentalHealth: number;
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
type FormJProps = React.ComponentProps<'div'> & {
  onNavigateToForm?: (formName: string) => void;
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

// Lägg till AutoFilledField-komponenten för att visa automatiskt hämtad data
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
      Hämta från Formulär {getFormNumber(formName)}
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
  
  // Konvertera null till 0 för alla numeriska värden som används i beräkningar
  const getValue = (field: keyof FormJData): number => {
    const value = updatedData[field];
    if (value === undefined || value === null) return 0;
    return typeof value === 'number' ? value : 0;
  };
  
  // Beräkningsalternativ 1
  updatedData.economicBenefitAlt1 = 
    getValue('totalCostMentalHealthAlt1') * 
    (getValue('reducedStressPercentageAlt1') / 100);
  
  updatedData.economicSurplusAlt1 = 
    updatedData.economicBenefitAlt1 - 
    getValue('totalInterventionCostAlt1');
  
  updatedData.roiPercentageAlt1 = 
    getValue('totalInterventionCostAlt1') === 0 
      ? 0 
      : (updatedData.economicSurplusAlt1 / getValue('totalInterventionCostAlt1')) * 100;
  
  // Beräkningsalternativ 2
  updatedData.maxInterventionCostAlt2 = 
    getValue('totalCostMentalHealthAlt2') * 
    (getValue('reducedStressPercentageAlt2') / 100);
  
  // Beräkningsalternativ 3
  updatedData.minEffectForBreakEvenAlt3 = 
    getValue('totalCostMentalHealthAlt3') === 0 
      ? 0 
      : (getValue('totalInterventionCostAlt3') / getValue('totalCostMentalHealthAlt3')) * 100;
  
  return updatedData;
};

// Uppdatera prepareDataForSave-funktionen med specifika typer
const prepareDataForSave = (data: FormJData): Record<string, unknown> => {
  // Skapa ett objekt med väldefinierade typer
  const cleanedData: Record<string, unknown> = {};
  
  // Konvertera explicit alla undefineds till null eller defaultvärden
  Object.keys(data).forEach(key => {
    const typedKey = key as keyof FormJData;
    const value = data[typedKey];
    
    if (value === undefined) {
      // För numeriska fält, använd 0 istället för null
      if (
        typedKey === 'economicBenefitAlt1' || 
        typedKey === 'economicSurplusAlt1' || 
        typedKey === 'roiPercentageAlt1' ||
        typedKey === 'maxInterventionCostAlt2' ||
        typedKey === 'minEffectForBreakEvenAlt3'
      ) {
        cleanedData[key] = 0;
      } 
      // För string-fält använd tom sträng
      else if (
        typedKey === 'organizationName' || 
        typedKey === 'contactPerson'
      ) {
        cleanedData[key] = '';
      }
      // För övriga fält (inputfält som kan vara undefined), använd null
      else {
        cleanedData[key] = null;
      }
    } 
    // Om värdet är null, behåll det som null
    else if (value === null) {
      cleanedData[key] = null;
    }
    // Annars använd värdet som det är
    else {
      cleanedData[key] = value;
    }
  });
  
  console.log('Data prepared for save:', cleanedData);
  return cleanedData;
};

const FORM_TYPE = 'J';

const FormJ = forwardRef<FormJRef, FormJProps>(function FormJ(props, ref) {
  const { currentUser } = useAuth();
  const { onNavigateToForm } = props;
  const [formData, setFormData] = useState<FormJData>({
    organizationName: '',
    contactPerson: '',
    
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
  
  // Lägg till state för att spåra automatisk datahämtning
  const [autoFetchStatus, setAutoFetchStatus] = useState({
    hasFetched: false,
    costMentalHealthAlt1: false,     // J5: Total kostnad för psykisk ohälsa (alt 1)
    interventionCostAlt1: false,     // J8: Total kostnad för insatsen (alt 1)
    costMentalHealthAlt2: false,     // J12: Total kostnad för psykisk ohälsa (alt 2)
    interventionCostAlt3: false,     // J15: Total kostnad för insatsen (alt 3)
    costMentalHealthAlt3: false,     // J16: Total kostnad för psykisk ohälsa (alt 3)
    errorMessage: null as string | null
  });
  
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
  
  // Formatera nummer med tusentalsavgränsare
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('sv-SE');
  };
  
  // Hjälpfunktion för att navigera till specifikt formulär
  const navigateToForm = (formName: string) => {
    if (onNavigateToForm) {
      onNavigateToForm(formName);
    } else {
      console.warn('Navigation callback is not provided to FormJ component');
    }
  };
  
  // Hantera ändringar i formuläret
  const handleChange = useCallback(<K extends keyof FormJData>(field: K, value: FormJData[K]) => {
    console.log(`Changing field "${String(field)}" to value:`, value);
    
    // Säkerställ att numeriska inputfält med undefined blir null (inte undefined)
    let safeValue = value;
    if (value === undefined) {
      if (
        field === 'economicBenefitAlt1' || 
        field === 'economicSurplusAlt1' || 
        field === 'roiPercentageAlt1' ||
        field === 'maxInterventionCostAlt2' ||
        field === 'minEffectForBreakEvenAlt3'
      ) {
        safeValue = 0 as unknown as FormJData[K];
      } else if (
        field === 'totalCostMentalHealthAlt1' ||
        field === 'reducedStressPercentageAlt1' ||
        field === 'totalInterventionCostAlt1' ||
        field === 'totalCostMentalHealthAlt2' ||
        field === 'reducedStressPercentageAlt2' ||
        field === 'totalInterventionCostAlt3' ||
        field === 'totalCostMentalHealthAlt3'
      ) {
        safeValue = null as unknown as FormJData[K];
      }
    }
    
    setFormData(prev => {
      const updatedData = { ...prev, [field]: safeValue };
      return calculateValues(updatedData);
    });
  }, []);
  
  // Ny useEffect för att automatiskt hämta data från Formulär C och G vid inladdning
  useEffect(() => {
    const autoFetchFromForms = async () => {
      if (autoFetchStatus.hasFetched || !currentUser?.uid) return;
      
      try {
        console.log('Starting auto-fetch from Forms C and G');
        
        // Spara aktuell status för autoFetch
        const currentStatus = { ...autoFetchStatus, hasFetched: true };
        setAutoFetchStatus(currentStatus);
        
        // Hämta data från Form C (totalCostMentalHealth)
        console.log('Fetching data from FormC...');
        const formCData = await loadFormData<FormCData>(currentUser.uid, 'C');
        
        console.log('Fetched FormC data:', formCData); // Debug log
        
        if (formCData) {
          if (formCData.totalCostMentalHealth !== undefined && formCData.totalCostMentalHealth !== null) {
            const roundedValue = Math.round(formCData.totalCostMentalHealth);
            console.log('Using totalCostMentalHealth value from FormC:', roundedValue); // Debug log
            
            // Uppdatera alla fält som använder totalCostMentalHealth
            // Vi säkerställer att vi alltid skickar ett nummer, aldrig undefined
            handleChange('totalCostMentalHealthAlt1', roundedValue);
            handleChange('totalCostMentalHealthAlt2', roundedValue);
            handleChange('totalCostMentalHealthAlt3', roundedValue);
            
            currentStatus.costMentalHealthAlt1 = true;
            currentStatus.costMentalHealthAlt2 = true;
            currentStatus.costMentalHealthAlt3 = true;
          } else {
            console.warn('totalCostMentalHealth is undefined or null in FormC data:', formCData);
          }
        } else {
          console.warn('No FormC data found');
        }
        
        // Hämta data från Form G (totalInterventionCost)
        console.log('Fetching data from FormG...');
        const formGData = await loadFormData<FormGData>(currentUser.uid, 'G');
        
        console.log('Fetched FormG data:', formGData); // Debug log
        
        if (formGData) {
          if (formGData.totalInterventionCost !== undefined && formGData.totalInterventionCost !== null) {
            const roundedValue = Math.round(formGData.totalInterventionCost);
            console.log('Using totalInterventionCost value from FormG:', roundedValue); // Debug log
            
            // Uppdatera alla fält som använder totalInterventionCost
            // Vi säkerställer att vi alltid skickar ett nummer, aldrig undefined
            handleChange('totalInterventionCostAlt1', roundedValue);
            handleChange('totalInterventionCostAlt3', roundedValue);
            
            currentStatus.interventionCostAlt1 = true;
            currentStatus.interventionCostAlt3 = true;
          } else {
            console.warn('totalInterventionCost is undefined or null in FormG data:', formGData);
          }
        } else {
          console.warn('No FormG data found');
        }
        
        console.log('Auto-fetch completed, updating status');
        setAutoFetchStatus(currentStatus);
      } catch (error) {
        console.error('Fel vid automatisk hämtning från formulär:', error);
        setAutoFetchStatus(prev => ({ 
          ...prev, 
          hasFetched: true, 
          errorMessage: 'Kunde inte automatiskt hämta data från formulär 2 och 5.' 
        }));
      }
    };
    
    autoFetchFromForms();
  }, [currentUser, autoFetchStatus, handleChange]);
  
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
  
  // Funktion för att hämta värden från andra formulär
  const fetchValueFromForm = async (formType: string, targetField: keyof FormJData, setMessage: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (!currentUser?.uid) {
      setTransferMessage('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setTransferMessage('Hämtar data...');
      
      if (formType === 'C') {
        console.log(`Manually fetching data from Form C into field ${String(targetField)}`);
        const data = await loadFormData<FormCData>(currentUser.uid, formType);
        console.log('Fetched FormC data in manual fetch:', data); // Debug log
        
        if (data) {
          if (data.totalCostMentalHealth !== undefined && data.totalCostMentalHealth !== null) {
            // Avrunda värdet till heltal för att undvika decimalproblem
            const roundedValue = Math.round(data.totalCostMentalHealth);
            console.log('Using value in manual fetch:', roundedValue, 'for field', String(targetField)); // Debug log
            
            // Uppdatera fältet, se till att vi aldrig skickar undefined utan alltid ett nummer
            handleChange(targetField, roundedValue as FormJData[keyof FormJData]);
            setMessage(`Värde hämtat från Formulär 2: ${roundedValue.toLocaleString('sv-SE')} kr`);
          } else {
            console.warn('totalCostMentalHealth is undefined or null in FormC data:', data);
            setMessage(`Inget värde för "Total kostnad för psykisk ohälsa" hittades i Formulär 2.`);
          }
        } else {
          console.warn('No data found for FormC');
          setMessage(`Inget data hittades i Formulär 2.`);
        }
      } else if (formType === 'G') {
        console.log(`Manually fetching data from Form G into field ${String(targetField)}`);
        const data = await loadFormData<FormGData>(currentUser.uid, formType);
        console.log('Fetched FormG data in manual fetch:', data); // Debug log
        
        if (data) {
          if (data.totalInterventionCost !== undefined && data.totalInterventionCost !== null) {
            // Avrunda värdet till heltal för att undvika decimalproblem
            const roundedValue = Math.round(data.totalInterventionCost);
            console.log('Using value in manual fetch:', roundedValue, 'for field', String(targetField)); // Debug log
            
            // Uppdatera fältet, se till att vi aldrig skickar undefined utan alltid ett nummer
            handleChange(targetField, roundedValue as FormJData[keyof FormJData]);
            setMessage(`Värde hämtat från Formulär 5: ${roundedValue.toLocaleString('sv-SE')} kr`);
          } else {
            console.warn('totalInterventionCost is undefined or null in FormG data:', data);
            setMessage(`Inget värde för "Total kostnad för insatsen" hittades i Formulär 5.`);
          }
        } else {
          console.warn('No data found for FormG');
          setMessage(`Inget data hittades i Formulär 5.`);
        }
      }
    } catch (error) {
      console.error(`Error fetching data from Form ${formType}:`, error);
      setMessage(`Ett fel uppstod när data skulle hämtas från Formulär ${getFormNumber(formType)}.`);
    }

    // Rensa meddelandet efter 3 sekunder (håll det lite längre om det var framgångsrikt)
    setTimeout(() => {
      console.log('Clearing fetch message');
      setMessage(null);
    }, 3000);
  };
  
  // Lägg till state för valideringsfel
  const [validationWarnings, setValidationWarnings] = useState<{
    reducedStressPercentageAlt1?: string;
    reducedStressPercentageAlt2?: string;
  }>({});
  
  // Spara data till Firebase
  const handleSave = async () => {
    if (!currentUser?.uid) {
      console.error('Cannot save form: No user logged in');
      setTransferMessage('Du måste vara inloggad för att spara data');
      return Promise.reject('Du måste vara inloggad för att spara data');
    }

    try {
      console.log('Starting save operation for FormJ');
      setTransferMessage('Sparar...');
      
      // Kontrollera efter saknade värden men tillåt fortfarande sparande
      const warnings: {
        reducedStressPercentageAlt1?: string;
        reducedStressPercentageAlt2?: string;
      } = {};
      
      if (safeFormData.totalCostMentalHealthAlt1 && safeFormData.reducedStressPercentageAlt1 === undefined) {
        warnings.reducedStressPercentageAlt1 = "Fyll i detta fält för att få korrekta beräkningar";
      }
      
      if (safeFormData.totalCostMentalHealthAlt2 && safeFormData.reducedStressPercentageAlt2 === undefined) {
        warnings.reducedStressPercentageAlt2 = "Fyll i detta fält för att få korrekta beräkningar";
      }
      
      setValidationWarnings(warnings);
      
      // Förbereda data för att undvika Firebase-fel med undefined-värden
      const dataToSave = prepareDataForSave(safeFormData);
      
      console.log('Data prepared for save:', dataToSave);
      
      // Save to Firebase
      console.log(`Saving FormJ data to Firebase for user ${currentUser.uid}`);
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave);
      console.log('FormJ data saved successfully');
      
      // Visa olika meddelanden beroende på om det finns varningar eller inte
      if (Object.keys(warnings).length > 0) {
        setTransferMessage('Formuläret sparades, men vissa värden saknas för beräkningarna');
      } else {
        setTransferMessage('Formuläret har sparats!');
      }
      
      // Rensa meddelandet efter en timeout
      setTimeout(() => {
        console.log('Clearing save message');
        setTransferMessage(null);
      }, 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving form data:', error);
      setTransferMessage('Ett fel uppstod när formuläret skulle sparas till databasen.');
      
      // Rensa felmeddelandet efter en längre timeout
      setTimeout(() => {
        console.log('Clearing error message');
        setTransferMessage(null);
      }, 5000);
      
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
  
  const [error, setError] = useState<string | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  const [orgData, setOrgData] = useState<{ organizationName: string; contactPerson: string; startDate?: string; endDate?: string } | null>(null);
  
  // Lägg till hook för att hålla reda på när innehållet är redo
  useEffect(() => {
    // När data har laddats, sätt isContentReady till true
    if (!isDataLoading && !isOrgInfoLoading) {
      setIsContentReady(true);
    }
  }, [isDataLoading, isOrgInfoLoading]);
  
  // Uppdatera den befintliga datahämtningen
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormJData>(currentUser.uid, FORM_TYPE);
          // Använd den befintliga logiken för datahämtning här
          if (data) {
            // Befintlig datahämtningslogik...
            setFormData(data);
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
          setError('Kunde inte ladda data från databasen.');
        } finally {
          setIsDataLoading(false);
        }
      } else {
        setIsDataLoading(false);
      }
    };

    loadFromFirebase();
  }, [currentUser]);
  
  // Callback för OrganizationHeader
  const handleOrgLoadingChange = (isLoading: boolean) => {
    setIsOrgInfoLoading(isLoading);
  };
  
  // FormInfo-komponenten för att visa information om formuläret
  const FormInfo = () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-semibold mb-2">Formulär 8 – Return on investment (ROI)</h3>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Detta formulär sammanställer alla kostnader och beräknar avkastningen på investeringen (ROI).
        Här kan du se hur mycket ekonomisk nytta insatserna ger, baserat på minskad stress och 
        sjukfrånvaro. Formuläret presenterar tre olika beräkningsalternativ beroende på vilken information du har tillgänglig.
      </p>
    </div>
  );
  
  // Huvudinnehåll
  return (
    <div className="space-y-6">
      {/* Dold OrganizationHeader för att enbart ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={handleOrgLoadingChange} 
          onDataLoaded={setOrgData}
        />
      </div>
      
      <FadeIn show={isContentReady} duration={500}>
        {/* Lägg till FormInfo-komponenten först av allt */}
        <FormInfo />
        
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
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">8 – Return on investment</h2>
            </div>
          </div>
          
          {/* Visa meddelande om automatisk hämtning av data */}
          {autoFetchStatus.hasFetched && (
            autoFetchStatus.costMentalHealthAlt1 || 
            autoFetchStatus.interventionCostAlt1 || 
            autoFetchStatus.costMentalHealthAlt2 || 
            autoFetchStatus.interventionCostAlt3 || 
            autoFetchStatus.costMentalHealthAlt3
          ) && (
            <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
              <p className="font-medium">Följande data har automatiskt hämtats:</p>
              <ul className="list-disc list-inside mt-1">
                {(autoFetchStatus.costMentalHealthAlt1 || 
                  autoFetchStatus.costMentalHealthAlt2 || 
                  autoFetchStatus.costMentalHealthAlt3) && 
                    <li>Total kostnad för psykisk ohälsa från Formulär 2</li>
                }
                {(autoFetchStatus.interventionCostAlt1 || 
                  autoFetchStatus.interventionCostAlt3) && 
                    <li>Total kostnad för insatsen från Formulär 5</li>
                }
              </ul>
            </div>
          )}
          
          {autoFetchStatus.errorMessage && (
            <div className="p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm mb-4">
              {autoFetchStatus.errorMessage}
            </div>
          )}
          
          {error && (
            <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm mb-4">
              {error}
            </div>
          )}
          
          {/* Beräkningsalternativ 1 */}
          <div className="form-card">
            <SectionHeader 
              title="Beräkningsalternativ 1" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            <div className="text-sm text-muted-foreground mb-4">
              Investeringen är känd, effekten är känd
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total kostnad för psykisk ohälsa, kr per år</label>
                  <InfoLabel text="Detta fält hämtas automatiskt från formulär 2" />
                  {autoFetchStatus.costMentalHealthAlt1 ? (
                    <AutoFilledField
                      value={`${formatNumber(safeFormData.totalCostMentalHealthAlt1 || 0)} kr`}
                      sourceFormName="C"
                      onNavigate={navigateToForm}
                      isEmpty={!safeFormData.totalCostMentalHealthAlt1}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minskad andel av personal med hög stressnivå</label>
                  <div className="flex items-center gap-2">
                    <FormattedNumberInput
                      value={safeFormData.reducedStressPercentageAlt1}
                      onChange={(value) => handleChange('reducedStressPercentageAlt1', value)}
                      allowDecimals={true}
                      placeholder="0"
                      className={`bg-background/50 ${validationWarnings.reducedStressPercentageAlt1 ? 'border-amber-400' : ''}`}
                    />
                    <span className="text-sm">%</span>
                  </div>
                  {validationWarnings.reducedStressPercentageAlt1 && (
                    <p className="text-amber-500 text-xs mt-1">{validationWarnings.reducedStressPercentageAlt1}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-dashed">
                <label className="text-sm font-medium">Ekonomisk nytta av insatsen, kr per år</label>
                <div className="text-xl font-semibold">
                  {formatCurrency(safeFormData.economicBenefitAlt1)}
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total kostnad för insatsen, kr</label>
                  <InfoLabel text="Detta fält hämtas automatiskt från formulär 5" />
                  {autoFetchStatus.interventionCostAlt1 ? (
                    <AutoFilledField
                      value={`${formatNumber(safeFormData.totalInterventionCostAlt1 || 0)} kr`}
                      sourceFormName="G"
                      onNavigate={navigateToForm}
                      isEmpty={!safeFormData.totalInterventionCostAlt1}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-dashed">
                <label className="text-sm font-medium">Ekonomiskt överskott av insatsen (kr)</label>
                <div className="text-xl font-semibold">
                  {formatCurrency(safeFormData.economicSurplusAlt1)}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-dashed border-t border-b">
                <label className="text-sm font-medium">Total kostnad för insatsen, kr</label>
                <div className="text-xl font-semibold">
                  {formatCurrency(safeFormData.totalInterventionCostAlt1 || 0)}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 bg-primary/5 rounded-md px-3">
                <label className="text-base font-bold">Return on investment (ROI), %, alt 1.</label>
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
                  <label className="text-sm font-medium">Total kostnad för psykisk ohälsa, kr per år</label>
                  <InfoLabel text="Detta fält hämtas automatiskt från formulär 2" />
                  {autoFetchStatus.costMentalHealthAlt2 ? (
                    <AutoFilledField
                      value={`${formatNumber(safeFormData.totalCostMentalHealthAlt2 || 0)} kr`}
                      sourceFormName="C"
                      onNavigate={navigateToForm}
                      isEmpty={!safeFormData.totalCostMentalHealthAlt2}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minskad andel av personal med hög stressnivå</label>
                  <div className="flex items-center gap-2">
                    <FormattedNumberInput
                      value={safeFormData.reducedStressPercentageAlt2}
                      onChange={(value) => handleChange('reducedStressPercentageAlt2', value)}
                      allowDecimals={true}
                      placeholder="0"
                      className={`bg-background/50 ${validationWarnings.reducedStressPercentageAlt2 ? 'border-amber-400' : ''}`}
                    />
                    <span className="text-sm">%</span>
                  </div>
                  {validationWarnings.reducedStressPercentageAlt2 && (
                    <p className="text-amber-500 text-xs mt-1">{validationWarnings.reducedStressPercentageAlt2}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 bg-primary/5 rounded-md px-3">
                <label className="text-base font-bold">Maximal kostnad för insatsen, alt 2.</label>
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
                  <label className="text-sm font-medium">Total kostnad för insatsen, kr</label>
                  <InfoLabel text="Detta fält hämtas automatiskt från formulär 5" />
                  {autoFetchStatus.interventionCostAlt3 ? (
                    <AutoFilledField
                      value={`${formatNumber(safeFormData.totalInterventionCostAlt3 || 0)} kr`}
                      sourceFormName="G"
                      onNavigate={navigateToForm}
                      isEmpty={!safeFormData.totalInterventionCostAlt3}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total kostnad för psykisk ohälsa, kr per år</label>
                  <InfoLabel text="Detta fält hämtas automatiskt från formulär 2" />
                  {autoFetchStatus.costMentalHealthAlt3 ? (
                    <AutoFilledField
                      value={`${formatNumber(safeFormData.totalCostMentalHealthAlt3 || 0)} kr`}
                      sourceFormName="C"
                      onNavigate={navigateToForm}
                      isEmpty={!safeFormData.totalCostMentalHealthAlt3}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 bg-primary/5 rounded-md px-3">
                <label className="text-base font-bold">Minskad andel av personal med hög stressnivå för break even, %, alt 3.</label>
                <div className="text-2xl font-bold text-primary">
                  {formatPercentage(safeFormData.minEffectForBreakEvenAlt3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

export default FormJ; 