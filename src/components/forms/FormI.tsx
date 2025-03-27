import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Download, Calculator, FileBarChart2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharedFieldsButton } from '@/components/ui/shared-fields-button';
import { updateFormWithSharedFields } from '@/lib/utils/updateFormFields';
import { SharedFields } from '@/lib/firebase/sharedFields';

// Typer för Form G data
interface FormGInterventionCost {
  id: string;
  name: string;
  externalCost: number | null;
  internalCost: number | null;
}

interface FormGIntervention {
  id: string;
  name: string;
  description: string;
  costs: FormGInterventionCost[];
  totalExternalCost: number;
  totalInternalCost: number;
  totalCost: number;
}

interface FormGData {
  interventions: FormGIntervention[];
}

// Typ för en kostnadskategori (personal, chef, administration)
interface CostCategory {
  minutesSpent: number | null;
  divisor: number;
  hoursSpent: number;
  employeeCount: number | null;
  totalHours: number;
  hourlyCost: number | null;
  totalCost: number;
}

// Typ för ett insats-objekt
interface InternalCost {
  id: string;
  interventionName: string; // Insatsnamn från Form G
  subInterventionName: string; // Delinsats från Form G
  staff: CostCategory; // Personal (I4-I10)
  managers: CostCategory; // Chefer (I11-I17)
  administration: CostCategory; // Administration (I18-I24)
  totalHours: number; // I25
  totalCost: number; // I26
}

