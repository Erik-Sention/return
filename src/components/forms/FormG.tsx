import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Calculator, Coins, PlusCircle, X, ArrowUp, ArrowDown, Calculator as CalculatorIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { getInterventionColor } from '@/lib/utils/interventionColors';
import { OrganizationHeader } from '@/components/ui/organization-header';
import { FadeIn } from '@/components/ui/fade-in';

// Formulärinformationskomponent
const FormInfo = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
    <h3 className="text-lg font-semibold mb-2">Formulär 5 – Insatskostnader</h3>
    <p className="text-sm text-slate-700 dark:text-slate-300">
      I detta formulär summerar du kostnaderna för planerade insatser. Du kan lägga till 
      olika insatstyper och specificera både externa kostnader och interna personalkostnader 
      för att få en helhetsbild av investeringen.
    </p>
  </div>
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

const FORM_TYPE = 'G';

// Definiera en typ för komponentens props
type FormGProps = React.ComponentProps<'div'> & {
  projectId?: string | null;
};

// Gör FormG till en forwardRef component
const FormG = forwardRef<FormGRef, FormGProps>(function FormG(props, ref) {
  const { currentUser } = useAuth();
  const { projectId } = props;
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
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  const [orgData, setOrgData] = useState<{ organizationName: string; contactPerson: string; startDate?: string; endDate?: string } | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormGData>(currentUser.uid, FORM_TYPE, projectId);
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
  }, [currentUser, projectId]);
  
  // Kombinera alla laddningsstatus för att avgöra om innehållet är redo att visas
  useEffect(() => {
    if (!isDataLoading && !isOrgInfoLoading) {
      setIsContentReady(true);
    }
  }, [isDataLoading, isOrgInfoLoading]);
  
  // Beräkna automatiska värden när relevanta kostnader ändras
  useEffect(() => {
    // Undvik att köra denna effekt om vi inte har en kostnadsdependency eller inga insatser
    if (!safeFormData.interventions || safeFormData.interventions.length === 0) {
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
  }, [safeFormData.interventions]);

  // Setup autosave whenever formData changes
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
  
    // Only autosave if user is logged in and form has been interacted with
    if (currentUser?.uid) {
      // Kontrollera och fixa eventuella undefined-värden innan autosave
      const safeFormDataToSave = prepareDataForSave(safeFormData);
     
      autosaveTimerRef.current = setupFormAutosave(
        currentUser.uid,
        FORM_TYPE,
        safeFormDataToSave,
        setIsSaving,
        setSaveMessage,
        projectId
      );
    }
  
    // Cleanup timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, currentUser, safeFormData, projectId]);

  // Exponera handleSave till föräldrakomponenten via ref
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      await handleSave();
    }
  }));

  const handleChange = (field: keyof FormGData, value: string | number | null | Intervention[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Lägga till en ny insats med en tom delinsats direkt
  const addIntervention = () => {
    const newCostId = generateId();
    const newIntervention: Intervention = {
      id: generateId(),
      name: '',
      costs: [{
        id: newCostId,
        name: '',
        externalCost: null,
        internalCost: null
      }],
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
      console.log('Saving form data to Firebase:', dataToSave);
      
      // Save to Firebase
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave, projectId);
      
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

  return (
    <div className="space-y-6">
      {/* Dold OrganizationHeader för att ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={setIsOrgInfoLoading} 
          onDataLoaded={setOrgData}
          projectId={projectId}
        />
      </div>
      
      <FadeIn show={isContentReady} duration={500}>
        <div className="space-y-4">
          {/* Lägg till formulärinformation */}
          <FormInfo />
          
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
              <h2 className="text-2xl font-bold">5 – Insatskostnader</h2>
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
          
          {/* Insatser */}
          <div className="form-card">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader 
                title="Insatser" 
                icon={<Coins className="h-5 w-5 text-primary" />}
              />
              <div className="flex items-center gap-2">
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
                  Det finns inga insatser att visa. Lägg till en insats för att komma igång.
                </p>
                <div className="flex justify-center gap-3">
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
                label="Total insatskostnad"
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