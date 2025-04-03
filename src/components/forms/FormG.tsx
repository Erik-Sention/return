import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Calculator, Coins, PlusCircle, X, ArrowUp, ArrowDown, ArrowDown as ArrowDownIcon, Calculator as CalculatorIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { SharedFieldsButton } from '@/components/ui/shared-fields-button';
import { updateFormWithSharedFields } from '@/lib/utils/updateFormFields';
import { SharedFields } from '@/lib/firebase/sharedFields';
import { getInterventionColor } from '@/lib/utils/interventionColors';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

// Enkel Textarea-komponent
const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, style, ...props }, ref) {
    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        style={{ userSelect: 'text', cursor: 'text', ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);

// Typer för insatser och kostnader
interface InterventionCost {
  id: string;
  name: string;
  externalCost: number | null;
  internalCost: number | null;
}

interface Intervention {
  id: string;
  name: string;
  description: string;
  costs: InterventionCost[];
  totalExternalCost: number;
  totalInternalCost: number;
  totalCost: number;
}

interface FormGData {
  timePeriod: string;
  interventions: Intervention[];
  totalInterventionCost: number;
  totalExternalCost: number;
  totalInternalCost: number;
}

// Typer för Form H data
interface FormHCostItem {
  id: string;
  interventionName: string;
  subInterventionName: string;
  costType: string;
  amount: number | null;
}

interface FormHIntervention {
  id: string;
  name: string;
  comment: string;
  costItems: FormHCostItem[];
  totalCost: number;
}

interface FormHData {
  interventions: FormHIntervention[];
}

// Typer för Form I data
interface FormICostCategory {
  minutesSpent: number | null;
  divisor: number;
  hoursSpent: number;
  employeeCount: number | null;
  totalHours: number;
  hourlyCost: number | null;
  totalCost: number;
}

interface FormIInternalCost {
  id: string;
  interventionName: string; 
  subInterventionName: string;
  staff: FormICostCategory;
  managers: FormICostCategory;
  administration: FormICostCategory;
  totalHours: number;
  totalCost: number;
}

interface FormIData {
  internalCosts: FormIInternalCost[];
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormGRef {
  handleSave: () => Promise<void>;
}

// Lägg till InfoLabel-komponenten för att ge användaren information
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

// Konvertera null till undefined för FormattedNumberInput
const nullToUndefined = (value: number | null): number | undefined => {
  return value === null ? undefined : value;
};

// Generera ett unikt ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Komponent för en kostnadsrad
const CostRow = ({
  cost,
  onChange,
  onRemove
}: {
  cost: InterventionCost;
  onChange: (updatedCost: InterventionCost) => void;
  onRemove: () => void;
}) => {
  // Hantera beloppsändringar
  const handleAmountChange = (field: 'externalCost' | 'internalCost', value: number | undefined) => {
    // Konvertera undefined till null för att spara korrekt i databasen
    const newValue = value === undefined ? null : value;
    onChange({
      ...cost,
      [field]: newValue
    });
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-start mb-2 bg-white/50 dark:bg-background/20 p-2 rounded-md border border-primary/10">
      <div className="col-span-4">
        <Input 
          value={cost.name} 
          onChange={(e) => onChange({ ...cost, name: e.target.value })} 
          placeholder="Delinsatsnamn"
          className="bg-white dark:bg-slate-800"
        />
      </div>
      <div className="col-span-4">
        <FormattedNumberInput
          value={nullToUndefined(cost.externalCost)}
          onChange={(value) => handleAmountChange('externalCost', value)}
          placeholder="0 kr"
          className="bg-white dark:bg-slate-800"
        />
      </div>
      <div className="col-span-3">
        <FormattedNumberInput
          value={nullToUndefined(cost.internalCost)}
          onChange={(value) => handleAmountChange('internalCost', value)}
          placeholder="0 kr"
          className="bg-white dark:bg-slate-800"
        />
      </div>
      <div className="col-span-1 flex items-end space-x-1 h-full pb-1">
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 text-red-500 bg-white/50 dark:bg-background/20 hover:bg-white/70 dark:hover:bg-background/30"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Lägg till InterventionCard-komponenten för att hantera insatskort
const InterventionCard = ({
  intervention,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: {
  intervention: Intervention;
  index: number;
  onChange: (updatedIntervention: Intervention) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  // Säkerställ att costs alltid finns tillgänglig
  const costs = intervention.costs || [];
  
  // Hämta färger baserat på insatsnamn för konsekvent färgkodning
  const { bg, border } = getInterventionColor(intervention.name);
  const cardStyle = {
    borderColor: border,
    backgroundColor: `${bg}10` // Lägg till 10% opacitet för bakgrundsfärgen
  };
  const headerStyle = {
    backgroundColor: bg,
    borderColor: border
  };
  
  const addCost = () => {
    const newCost: InterventionCost = {
      id: generateId(),
      name: '',
      externalCost: null,
      internalCost: null
    };
    onChange({
      ...intervention,
      costs: [...costs, newCost]
    });
  };

  const updateCost = (updatedCost: InterventionCost) => {
    const updatedCosts = costs.map(cost => 
      cost.id === updatedCost.id ? updatedCost : cost
    );
    onChange({
      ...intervention,
      costs: updatedCosts
    });
  };

  const removeCost = (costId: string) => {
    const updatedCosts = costs.filter(cost => cost.id !== costId);
    onChange({
      ...intervention,
      costs: updatedCosts
    });
  };

  return (
    <div 
      className="border rounded-md p-3 mb-4" 
      style={cardStyle}
    >
      <div 
        className="flex items-center justify-between mb-4 p-2 rounded-md" 
        style={headerStyle}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/80 dark:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center">
            <span className="text-primary text-xs font-medium">{index + 1}</span>
          </div>
          <h4 className="text-base font-semibold">{intervention.name || `Insats ${index + 1}`}</h4>
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
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Insatsnamn</label>
          <InfoLabel text="Ange ett beskrivande namn för insatsen" />
          <Input
            value={intervention.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...intervention, name: e.target.value })}
            placeholder="Ange insatsnamn"
            className="bg-white dark:bg-slate-800"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Beskrivning</label>
          <InfoLabel text="Beskriv insatsen och dess syfte" />
          <Textarea
            value={intervention.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...intervention, description: e.target.value })}
            placeholder="Beskriv insatsen"
            className="bg-white dark:bg-slate-800 min-h-24"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Kostnader</label>
            <Button 
              type="button"
              size="sm"
              variant="outline"
              onClick={addCost}
              className="gap-1 h-8"
            >
              <PlusCircle className="h-4 w-4" />
              Lägg till delinsats
            </Button>
          </div>
          
          {costs.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3 border border-dashed border-muted-foreground/20 rounded-md text-center">
              Lägg till en eller flera delinsatser för denna insats
            </div>
          ) : (
            <div className="space-y-1">
              {costs.map((cost) => (
                <CostRow
                  key={cost.id}
                  cost={cost}
                  onChange={updateCost}
                  onRemove={() => removeCost(cost.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t">
          <ReadOnlyField 
            label="Externa kostnader"
            value={formatCurrency(intervention.totalExternalCost || 0)}
            info="Summa av externa kostnader"
          />
          <ReadOnlyField 
            label="Interna kostnader"
            value={formatCurrency(intervention.totalInternalCost || 0)}
            info="Summa av interna kostnader"
          />
          <ReadOnlyField 
            label="Total kostnad för insatsen"
            value={formatCurrency(intervention.totalCost || 0)}
            info="Summa av alla kostnader"
            highlight={true}
          />
        </div>
      </div>
    </div>
  );
};

// Lägg till FetchValueButton-komponenten för att hämta insatser från formulär H
const FetchValueButton = ({ 
  onClick, 
  disabled,
  message,
  source = 'H'
}: { 
  onClick: () => void;
  disabled?: boolean;
  message?: string | null;
  source?: 'H' | 'I';
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
      <ArrowDownIcon className="h-4 w-4 mr-2" />
      Hämta insats från Formulär {source}
    </Button>
    {message && (
      <span className={`text-sm ${message.includes('Inget') || message.includes('redan') ? 'text-amber-500' : 'text-green-500'} mt-1`}>
        {message}
      </span>
    )}
  </div>
);

const FORM_TYPE = 'G';

// Definiera en typ för komponentens props
type FormGProps = React.ComponentProps<'div'>;

// Gör FormG till en forwardRef component
const FormG = forwardRef<FormGRef, FormGProps>(function FormG(props, ref) {
  const { currentUser } = useAuth();
  const initialState: FormGData = {
    timePeriod: '',
    interventions: [],
    totalInterventionCost: 0,
    totalExternalCost: 0,
    totalInternalCost: 0
  };
  const [formData, setFormData] = useState<FormGData>(initialState);
  
  // Skydda oss mot undefined interventions - säkerställ att de alltid finns
  const safeFormData = useMemo(() => {
    return {
      ...formData,
      interventions: formData.interventions || []
    };
  }, [formData]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchMessageFormH, setFetchMessageFormH] = useState<string | null>(null);
  const [fetchMessageFormI, setFetchMessageFormI] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Skapa en memoized-dependency för att spåra kostnadsändringar
  const interventionCostDependency = useMemo(() => {
    // Säkerställ att interventions finns innan vi gör något
    if (!safeFormData.interventions || safeFormData.interventions.length === 0) {
      return '';
    }
    
    try {
      return safeFormData.interventions
        .map(i => i.costs && i.costs.length > 0 ? 
          i.costs.map(c => `${c.id}:${c.externalCost}:${c.internalCost}`).join('|') 
          : i.id
        )
        .join('||');
    } catch (error) {
      console.error('Error generating cost dependency:', error);
      return '';  // Returnera en tom sträng vid fel istället för att krascha
    }
  }, [safeFormData.interventions]);

  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  const [orgData, setOrgData] = useState<{ organizationName: string; contactPerson: string } | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormGData>(currentUser.uid, FORM_TYPE);
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
  
  // Callback för när organisationsdata har laddats
  const handleOrgDataLoaded = useCallback((data: { organizationName: string; contactPerson: string } | null) => {
    setOrgData(data);
  }, []);

  // Beräkna automatiska värden när relevanta kostnader ändras
  useEffect(() => {
    // Undvik att köra denna effekt om vi inte har en kostnadsdependency eller inga insatser
    if (!interventionCostDependency || safeFormData.interventions.length === 0) {
      return;
    }

    let updatedInterventions: Intervention[] = [];
    let hasChanges = false;

    try {
      // Beräkna nya totaler för varje insats
      updatedInterventions = safeFormData.interventions.map(intervention => {
        if (!intervention.costs || intervention.costs.length === 0) {
          // Ingen ändring behövs om det inte finns kostnader
          return intervention;
        }
        
        // Beräkna totalkostnader
        const externalCost = intervention.costs.reduce(
          (sum, cost) => sum + (typeof cost.externalCost === 'number' ? cost.externalCost : 0), 
          0
        );
        
        const internalCost = intervention.costs.reduce(
          (sum, cost) => sum + (typeof cost.internalCost === 'number' ? cost.internalCost : 0), 
          0
        );
        
        const totalCost = externalCost + internalCost;
        
        // Kontrollera om något har ändrats
        const hasChanged = 
          externalCost !== intervention.totalExternalCost ||
          internalCost !== intervention.totalInternalCost ||
          totalCost !== intervention.totalCost;
        
        if (hasChanged) {
          hasChanges = true;
          return {
            ...intervention,
            totalExternalCost: externalCost,
            totalInternalCost: internalCost,
            totalCost: totalCost
          };
        }
        
        return intervention;
      });
      
      // Om inga ändringar i kostnader, behöver vi inte uppdatera state
      if (!hasChanges) {
        return;
      }
      
      // Beräkna nya totaler
      const totalExternalCost = updatedInterventions.reduce(
        (sum, item) => sum + (item.totalExternalCost || 0), 
        0
      );
      
      const totalInternalCost = updatedInterventions.reduce(
        (sum, item) => sum + (item.totalInternalCost || 0), 
        0
      );
      
      const totalInterventionCost = totalExternalCost + totalInternalCost;
      
      // Uppdatera state med nya värden
      setFormData(prev => ({
        ...prev,
        interventions: updatedInterventions,
        totalExternalCost,
        totalInternalCost,
        totalInterventionCost
      }));
    } catch (error) {
      console.error('Error calculating costs:', error);
      // Vid fel, gör ingenting istället för att krascha
    }
  }, [interventionCostDependency, safeFormData.interventions]);

  // Setup autosave whenever formData changes
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (currentUser?.uid) {
      // Kontrollera och fixa eventuella undefined-värden innan autosave
      const safeFormDataToSave = prepareDataForSave(safeFormData);
      
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        safeFormDataToSave,
        setIsSaving,
        setSaveMessage
      );
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, currentUser, safeFormData]);

  // Exponera handleSave till föräldrakomponenten via ref
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      await handleSave();
    }
  }));

  const handleChange = (field: keyof FormGData, value: string | number | null | Intervention[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Lägga till en ny insats
  const addIntervention = () => {
    const newIntervention: Intervention = {
      id: generateId(),
      name: '',
      description: '',
      costs: [],
      totalExternalCost: 0,
      totalInternalCost: 0,
      totalCost: 0
    };
    
    handleChange('interventions', [...safeFormData.interventions, newIntervention]);
  };

  // Uppdatera en insats
  const updateIntervention = (updatedIntervention: Intervention) => {
    const updatedInterventions = safeFormData.interventions.map(intervention => 
      intervention.id === updatedIntervention.id ? updatedIntervention : intervention
    );
    
    handleChange('interventions', updatedInterventions);
  };

  // Ta bort en insats
  const removeIntervention = (interventionId: string) => {
    if (!safeFormData.interventions) return;
    
    const updatedInterventions = safeFormData.interventions.filter(
      intervention => intervention.id !== interventionId
    );
    
    handleChange('interventions', updatedInterventions);
  };

  // Flytta en insats uppåt
  const moveInterventionUp = (index: number) => {
    if (!safeFormData.interventions || index <= 0) return;
    
    const updatedInterventions = [...safeFormData.interventions];
    const temp = updatedInterventions[index];
    updatedInterventions[index] = updatedInterventions[index - 1];
    updatedInterventions[index - 1] = temp;
    
    handleChange('interventions', updatedInterventions);
  };

  // Flytta en insats nedåt
  const moveInterventionDown = (index: number) => {
    if (!safeFormData.interventions || index >= safeFormData.interventions.length - 1) return;
    
    const updatedInterventions = [...safeFormData.interventions];
    const temp = updatedInterventions[index];
    updatedInterventions[index] = updatedInterventions[index + 1];
    updatedInterventions[index + 1] = temp;
    
    handleChange('interventions', updatedInterventions);
  };

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormGData): Record<string, unknown> => {
    const preparedData: Record<string, unknown> = {};
    
    // Konvertera explicit alla undefineds till null eller defaultvärden
    Object.keys(data).forEach(key => {
      const typedKey = key as keyof FormGData;
      const value = data[typedKey];
      
      if (key === 'interventions') {
        // Hantera insatser speciellt
        preparedData.interventions = (data.interventions || []).map(intervention => {
          // Hantera costs i insatsen
          const costs = (intervention.costs || []).map(cost => ({
            id: cost.id,
            name: cost.name || '',
            externalCost: cost.externalCost === undefined ? null : cost.externalCost,
            internalCost: cost.internalCost === undefined ? null : cost.internalCost
          }));
          
          return {
            id: intervention.id,
            name: intervention.name || '',
            description: intervention.description || '',
            costs,
            totalExternalCost: intervention.totalExternalCost || 0,
            totalInternalCost: intervention.totalInternalCost || 0,
            totalCost: intervention.totalCost || 0
          };
        });
      } else if (value === undefined) {
        // För numeriska fält, använd null
        if (
          typedKey === 'totalInterventionCost' || 
          typedKey === 'totalExternalCost' || 
          typedKey === 'totalInternalCost'
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

  // Rensa fetchMessage efter en viss tid
  useEffect(() => {
    if (fetchMessageFormH) {
      const timer = setTimeout(() => {
        setFetchMessageFormH(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageFormH]);

  // Funktion för att hämta insats från formulär H
  const fetchInterventionFromFormH = async () => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setError(null);
      const formHData = await loadFormData<FormHData>(currentUser.uid, 'H');
      
      if (!formHData || !formHData.interventions || formHData.interventions.length === 0) {
        setFetchMessageFormH('Inga insatser hittades i Formulär H.');
        return;
      }

      // Samla alla delinsatser grupperade per insats
      const interventionGroups: Map<string, { 
        insatsName: string, 
        delinsatser: Array<{ name: string, externalCost: number | null }>
      }> = new Map();
      
      // Samla alla delinsatser grupperade per insats
      formHData.interventions.forEach(intervention => {
        if (intervention.costItems && intervention.costItems.length > 0) {
          const delinsatser = intervention.costItems.map(item => ({
            name: item.subInterventionName,
            // Avrunda externa kostnader till heltal
            externalCost: item.amount !== null ? Math.round(item.amount) : null
          }));
          
          interventionGroups.set(intervention.name, {
            insatsName: intervention.name,
            delinsatser: delinsatser
          });
        }
      });
      
      // Samla information om insatser och delinsatser i G
      const existingInterventions = new Map<string, Map<string, InterventionCost>>();
      safeFormData.interventions.forEach(intervention => {
        const costMap = new Map<string, InterventionCost>();
        intervention.costs.forEach(cost => {
          costMap.set(cost.name, cost);
        });
        existingInterventions.set(intervention.name, costMap);
      });
      
      let added = 0;
      let updated = 0;
      const interventionsToUpdate: Intervention[] = [];
      
      // Gå igenom alla insatser från H som behöver hanteras
      for (const [insatsName, insatsData] of interventionGroups) {
        const targetIntervention = safeFormData.interventions.find(
          intervention => intervention.name === insatsName
        );
        
        const existingCosts = existingInterventions.get(insatsName) || new Map<string, InterventionCost>();
        
        // Hitta delinsatser som behöver läggas till eller uppdateras
        const delinsatserToAdd: Array<{ name: string, externalCost: number | null }> = [];
        const delinsatserToUpdate: Array<{ name: string, externalCost: number | null, id: string }> = [];
        
        insatsData.delinsatser.forEach(delinsats => {
          const existingCost = existingCosts.get(delinsats.name);
          if (!existingCost) {
            // Delinsatsen finns inte, lägg till
            delinsatserToAdd.push(delinsats);
          } else if (existingCost.externalCost !== delinsats.externalCost) {
            // Delinsatsen finns men kostnaden har ändrats
            delinsatserToUpdate.push({...delinsats, id: existingCost.id});
          }
        });
        
        if (delinsatserToAdd.length > 0 || delinsatserToUpdate.length > 0) {
          if (!targetIntervention) {
            // Skapa ny insats om den inte finns
            const newIntervention: Intervention = {
              id: generateId(),
              name: insatsName,
              description: '',
              costs: [],
              totalExternalCost: 0,
              totalInternalCost: 0,
              totalCost: 0
            };
            
            // Lägg till alla nya delinsatser
            const newCosts = delinsatserToAdd.map(delinsats => ({
              id: generateId(),
              name: delinsats.name,
              externalCost: delinsats.externalCost,
              internalCost: null
            }));
            
            newIntervention.costs = newCosts;
            interventionsToUpdate.push(newIntervention);
            added += delinsatserToAdd.length;
          } else {
            // Uppdatera befintlig insats
            const updatedCosts = [...targetIntervention.costs];
            
            // Lägg till nya delinsatser
            if (delinsatserToAdd.length > 0) {
              const newCosts = delinsatserToAdd.map(delinsats => ({
                id: generateId(),
                name: delinsats.name,
                externalCost: delinsats.externalCost,
                internalCost: null
              }));
              updatedCosts.push(...newCosts);
              added += delinsatserToAdd.length;
            }
            
            // Uppdatera befintliga delinsatser
            if (delinsatserToUpdate.length > 0) {
              delinsatserToUpdate.forEach(delinsats => {
                const index = updatedCosts.findIndex(cost => cost.id === delinsats.id);
                if (index !== -1) {
                  updatedCosts[index] = {
                    ...updatedCosts[index],
                    externalCost: delinsats.externalCost
                  };
                }
              });
              updated += delinsatserToUpdate.length;
            }
            
            interventionsToUpdate.push({
              ...targetIntervention,
              costs: updatedCosts
            });
          }
        }
      }
      
      // Uppdatera alla insatser i ett svep
      if (interventionsToUpdate.length > 0) {
        const currentInterventions = [...safeFormData.interventions];
        const updatedInterventions: Intervention[] = [];
        
        // Gå igenom de befintliga insatserna
        currentInterventions.forEach(intervention => {
          const updatedVersion = interventionsToUpdate.find(updated => updated.id === intervention.id);
          if (updatedVersion) {
            updatedInterventions.push(updatedVersion);
          } else {
            updatedInterventions.push(intervention);
          }
        });
        
        // Lägg till helt nya insatser
        interventionsToUpdate.forEach(newIntervention => {
          if (!currentInterventions.some(existing => existing.id === newIntervention.id)) {
            updatedInterventions.push(newIntervention);
          }
        });
        
        setFormData(prev => ({
          ...prev,
          interventions: updatedInterventions
        }));
        
        // Visa ett informativt meddelande
        if (added > 0 && updated > 0) {
          setFetchMessageFormH(`${added} nya delinsatser tillagda och ${updated} befintliga uppdaterade från Formulär H.`);
        } else if (added > 0) {
          setFetchMessageFormH(`${added} nya delinsatser tillagda från Formulär H.`);
        } else if (updated > 0) {
          setFetchMessageFormH(`${updated} befintliga delinsatser uppdaterade från Formulär H.`);
        } else {
          setFetchMessageFormH('Inga ändringar behövdes, allt är redan uppdaterat.');
        }
      } else {
        setFetchMessageFormH('Alla insatser från Formulär H har redan hämtats.');
      }
    } catch (error) {
      console.error('Error fetching data from Form H:', error);
      setError('Kunde inte hämta data från Formulär H.');
    }
  };

  // Funktion för att hämta insats från formulär I
  const fetchInterventionFromFormI = async () => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      setError(null);
      const formIData = await loadFormData<FormIData>(currentUser.uid, 'I');
      
      if (!formIData || !formIData.internalCosts || formIData.internalCosts.length === 0) {
        setFetchMessageFormI('Inga insatser hittades i Formulär I.');
        return;
      }

      // Gruppera delinsatser efter insatsnamn från I
      const interventionGroups: Map<string, { 
        insatsName: string, 
        delinsatser: Array<{ name: string, internalCost: number | null }>
      }> = new Map();
      
      // Samla alla delinsatser grupperade per insats
      formIData.internalCosts.forEach(internalCost => {
        const delinsatsName = internalCost.subInterventionName;
        // Avrunda totalCost till heltal
        const totalCost = Math.round(internalCost.totalCost);
        
        if (!interventionGroups.has(internalCost.interventionName)) {
          interventionGroups.set(internalCost.interventionName, {
            insatsName: internalCost.interventionName,
            delinsatser: []
          });
        }
        
        const group = interventionGroups.get(internalCost.interventionName);
        if (group) {
          group.delinsatser.push({
            name: delinsatsName,
            internalCost: totalCost
          });
        }
      });
      
      // Samla information om insatser och delinsatser i G
      const existingInterventions = new Map<string, Map<string, InterventionCost>>();
      safeFormData.interventions.forEach(intervention => {
        const costMap = new Map<string, InterventionCost>();
        intervention.costs.forEach(cost => {
          costMap.set(cost.name, cost);
        });
        existingInterventions.set(intervention.name, costMap);
      });
      
      let added = 0;
      let updated = 0;
      const interventionsToUpdate: Intervention[] = [];
      
      // Gå igenom alla insatser från I som behöver hanteras
      for (const [insatsName, insatsData] of interventionGroups) {
        const targetIntervention = safeFormData.interventions.find(
          intervention => intervention.name === insatsName
        );
        
        const existingCosts = existingInterventions.get(insatsName) || new Map<string, InterventionCost>();
        
        // Hitta delinsatser som behöver läggas till eller uppdateras
        const delinsatserToAdd: Array<{ name: string, internalCost: number | null }> = [];
        const delinsatserToUpdate: Array<{ name: string, internalCost: number | null, id: string }> = [];
        
        insatsData.delinsatser.forEach(delinsats => {
          const existingCost = existingCosts.get(delinsats.name);
          if (!existingCost) {
            // Delinsatsen finns inte, lägg till
            delinsatserToAdd.push(delinsats);
          } else if (existingCost.internalCost !== delinsats.internalCost) {
            // Delinsatsen finns men kostnaden har ändrats
            delinsatserToUpdate.push({...delinsats, id: existingCost.id});
          }
        });
        
        if (delinsatserToAdd.length > 0 || delinsatserToUpdate.length > 0) {
          if (!targetIntervention) {
            // Skapa ny insats om den inte finns
            const newIntervention: Intervention = {
              id: generateId(),
              name: insatsName,
              description: '',
              costs: [],
              totalExternalCost: 0,
              totalInternalCost: 0,
              totalCost: 0
            };
            
            // Lägg till alla nya delinsatser
            const newCosts = delinsatserToAdd.map(delinsats => ({
              id: generateId(),
              name: delinsats.name,
              externalCost: null,
              internalCost: delinsats.internalCost
            }));
            
            newIntervention.costs = newCosts;
            interventionsToUpdate.push(newIntervention);
            added += delinsatserToAdd.length;
          } else {
            // Uppdatera befintlig insats
            const updatedCosts = [...targetIntervention.costs];
            
            // Lägg till nya delinsatser
            if (delinsatserToAdd.length > 0) {
              const newCosts = delinsatserToAdd.map(delinsats => ({
                id: generateId(),
                name: delinsats.name,
                externalCost: null,
                internalCost: delinsats.internalCost
              }));
              updatedCosts.push(...newCosts);
              added += delinsatserToAdd.length;
            }
            
            // Uppdatera befintliga delinsatser
            if (delinsatserToUpdate.length > 0) {
              delinsatserToUpdate.forEach(delinsats => {
                const index = updatedCosts.findIndex(cost => cost.id === delinsats.id);
                if (index !== -1) {
                  updatedCosts[index] = {
                    ...updatedCosts[index],
                    internalCost: delinsats.internalCost
                  };
                }
              });
              updated += delinsatserToUpdate.length;
            }
            
            interventionsToUpdate.push({
              ...targetIntervention,
              costs: updatedCosts
            });
          }
        }
      }
      
      // Uppdatera alla insatser i ett svep
      if (interventionsToUpdate.length > 0) {
        const currentInterventions = [...safeFormData.interventions];
        const updatedInterventions: Intervention[] = [];
        
        // Gå igenom de befintliga insatserna
        currentInterventions.forEach(intervention => {
          const updatedVersion = interventionsToUpdate.find(updated => updated.id === intervention.id);
          if (updatedVersion) {
            updatedInterventions.push(updatedVersion);
          } else {
            updatedInterventions.push(intervention);
          }
        });
        
        // Lägg till helt nya insatser
        interventionsToUpdate.forEach(newIntervention => {
          if (!currentInterventions.some(existing => existing.id === newIntervention.id)) {
            updatedInterventions.push(newIntervention);
          }
        });
        
        setFormData(prev => ({
          ...prev,
          interventions: updatedInterventions
        }));
        
        // Visa ett informativt meddelande
        if (added > 0 && updated > 0) {
          setFetchMessageFormI(`${added} nya delinsatser tillagda och ${updated} befintliga uppdaterade från Formulär I.`);
        } else if (added > 0) {
          setFetchMessageFormI(`${added} nya delinsatser tillagda från Formulär I.`);
        } else if (updated > 0) {
          setFetchMessageFormI(`${updated} befintliga delinsatser uppdaterade från Formulär I.`);
        } else {
          setFetchMessageFormI('Inga ändringar behövdes, allt är redan uppdaterat.');
        }
      } else {
        setFetchMessageFormI('Alla insatser från Formulär I har redan hämtats.');
      }
    } catch (error) {
      console.error('Error fetching data from Form I:', error);
      setError('Kunde inte hämta data från Formulär I.');
    }
  };

  // Rensa fetchMessageFormI efter en viss tid
  useEffect(() => {
    if (fetchMessageFormI) {
      const timer = setTimeout(() => {
        setFetchMessageFormI(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [fetchMessageFormI]);

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
          {orgData && (orgData.organizationName || orgData.contactPerson) && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-md mb-4">
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="mb-2 sm:mb-0">
                  <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
                  <span className="ml-2 font-semibold">{orgData.organizationName || "Ej angiven"}</span>
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
              <h2 className="text-2xl font-bold">G – Resultat och utfall</h2>
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
          
          {/* G1-G3 Grundinformation */}
          <div className="form-card">
            <SectionHeader 
              title="Tidsperiod" 
              icon={<Info className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">G3: Tidsperiod</label>
              <InfoLabel text="Ange tidsperiod i formatet ÅÅÅÅ-MM-DD - ÅÅÅÅ-MM-DD" />
              <Input
                name="timePeriod"
                value={safeFormData.timePeriod || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('timePeriod', e.target.value)}
                placeholder="Ange tidsperiod"
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
          
          {/* Insatser */}
          <div className="form-card">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader 
                title="Insatser" 
                icon={<Coins className="h-5 w-5 text-primary" />}
              />
              <div className="flex items-center gap-2">
                <FetchValueButton 
                  onClick={fetchInterventionFromFormH}
                  disabled={!currentUser?.uid}
                  message={fetchMessageFormH}
                  source="H"
                />
                <FetchValueButton 
                  onClick={fetchInterventionFromFormI}
                  disabled={!currentUser?.uid}
                  message={fetchMessageFormI}
                  source="I"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="gap-1"
                  onClick={addIntervention}
                >
                  <PlusCircle className="h-4 w-4" />
                  Lägg till insats
                </Button>
              </div>
            </div>
            
            {(!safeFormData.interventions || safeFormData.interventions.length === 0) ? (
              <div className="text-center p-8 border border-dashed border-primary/20 rounded-md">
                <p className="text-muted-foreground mb-4">
                  Det finns inga insatser att visa. Lägg till en insats för att komma igång eller hämta från Formulär H eller I.
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1"
                    onClick={fetchInterventionFromFormH}
                    disabled={!currentUser?.uid}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                    Hämta från Formulär H
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1"
                    onClick={fetchInterventionFromFormI}
                    disabled={!currentUser?.uid}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                    Hämta från Formulär I
                  </Button>
                  <Button 
                    type="button" 
                    variant="default" 
                    className="gap-1"
                    onClick={addIntervention}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Lägg till din första insats
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {safeFormData.interventions.map((intervention, index) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    index={index}
                    onChange={updateIntervention}
                    onRemove={() => removeIntervention(intervention.id)}
                    onMoveUp={() => moveInterventionUp(index)}
                    onMoveDown={() => moveInterventionDown(index)}
                    isFirst={index === 0}
                    isLast={index === safeFormData.interventions.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Total summering */}
          <div className="form-card">
            <SectionHeader 
              title="Total summering" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <ReadOnlyField 
                label="Totala externa kostnader"
                value={formatCurrency(safeFormData.totalExternalCost || 0)}
                info="Summa av alla externa kostnader"
              />
              <ReadOnlyField 
                label="Totala interna kostnader"
                value={formatCurrency(safeFormData.totalInternalCost || 0)}
                info="Summa av alla interna kostnader"
              />
              <ReadOnlyField 
                label="G34: Total insatskostnad"
                value={formatCurrency(safeFormData.totalInterventionCost || 0)}
                info="Beräknas automatiskt som summan av alla insatskostnader"
                highlight={true}
              />
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

export default FormG; 