// Typ för formulärdatan
interface FormIData {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
  internalCosts: InternalCost[];
  totalInternalCost: number;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormIRef {
  handleSave: () => Promise<void>;
}

// Lägg till InfoLabel-komponenten
const InfoLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Info className="h-3 w-3" />
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
  value: string | number; 
  info: string;
  highlight?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    <InfoLabel text={info} />
    <div className={`p-2 ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-background'} border rounded-md flex justify-end shadow-sm`}>
      <span className={`font-semibold ${highlight ? 'text-primary' : ''}`}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </span>
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

// Generera ett unikt ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Konvertera null till undefined för FormattedNumberInput
const nullToUndefined = (value: number | null): number | undefined => {
  return value === null ? undefined : value;
};

const FORM_TYPE = 'I';

// Komponent för att visa och redigera en kostnadssektion (Personal, Chefer, Administration)
const CostCategorySection = ({
  title,
  category,
  onChange,
  indexLabels,
  helpTexts
}: {
  title: string;
  category: CostCategory;
  onChange: (updatedCategory: CostCategory) => void;
  indexLabels: { [key: string]: string };
  helpTexts: { [key: string]: string };
}) => {
  // Beräkna timmar när minuter ändras
  const updateMinutes = (minutes: number | null) => {
    const hoursSpent = minutes !== null ? minutes / category.divisor : 0;
    const totalHours = hoursSpent * (category.employeeCount || 0);
    const totalCost = totalHours * (category.hourlyCost || 0);
    
    onChange({
      ...category,
      minutesSpent: minutes,
      hoursSpent,
      totalHours,
      totalCost
    });
  };
  
  // Uppdatera antal anställda
  const updateEmployeeCount = (count: number | null) => {
    const totalHours = category.hoursSpent * (count || 0);
    const totalCost = totalHours * (category.hourlyCost || 0);
    
    onChange({
      ...category,
      employeeCount: count,
      totalHours,
      totalCost
    });
  };
  
  // Uppdatera timkostnad
  const updateHourlyCost = (cost: number | null) => {
    const totalCost = category.totalHours * (cost || 0);
    
    onChange({
      ...category,
      hourlyCost: cost,
      totalCost
    });
  };
  
  return (
    <div className="border p-4 rounded-md mb-4">
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tidsåtgång i minuter */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.minutesSpent}</label>
          <InfoLabel text={helpTexts.minutesSpent} />
          <FormattedNumberInput
            value={nullToUndefined(category.minutesSpent)}
            onChange={(value) => updateMinutes(value === undefined ? null : value)}
            placeholder="0"
            className="text-sm"
          />
        </div>
        
        {/* Divisor (fast värde 60) */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.divisor}</label>
          <InfoLabel text={helpTexts.divisor} />
          <Input
            value={category.divisor.toString()}
            disabled
            className="text-sm bg-muted/30"
          />
        </div>
        
        {/* Tidsåtgång i timmar (beräknat värde) */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.hoursSpent}</label>
          <InfoLabel text={helpTexts.hoursSpent} />
          <Input
            value={category.hoursSpent.toFixed(2)}
            disabled
            className="text-sm bg-muted/30"
          />
        </div>
        
        {/* Antal anställda */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.employeeCount}</label>
          <InfoLabel text={helpTexts.employeeCount} />
          <FormattedNumberInput
            value={nullToUndefined(category.employeeCount)}
            onChange={(value) => updateEmployeeCount(value === undefined ? null : value)}
            placeholder="0"
            className="text-sm"
          />
        </div>
        
        {/* Total tidsåtgång (beräknat värde) */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.totalHours}</label>
          <InfoLabel text={helpTexts.totalHours} />
          <Input
            value={category.totalHours.toFixed(2)}
            disabled
            className="text-sm bg-muted/30"
          />
        </div>
        
        {/* Kostnad per timme */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.hourlyCost}</label>
          <InfoLabel text={helpTexts.hourlyCost} />
          <FormattedNumberInput
            value={nullToUndefined(category.hourlyCost)}
            onChange={(value) => updateHourlyCost(value === undefined ? null : value)}
            placeholder="0 kr"
            className="text-sm"
          />
        </div>
        
        {/* Total kostnad (beräknat värde) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-background/50 p-3 rounded-md mt-2 border">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">{indexLabels.totalCost}</label>
            <span className="font-semibold">{formatCurrency(category.totalCost)}</span>
          </div>
          <InfoLabel text={helpTexts.totalCost} />
        </div>
      </div>
    </div>
  );
};

// Knapp för att hämta insatser från Form G
const FetchFromFormGButton = ({ 
  onClick, 
  disabled,
  message 
}: { 
  onClick: () => void;
  disabled?: boolean;
  message?: string | null;
}) => (
  <div className="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Hämta från Formulär G
    </Button>
    {message && (
      <span className={`text-sm ${message.includes('Inget') || message.includes('redan') ? 'text-amber-500' : 'text-green-500'}`}>
        {message}
      </span>
    )}
  </div>
);

// Komponent för ett internt kostnadskort (en insats med dess kostnader)
const InternalCostCard = ({
  internalCost,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: {
  internalCost: InternalCost;
  index: number;
  onChange: (updatedInternalCost: InternalCost) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  // Hjälptexter och fältetiketter för personal
  const staffLabels = {
    minutesSpent: "I4 – Tidsåtgång insats i minuter",
    divisor: "I5 – Divisor för konvertering",
    hoursSpent: "I6 – Tidsåtgång i timmar",
    employeeCount: "I7 – Antal anställda medverkande",
    totalHours: "I8 – Total tidsåtgång i timmar",
    hourlyCost: "I9 – Genomsnittlig personalkostnad",
    totalCost: "I10 – Summa insats, värde av arbete"
  };
  
  const staffHelpTexts = {
    minutesSpent: "Ange hur många minuter insatsen tar per anställd",
    divisor: "Fast värde för konvertering från minuter till timmar",
    hoursSpent: "Beräknad tid i timmar (minuter / 60)",
    employeeCount: "Ange hur många anställda som deltar i insatsen",
    totalHours: "Beräknad total tidsåtgång (timmar × antal anställda)",
    hourlyCost: "Genomsnittlig kostnad per timme för personalen",
    totalCost: "Beräknad total kostnad för personalens arbete"
  };
  
  // Hjälptexter och fältetiketter för chefer
  const managerLabels = {
    minutesSpent: "I11 – Tidsåtgång insats i minuter",
    divisor: "I12 – Divisor för konvertering",
    hoursSpent: "I13 – Tidsåtgång i timmar",
    employeeCount: "I14 – Antal anställda medverkande",
    totalHours: "I15 – Total tidsåtgång i timmar",
    hourlyCost: "I16 – Genomsnittlig personalkostnad chefer",
    totalCost: "I17 – Summa insats, värde av arbete"
  };
  
  const managerHelpTexts = {
    minutesSpent: "Ange hur många minuter insatsen tar per chef",
    divisor: "Fast värde för konvertering från minuter till timmar",
    hoursSpent: "Beräknad tid i timmar (minuter / 60)",
    employeeCount: "Ange hur många chefer som deltar i insatsen",
    totalHours: "Beräknad total tidsåtgång (timmar × antal chefer)",
    hourlyCost: "Genomsnittlig kostnad per timme för chefer",
    totalCost: "Beräknad total kostnad för chefernas arbete"
  };
  
  // Hjälptexter och fältetiketter för administration
  const adminLabels = {
    minutesSpent: "I18 – Tidsåtgång insats i minuter",
    divisor: "I19 – Divisor för konvertering",
    hoursSpent: "I20 – Tidsåtgång i timmar",
    employeeCount: "I21 – Antal anställda medverkande",
    totalHours: "I22 – Total tidsåtgång i timmar",
    hourlyCost: "I23 – Genomsnittlig personalkostnad",
    totalCost: "I24 – Summa insats, värde av arbete"
  };
  
  const adminHelpTexts = {
    minutesSpent: "Ange hur många minuter insatsen tar per administratör",
    divisor: "Fast värde för konvertering från minuter till timmar",
    hoursSpent: "Beräknad tid i timmar (minuter / 60)",
    employeeCount: "Ange hur många administratörer som deltar i insatsen",
    totalHours: "Beräknad total tidsåtgång (timmar × antal administratörer)",
    hourlyCost: "Genomsnittlig kostnad per timme för administratörer",
    totalCost: "Beräknad total kostnad för administratörernas arbete"
  };
  
  // Uppdatera personal-kategori
  const updateStaffCategory = (updatedCategory: CostCategory) => {
    onChange({
      ...internalCost,
      staff: updatedCategory
    });
  };
  
  // Uppdatera chef-kategori
  const updateManagerCategory = (updatedCategory: CostCategory) => {
    onChange({
      ...internalCost,
      managers: updatedCategory
    });
  };
  
  // Uppdatera administrations-kategori
  const updateAdminCategory = (updatedCategory: CostCategory) => {
    onChange({
      ...internalCost,
      administration: updatedCategory
    });
  };
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-primary font-bold">{index + 1}</span>
          </div>
          <div>
            <h4 className="font-medium">Insats: {internalCost.interventionName}</h4>
            <p className="text-sm text-muted-foreground">Delinsats: {internalCost.subInterventionName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            disabled={isFirst}
            onClick={onMoveUp}
            className="h-8 w-8"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            disabled={isLast}
            onClick={onMoveDown}
            className="h-8 w-8"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            onClick={onRemove}
            className="h-8 w-8 text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="staff">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="staff" className="flex-1">Personal (I4-I10)</TabsTrigger>
          <TabsTrigger value="managers" className="flex-1">Chefer (I11-I17)</TabsTrigger>
          <TabsTrigger value="admin" className="flex-1">Administration (I18-I24)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="staff" className="space-y-4">
          <CostCategorySection 
            title="Personal (I4-I10)"
            category={internalCost.staff}
            onChange={updateStaffCategory}
            indexLabels={staffLabels}
            helpTexts={staffHelpTexts}
          />
        </TabsContent>
        
        <TabsContent value="managers" className="space-y-4">
          <CostCategorySection 
            title="Chefer (I11-I17)"
            category={internalCost.managers}
            onChange={updateManagerCategory}
            indexLabels={managerLabels}
            helpTexts={managerHelpTexts}
          />
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-4">
          <CostCategorySection 
            title="Administration (I18-I24)"
            category={internalCost.administration}
            onChange={updateAdminCategory}
            indexLabels={adminLabels}
            helpTexts={adminHelpTexts}
          />
        </TabsContent>
      </Tabs>
      
      {/* Totalsummor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <ReadOnlyField 
          label="I25 – Total tidsåtgång insats"
          value={`${internalCost.totalHours.toFixed(2)} timmar`}
          info="Summa av alla timmars tidsåtgång"
        />
        <ReadOnlyField 
          label="I26 – Total arbetskostnad insats"
          value={internalCost.totalCost}
          info="Summa av alla arbetskostnader"
          highlight={true}
        />
      </div>
    </div>
  );
};

// Definiera typen för FormI props
type FormIProps = React.ComponentProps<'div'>;

// Skapa huvudkomponenten som en forwardRef för att exponera metoder till föräldrakomponenten
const FormI = forwardRef<FormIRef, FormIProps>(function FormI(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormIData>({
    organizationName: '',
    contactPerson: '',
    timePeriod: '',
    internalCosts: [],
    totalInternalCost: 0
  });
  
  // Säkerställ att internalCosts alltid finns
  const safeFormData = useMemo(() => {
    return {
      ...formData,
      internalCosts: formData.internalCosts || []
    };
  }, [formData]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchMessageFormG, setFetchMessageFormG] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hjälpfunktion för att skapa en tom kostnadskategori
  const createEmptyCostCategory = (): CostCategory => ({
    minutesSpent: null,
    divisor: 60,
    hoursSpent: 0,
    employeeCount: null,
    totalHours: 0,
    hourlyCost: null,
    totalCost: 0
  });

  // Hjälpfunktion för att skapa ett tomt internt kostnadsobjekt
  const createEmptyInternalCost = (interventionName: string, subInterventionName: string): InternalCost => {
    const staff = createEmptyCostCategory();
    const managers = createEmptyCostCategory();
    const administration = createEmptyCostCategory();
    
    return {
      id: generateId(),
      interventionName,
      subInterventionName,
      staff,
      managers,
      administration,
      totalHours: 0,
      totalCost: 0
    };
  };

  // Skapa en memoized-dependency för att uppdatera beräkningar när kostnader ändras
  const costsDependency = useMemo(() => {
    return safeFormData.internalCosts
      .map(cost => 
        `${cost.id}:${cost.staff.totalCost}:${cost.managers.totalCost}:${cost.administration.totalCost}`
      )
      .join('|');
  }, [safeFormData.internalCosts]);

  // Ladda data från Firebase vid montering
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setError(null);
          const data = await loadFormData<FormIData>(currentUser.uid, FORM_TYPE);
          if (data) {
            // Säkerställ att data har rätt struktur
            const sanitizedData: FormIData = {
              ...data,
              internalCosts: (data.internalCosts || []).map(cost => ({
                ...cost,
                staff: cost.staff || createEmptyCostCategory(),
                managers: cost.managers || createEmptyCostCategory(),
                administration: cost.administration || createEmptyCostCategory(),
                totalHours: cost.totalHours || 0,
                totalCost: cost.totalCost || 0
              }))
            };
            
            setFormData(sanitizedData);
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
          setError('Kunde inte ladda data från databasen.');
        }
      }
    };

    loadFromFirebase();
  }, [currentUser]);

  // Uppdatera totalsummor när en kostnad ändras
  useEffect(() => {
    if (safeFormData.internalCosts.length === 0) return;
    
    // Kontrollera om någon av kostnaderna har ändrats för att undvika onödiga uppdateringar
    let hasChanges = false;
    
    const updatedInternalCosts = safeFormData.internalCosts.map(cost => {
      // Beräkna total tidsåtgång för denna insats
      const totalHours = 
        cost.staff.totalHours + 
        cost.managers.totalHours + 
        cost.administration.totalHours;
      
      // Beräkna total kostnad för denna insats
      const totalCost = 
        cost.staff.totalCost + 
        cost.managers.totalCost + 
        cost.administration.totalCost;
      
      // Kontrollera om något har ändrats
      if (totalHours !== cost.totalHours || totalCost !== cost.totalCost) {
        hasChanges = true;
        return { ...cost, totalHours, totalCost };
      }
      
      return cost;
    });
    
    // Avbryt om inget har ändrats för att undvika onödig uppdatering
    if (!hasChanges) return;
    
    // Beräkna den totala interna kostnaden
    const totalInternalCost = updatedInternalCosts.reduce(
      (sum, cost) => sum + cost.totalCost, 
      0
    );
    
    setFormData(prev => ({
      ...prev,
      internalCosts: updatedInternalCosts,
      totalInternalCost
    }));
  }, [costsDependency, safeFormData.internalCosts]);

  // Sätt upp autosave när formulärdata ändras
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (currentUser?.uid) {
      // Förbereda data för att undvika Firebase-fel med undefined-värden
      const dataToSave = prepareDataForSave(safeFormData);
      
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        dataToSave,
        setIsSaving,
        setSaveMessage
      );
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, currentUser, safeFormData, safeFormData.internalCosts]);

  // Exponera handleSave till föräldrakomponenten via ref
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      await handleSave();
    }
  }));

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormIData): Record<string, unknown> => {
    const preparedData: Record<string, unknown> = {
      organizationName: data.organizationName || '',
      contactPerson: data.contactPerson || '',
      timePeriod: data.timePeriod || '',
      totalInternalCost: data.totalInternalCost || 0
    };
    
    // Hantera interna kostnader
    preparedData.internalCosts = (data.internalCosts || []).map(cost => {
      const prepareCategory = (category: CostCategory): CostCategory => ({
        minutesSpent: category.minutesSpent === undefined ? null : category.minutesSpent,
        divisor: category.divisor || 60,
        hoursSpent: category.hoursSpent || 0,
        employeeCount: category.employeeCount === undefined ? null : category.employeeCount,
        totalHours: category.totalHours || 0,
        hourlyCost: category.hourlyCost === undefined ? null : category.hourlyCost,
        totalCost: category.totalCost || 0
      });
      
      return {
        id: cost.id,
        interventionName: cost.interventionName || '',
        subInterventionName: cost.subInterventionName || '',
        staff: prepareCategory(cost.staff),
        managers: prepareCategory(cost.managers),
        administration: prepareCategory(cost.administration),
        totalHours: cost.totalHours || 0,
        totalCost: cost.totalCost || 0
      };
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
      const dataToSave = prepareDataForSave(safeFormData);
      
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

  const handleChange = (field: keyof FormIData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Säkerställ att e-parameter har korrekt typ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange(name as keyof FormIData, value);
  };

  // Uppdatera en intern kostnad
  const updateInternalCost = (updatedCost: InternalCost) => {
    const updatedCosts = safeFormData.internalCosts.map(cost => 
      cost.id === updatedCost.id ? updatedCost : cost
    );
    
    setFormData(prev => ({
      ...prev,
      internalCosts: updatedCosts
    }));
  };

  // Ta bort en intern kostnad
  const removeInternalCost = (costId: string) => {
    const updatedCosts = safeFormData.internalCosts.filter(cost => cost.id !== costId);
    
    setFormData(prev => ({
      ...prev,
      internalCosts: updatedCosts
    }));
  };

  // Flytta en intern kostnad uppåt
  const moveInternalCostUp = (index: number) => {
    if (index <= 0) return;
    
    const updatedCosts = [...safeFormData.internalCosts];
    const temp = updatedCosts[index];
    updatedCosts[index] = updatedCosts[index - 1];
    updatedCosts[index - 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      internalCosts: updatedCosts
    }));
  };

  // Flytta en intern kostnad nedåt
  const moveInternalCostDown = (index: number) => {
    if (index >= safeFormData.internalCosts.length - 1) return;
    
    const updatedCosts = [...safeFormData.internalCosts];
    const temp = updatedCosts[index];
    updatedCosts[index] = updatedCosts[index + 1];
    updatedCosts[index + 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      internalCosts: updatedCosts
    }));
  };

  // Rensa fetchMessage efter en viss tid
  useEffect(() => {
    if (fetchMessageFormG) {
      const timer = setTimeout(() => {
        setFetchMessageFormG(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageFormG]);

  // Funktion för att hämta insatser från Form G
  const fetchInterventionsFromFormG = async () => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setError(null);
      const formGData = await loadFormData<FormGData>(currentUser.uid, 'G');
      
      if (!formGData || !formGData.interventions || formGData.interventions.length === 0) {
        setFetchMessageFormG('Inga insatser hittades i Formulär G.');
        return;
      }

      // Samla alla insatser och delinsatser från G
      const interventionsFromG: Array<{
        interventionName: string;
        subInterventionName: string;
      }> = [];
      
      // Extrahera alla insatser och delinsatser från G
      formGData.interventions.forEach(intervention => {
        if (intervention.costs && intervention.costs.length > 0) {
          intervention.costs.forEach(cost => {
            interventionsFromG.push({
              interventionName: intervention.name,
              subInterventionName: cost.name
            });
          });
        }
      });
      
      if (interventionsFromG.length === 0) {
        setFetchMessageFormG('Inga delinsatser hittades i Formulär G.');
        return;
      }
      
      // Kontrollera vilka insatser som redan finns i Form I
      const existingInterventions = new Set<string>();
      safeFormData.internalCosts.forEach(cost => {
        const key = `${cost.interventionName}:${cost.subInterventionName}`;
        existingInterventions.add(key);
      });
      
      // Hitta nya insatser som inte redan finns i Form I
      const newInterventions = interventionsFromG.filter(({ interventionName, subInterventionName }) => {
        const key = `${interventionName}:${subInterventionName}`;
        return !existingInterventions.has(key);
      });
      
      if (newInterventions.length === 0) {
        setFetchMessageFormG('Alla insatser från Formulär G har redan hämtats.');
        return;
      }
      
      // Skapa nya interna kostnader för de nya insatserna
      const newInternalCosts = newInterventions.map(({ interventionName, subInterventionName }) => 
        createEmptyInternalCost(interventionName, subInterventionName)
      );
      
      // Uppdatera formulärdata med nya interna kostnader
      setFormData(prev => ({
        ...prev,
        internalCosts: [...safeFormData.internalCosts, ...newInternalCosts]
      }));
      
      setFetchMessageFormG(`${newInternalCosts.length} nya delinsatser hämtade från Formulär G.`);
    } catch (error) {
      console.error('Error fetching data from Form G:', error);
      setError('Kunde inte hämta data från Formulär G.');
    }
  };

  // Gruppera insatser efter insatsnamn för att skapa flikkategorierna
  const groupedInterventions = useMemo(() => {
    if (safeFormData.internalCosts.length === 0) return new Map<string, InternalCost[]>();
    
    const grouped = new Map<string, InternalCost[]>();
    
    safeFormData.internalCosts.forEach(cost => {
      if (!grouped.has(cost.interventionName)) {
        grouped.set(cost.interventionName, []);
      }
      
      const costs = grouped.get(cost.interventionName) || [];
      costs.push(cost);
      grouped.set(cost.interventionName, costs);
    });
    
    return grouped;
  }, [safeFormData.internalCosts]);

  // Lista med alla unika insatsnamn (för flikkategorier)
  const interventionCategories = useMemo(() => {
    return Array.from(groupedInterventions.keys());
  }, [groupedInterventions]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <FileBarChart2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">I – Interna kostnader för insats</h2>
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
        
        {/* Grundinformation */}
        <div className="form-card">
          <SectionHeader 
            title="Grundinformation" 
            icon={<Info className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">I1: Organisationens namn</label>
              <InfoLabel text="Namnet på din organisation" />
              <Input
                name="organizationName"
                value={safeFormData.organizationName || ''}
                onChange={handleInputChange}
                placeholder="Ange organisationens namn"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">I2: Kontaktperson</label>
              <InfoLabel text="Namn på kontaktperson" />
              <Input
                name="contactPerson"
                value={safeFormData.contactPerson || ''}
                onChange={handleInputChange}
                placeholder="Ange kontaktperson"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">I3: Tidsperiod</label>
              <InfoLabel text="Ange tidsperiod i formatet ÅÅÅÅ-MM-DD - ÅÅÅÅ-MM-DD" />
              <Input
                name="timePeriod"
                value={safeFormData.timePeriod || ''}
                onChange={handleInputChange}
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
        
        {/* Interna kostnader */}
        <div className="form-card">
          <div className="flex justify-between items-center mb-4">
            <SectionHeader 
              title="Interna kostnader" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            <FetchFromFormGButton 
              onClick={fetchInterventionsFromFormG}
              disabled={!currentUser?.uid}
              message={fetchMessageFormG}
            />
          </div>
          
          {safeFormData.internalCosts.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-primary/20 rounded-md">
              <p className="text-muted-foreground mb-4">
                Det finns inga interna kostnader att visa. Klicka på &quot;Hämta från Formulär G&quot; för att komma igång.
              </p>
              <Button 
                type="button" 
                variant="default" 
                className="gap-2"
                onClick={fetchInterventionsFromFormG}
                disabled={!currentUser?.uid}
              >
                <Download className="h-4 w-4" />
                Hämta från Formulär G
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Första nivån av flikar: Insatser */}
              <Tabs defaultValue={interventionCategories[0]} className="w-full">
                <TabsList className="mb-4 flex flex-wrap">
                  {interventionCategories.map((category, index) => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="flex-grow"
                    >
                      <div className="truncate max-w-[200px]">
                        <span className="font-medium">{index + 1}. </span>
                        <span className="text-sm">{category}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* För varje insats, visa en grupp av delinsatser */}
                {interventionCategories.map((category) => {
                  const costsInCategory = groupedInterventions.get(category) || [];
                  
                  return (
                    <TabsContent key={category} value={category}>
                      {/* Andra nivån av flikar: Delinsatser inom den valda insatsen */}
                      <Tabs defaultValue={costsInCategory[0]?.id} className="w-full">
                        <TabsList className="mb-4 flex flex-wrap">
                          {costsInCategory.map((cost, index) => (
                            <TabsTrigger 
                              key={cost.id} 
                              value={cost.id}
                              className="flex-grow"
                            >
                              <div className="truncate max-w-[200px]">
                                <span className="font-medium">{index + 1}. </span>
                                <span className="text-sm">{cost.subInterventionName}</span>
                              </div>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {/* Visa detaljer för den valda delinsatsen */}
                        {costsInCategory.map((internalCost) => {
                          // Hitta index i den övergripande listan för att kunna navigera uppåt/nedåt
                          const overallIndex = safeFormData.internalCosts.findIndex(c => c.id === internalCost.id);
                          
                          return (
                            <TabsContent key={internalCost.id} value={internalCost.id}>
                              <InternalCostCard
                                internalCost={internalCost}
                                index={overallIndex}
                                onChange={updateInternalCost}
                                onRemove={() => removeInternalCost(internalCost.id)}
                                onMoveUp={() => moveInternalCostUp(overallIndex)}
                                onMoveDown={() => moveInternalCostDown(overallIndex)}
                                isFirst={overallIndex === 0}
                                isLast={overallIndex === safeFormData.internalCosts.length - 1}
                              />
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                      
                      {/* Summering för denna insatskategori */}
                      <div className="mt-6 p-4 border rounded-md bg-primary/5">
                        <h4 className="font-medium mb-2">Summering för insats: {category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ReadOnlyField 
                            label="Total tidsåtgång för denna insats"
                            value={`${costsInCategory.reduce((sum, cost) => sum + cost.totalHours, 0).toFixed(2)} timmar`}
                            info="Summa av alla delinsatsers tidsåtgång"
                          />
                          <ReadOnlyField 
                            label="Total intern kostnad för denna insats"
                            value={costsInCategory.reduce((sum, cost) => sum + cost.totalCost, 0)}
                            info="Summa av alla delinsatsers interna kostnader"
                            highlight={true}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
              
              {/* Total summering för alla insatser */}
              <div className="mt-6 p-4 border rounded-md bg-primary/5">
                <h4 className="font-medium mb-3">Total summering för alla insatser</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField 
                    label="Total tidsåtgång för alla insatser"
                    value={`${safeFormData.internalCosts.reduce((sum, cost) => sum + cost.totalHours, 0).toFixed(2)} timmar`}
                    info="Summa av alla insatsers tidsåtgång"
                  />
                  <ReadOnlyField 
                    label="Total intern kostnad"
                    value={safeFormData.totalInternalCost}
                    info="Summa av alla interna kostnader"
                    highlight={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FormI; 