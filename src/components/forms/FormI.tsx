import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Download, Calculator, X, ArrowUp, ArrowDown, Calculator as CalculatorIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { getInterventionColor } from '@/lib/utils/interventionColors';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

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
    <div className={`p-2 ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-background'} border border-dashed border-muted-foreground/40 rounded-md flex justify-between shadow-sm`}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CalculatorIcon className="w-3 h-3" />
        <span>Auto</span>
      </div>
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
  category,
  onChange,
  indexLabels,
  helpTexts
}: {
  title?: string;
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tidsåtgång i minuter */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.minutesSpent}</label>
          <InfoLabel text={helpTexts.minutesSpent} />
          <FormattedNumberInput
            value={nullToUndefined(category.minutesSpent)}
            onChange={(value) => updateMinutes(value === undefined ? null : value)}
            placeholder="0"
            className="text-sm bg-white dark:bg-slate-800"
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
            className="text-sm bg-white dark:bg-slate-800"
          />
        </div>
        
        {/* Kostnad per timme */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{indexLabels.hourlyCost}</label>
          <InfoLabel text={helpTexts.hourlyCost} />
          <FormattedNumberInput
            value={nullToUndefined(category.hourlyCost)}
            onChange={(value) => updateHourlyCost(value === undefined ? null : value)}
            placeholder="0 kr/timme"
            className="text-sm bg-white dark:bg-slate-800"
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
      </div>
      
      {/* Total kostnad (beräknat värde) */}
      <div className="bg-background/50 p-2 rounded-md border border-border mt-2">
        <div className="flex justify-between items-center">
          <div>
            <label className="text-sm font-medium">{indexLabels.totalCost}</label>
            <InfoLabel text={helpTexts.totalCost} />
          </div>
          <span className="font-semibold text-primary">{formatCurrency(category.totalCost)}</span>
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
  // Hämta färger baserat på insatsnamn för konsekvent färgkodning
  const { bg, border } = getInterventionColor(internalCost.interventionName);
  const cardStyle = {
    borderColor: border,
    backgroundColor: `${bg}10` // Lägg till 10% opacitet för bakgrundsfärgen
  };
  const headerStyle = {
    backgroundColor: bg,
    borderColor: border
  };

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
  
  // Hjälpfunktion för sektionsrubriker
  const SectionTitle = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 p-2 bg-white/50 rounded-md mb-3 border border-gray-200">
      <div className="text-primary">{icon}</div>
      <h5 className="font-medium text-sm">{title}</h5>
    </div>
  );
  
  return (
    <div 
      className="border rounded-md p-3 mb-3" 
      style={cardStyle}
    >
      <div 
        className="flex justify-between items-center mb-4 p-2 rounded-md" 
        style={headerStyle}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/80 dark:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center">
            <span className="text-primary text-xs font-medium">{index + 1}</span>
          </div>
          <h3 className="font-semibold text-primary text-lg">
            {internalCost.interventionName || "Insats"} 
          </h3>
          <div className="text-sm font-medium text-muted-foreground mx-1">›</div>
          <h4 className="font-medium text-primary-foreground/80">
            {internalCost.subInterventionName || "Delinsats"}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            disabled={isFirst}
            onClick={onMoveUp}
            className="h-8 w-8 bg-white/50 dark:bg-background/20 hover:bg-white/70 dark:hover:bg-background/30"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            disabled={isLast}
            onClick={onMoveDown}
            className="h-8 w-8 bg-white/50 dark:bg-background/20 hover:bg-white/70 dark:hover:bg-background/30"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            onClick={onRemove}
            className="h-8 w-8 text-red-500 bg-white/50 dark:bg-background/20 hover:bg-white/70 dark:hover:bg-background/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="px-3 py-2 bg-white/70 dark:bg-background/30 rounded-md mb-4 border border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Insatsnamn (hämtas automatiskt från Formulär G)</span>
            </div>
            <div className="text-base font-medium">{internalCost.interventionName}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Delinsatsnamn (hämtas automatiskt från Formulär G)</span>
            </div>
            <div className="text-base font-medium">{internalCost.subInterventionName}</div>
          </div>
        </div>
      </div>
      
      {/* Personal */}
      <div className="mb-4">
        <SectionTitle title="Personal (I4-I10)" icon={<Info className="h-4 w-4" />} />
        <CostCategorySection 
          category={internalCost.staff}
          onChange={updateStaffCategory}
          indexLabels={staffLabels}
          helpTexts={staffHelpTexts}
        />
      </div>
      
      {/* Chefer */}
      <div className="mb-4">
        <SectionTitle title="Chefer (I11-I17)" icon={<Info className="h-4 w-4" />} />
        <CostCategorySection 
          category={internalCost.managers}
          onChange={updateManagerCategory}
          indexLabels={managerLabels}
          helpTexts={managerHelpTexts}
        />
      </div>
      
      {/* Administration */}
      <div className="mb-4">
        <SectionTitle title="Administration (I18-I24)" icon={<Info className="h-4 w-4" />} />
        <CostCategorySection 
          category={internalCost.administration}
          onChange={updateAdminCategory}
          indexLabels={adminLabels}
          helpTexts={adminHelpTexts}
        />
      </div>
      
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
  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  const [orgData, setOrgData] = useState<{ organizationName: string; contactPerson: string; startDate?: string; endDate?: string } | null>(null);

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

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormIData>(currentUser.uid, FORM_TYPE);
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
  
  // Kombinera alla laddningsstatus för att avgöra om innehållet är redo att visas
  useEffect(() => {
    if (!isDataLoading && !isOrgInfoLoading) {
      setIsContentReady(true);
    }
  }, [isDataLoading, isOrgInfoLoading]);

  // Uppdatera totalsummor när en kostnad ändras
  useEffect(() => {
    // Om det inte finns några insatser, sätt totalvärdet till 0
    if (safeFormData.internalCosts.length === 0) {
      if (safeFormData.totalInternalCost !== 0) {
        setFormData(prev => ({
          ...prev,
          totalInternalCost: 0
        }));
      }
      return;
    }
    
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
    
    // Beräkna den totala interna kostnaden
    const totalInternalCost = updatedInternalCosts.reduce(
      (sum, cost) => sum + cost.totalCost, 
      0
    );
    
    // Om totalvärdet har ändrats eller om någon insats har uppdaterats
    if (hasChanges || totalInternalCost !== safeFormData.totalInternalCost) {
      setFormData(prev => ({
        ...prev,
        internalCosts: updatedInternalCosts,
        totalInternalCost
      }));
    }
  }, [costsDependency, safeFormData.internalCosts, safeFormData.totalInternalCost]);

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
    
    // Beräkna ny totalinternkostnad
    const newTotalInternalCost = updatedCosts.reduce(
      (sum, cost) => sum + cost.totalCost, 
      0
    );
    
    setFormData(prev => ({
      ...prev,
      internalCosts: updatedCosts,
      totalInternalCost: newTotalInternalCost
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

  return (
    <div className="space-y-6">
      {/* Dold OrganizationHeader för att ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={setIsOrgInfoLoading} 
          onDataLoaded={setOrgData}
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
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">7 – Interna Kostnader</h2>
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
          
          {/* Interna kostnader */}
          <div className="form-card">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader 
                title="Interna kostnader" 
                icon={<Calculator className="h-5 w-5 text-primary" />}
              />
              <div className="flex items-center gap-2">
                <FetchFromFormGButton 
                  onClick={fetchInterventionsFromFormG}
                  disabled={!currentUser?.uid}
                  message={fetchMessageFormG}
                />
              </div>
            </div>
            
            {safeFormData.internalCosts.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-primary/20 rounded-md">
                <p className="text-muted-foreground mb-4">
                  Det finns inga interna kostnader att visa. Hämta insatser från Formulär G för att komma igång.
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    type="button" 
                    variant="default" 
                    className="gap-1"
                    onClick={fetchInterventionsFromFormG}
                    disabled={!currentUser?.uid}
                  >
                    <Download className="h-4 w-4" />
                    Hämta från Formulär G
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Lista av alla interna kostnader utan flikar */}
                {safeFormData.internalCosts.map((internalCost, index) => (
                  <InternalCostCard
                    key={internalCost.id}
                    internalCost={internalCost}
                    index={index}
                    onChange={updateInternalCost}
                    onRemove={() => removeInternalCost(internalCost.id)}
                    onMoveUp={() => moveInternalCostUp(index)}
                    onMoveDown={() => moveInternalCostDown(index)}
                    isFirst={index === 0}
                    isLast={index === safeFormData.internalCosts.length - 1}
                  />
                ))}
                
                {/* Total summering för alla insatser */}
                <div className="form-card mt-6">
                  <SectionHeader 
                    title="Summering" 
                    icon={<Calculator className="h-5 w-5 text-primary" />}
                  />
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
      </FadeIn>
    </div>
  );
});

export default FormI; 