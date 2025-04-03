import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, Wallet, CreditCard, PlusCircle, X, ArrowDown, Calculator as CalculatorIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Textarea } from '../ui/textarea';
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

// Typer för kostnadsposter
interface CostItem {
  id: string;
  interventionName: string;
  subInterventionName: string;
  costType: string;
  amount: number | null;
}

// Insats med kostnadsposter
interface Intervention {
  id: string;
  name: string;
  comment: string;
  costItems: CostItem[];
  totalCost: number;
}

interface FormHData {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
  interventions: Intervention[];
  totalExternalCosts: number;
}

// Definiera en typ för vad som ska exponeras via ref
export interface FormHRef {
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

// Generera ett unikt ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Konvertera null till undefined för FormattedNumberInput och hantera NaN
const nullToUndefined = (value: number | null): number | undefined => {
  // Hantera både null och NaN, returnera undefined i båda fallen
  if (value === null || (typeof value === 'number' && isNaN(value))) {
    return undefined;
  }
  return value;
};

// Kostnadstyperna som kan användas
const COST_TYPES = [
  "Fast avgift för insats/offert",
  "Inhyrd personal",
  "Lokalhyra",
  "Resor",
  "Utrustning och inventarier",
  "Övriga externa tjänster"
];

// Komponent för en kostnadspost-rad
const CostItemRow = ({
  costItem,
  onChange,
  onRemove
}: {
  costItem: CostItem;
  onChange: (updatedCostItem: CostItem) => void;
  onRemove: () => void;
}) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center mb-1 p-1 rounded-md bg-white/50 dark:bg-background/10 border border-primary/10">
      <div className="col-span-3 flex flex-col">
        <div className="text-xs text-muted-foreground mb-1"></div>
        <div className="bg-white/80 dark:bg-background/20 p-1.5 rounded border border-primary/20 text-sm font-medium truncate">
          {costItem.subInterventionName || 'Ej angiven'}
        </div>
      </div>
      <div className="col-span-4">
        <select 
          value={costItem.costType || ''}
          onChange={(e) => onChange({ ...costItem, costType: e.target.value })}
          className="w-full rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-1 text-sm focus-visible:outline-none cursor-pointer appearance-none bg-select-arrow bg-no-repeat bg-[center_right_0.5rem] pr-8"
        >
          <option value="">Välj kostnadstyp</option>
          {COST_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="col-span-4">
        <FormattedNumberInput
          value={nullToUndefined(costItem.amount)}
          onChange={(value) => {
            // Kontrollera värdet innan det sparas
            const safeValue = value === undefined || isNaN(value) ? null : value;
            onChange({ ...costItem, amount: safeValue });
          }}
          placeholder="0 kr"
          className="text-sm bg-white dark:bg-slate-800"
        />
      </div>
      <div className="col-span-1 flex justify-center">
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

// Komponent för ett insatskort
const InterventionCard = ({
  intervention,
  index,
  onChange,
  onRemove
}: {
  intervention: Intervention;
  index: number;
  onChange: (updatedIntervention: Intervention) => void;
  onRemove: () => void;
}) => {
  // Säkerställ att costItems alltid är en array, även om den är undefined
  const costItems = intervention.costItems || [];
  
  // Hämta färger baserat på insatsnamn för konsekvent färgkodning
  const { bg, border } = getInterventionColor(intervention.name);
  const cardStyle = {
    borderColor: border,
    backgroundColor: `${bg}10`
  };
  const headerStyle = {
    backgroundColor: bg,
    borderColor: border
  };
  
  // Få alla unika delinsatsnamn från kostnadsposterna
  const subInterventionNames = [...new Set(costItems.map(item => item.subInterventionName).filter(name => name))];
  
  const addCostItem = () => {
    const newCostItem: CostItem = {
      id: generateId(),
      interventionName: intervention.name,
      subInterventionName: "",
      costType: "",
      amount: null
    };
    
    onChange({
      ...intervention,
      costItems: [...costItems, newCostItem]
    });
  };

  const updateCostItem = (updatedCostItem: CostItem) => {
    const updatedCostItems = costItems.map(item => 
      item.id === updatedCostItem.id ? updatedCostItem : item
    );
    
    onChange({
      ...intervention,
      costItems: updatedCostItems
    });
  };

  const removeCostItem = (costItemId: string) => {
    const updatedCostItems = costItems.filter(item => item.id !== costItemId);
    
    onChange({
      ...intervention,
      costItems: updatedCostItems
    });
  };

  return (
    <div 
      className="border rounded-md p-3 mb-3" 
      style={cardStyle}
    >
      <div 
        className="flex justify-between items-start mb-4 p-2 rounded-md" 
        style={headerStyle}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/80 dark:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center">
            <span className="text-primary text-xs font-medium">{index + 1}</span>
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-semibold text-primary text-lg">
                {intervention.name || "Insats"}
              </h3>
              {subInterventionNames.length > 0 && (
                <>
                  <div className="text-sm font-medium text-muted-foreground mx-1">›</div>
                  <h4 className="font-medium text-primary-foreground/80">
                    {subInterventionNames.length === 1 
                      ? subInterventionNames[0] 
                      : `${subInterventionNames.length} delinsatser`}
                  </h4>
                </>
              )}
            </div>
            {subInterventionNames.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {subInterventionNames.map((name, i) => (
                  <span key={i} className="inline-flex text-xs bg-white/50 dark:bg-white/20 px-1.5 py-0.5 rounded">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500 bg-white/50 dark:bg-white/20 hover:bg-white/70 dark:hover:bg-white/30"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="px-3 py-2 bg-white/70 dark:bg-background/30 rounded-md mb-4 border border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Insatsnamn (hämtas automatiskt från Formulär G)</span>
            </div>
            <div className="text-base font-medium">{intervention.name}</div>
          </div>
          {subInterventionNames.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Delinsatser (hämtas automatiskt från Formulär G)</span>
              </div>
              <div className="text-base font-medium">
                {subInterventionNames.length === 1 
                  ? subInterventionNames[0]
                  : `${subInterventionNames.length} delinsatser`}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3 mb-3">
        <div>
          <label className="text-sm font-medium">Kommentar (valfri)</label>
          <Textarea 
            value={intervention.comment || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...intervention, comment: e.target.value })}
            placeholder="Lägg till en kommentar om insatsen"
            className="text-sm h-16 resize-none bg-white dark:bg-slate-800"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Kostnadsposter</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20"
            onClick={addCostItem}
          >
            <PlusCircle className="h-3 w-3" />
            Lägg till kostnadspost
          </Button>
        </div>
        
        {costItems.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2 border border-dashed border-muted-foreground/20 rounded-md text-center bg-white/50 dark:bg-background/20">
            Inga kostnadsposter tillagda
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground mb-1 px-1">
              <div className="col-span-3">Delinsats</div>
              <div className="col-span-4">Kostnadstyp</div>
              <div className="col-span-4">Belopp</div>
              <div className="col-span-1"></div>
            </div>
            {costItems.map((costItem) => (
              <CostItemRow
                key={costItem.id}
                costItem={costItem}
                onChange={updateCostItem}
                onRemove={() => removeCostItem(costItem.id)}
              />
            ))}
            <div className="flex justify-end mt-2 bg-white/50 dark:bg-background/20 p-2 rounded-md border border-primary/10">
              <div className="text-sm font-medium">
                Summa: {formatCurrency(intervention.totalCost)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Lägg till FetchValueButton-komponenten för att hämta insatser från formulär G
const FetchValueButton = ({ 
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
      className="mt-1"
    >
      <ArrowDown className="h-4 w-4 mr-2" />
      Hämta insats från Formulär G
    </Button>
    {message && (
      <span className={`text-sm ${message.includes('Inget') || message.includes('redan') ? 'text-amber-500' : 'text-green-500'} mt-1`}>
        {message}
      </span>
    )}
  </div>
);

const FORM_TYPE = 'H';

// Definiera en typ för komponentens props
type FormHProps = React.ComponentProps<'div'>;

// Gör FormH till en forwardRef component
const FormH = forwardRef<FormHRef, FormHProps>(function FormH(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormHData>({
    organizationName: '',
    contactPerson: '',
    timePeriod: '',
    interventions: [],
    totalExternalCosts: 0
  });
  
  // Säkerställ att vi alltid har en lista med interventions
  const safeFormData = useMemo(() => {
    return {
      ...formData,
      interventions: formData.interventions || []
    };
  }, [formData]);
  
  const [fetchMessageFormG, setFetchMessageFormG] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
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
          const data = await loadFormData<FormHData>(currentUser.uid, FORM_TYPE);
          if (data) {
            console.log('Loaded form data:', data);
            setFormData(data);
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
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

  // Använd useEffect-hook för att beräkna totala kostnader
  // Denna useEffect ersätter costsDependency som tidigare användes
  useEffect(() => {
    // Beräkna totala kostnader för varje intervention
    if (safeFormData.interventions) {
      // Kontrollera om kostnaderna faktiskt ändras innan vi uppdaterar state
      let totalExternalCosts = 0;
      const updatedInterventions = safeFormData.interventions.map(intervention => {
        // Säkerställ att costItems alltid är en array
        const costItems = intervention.costItems || [];
        
        // Beräkna summan av kostnadsposterna och kontrollera NaN-värden
        const itemsTotal = costItems.reduce((sum, item) => {
          // Kontrollera om amount är ett giltigt nummer, annars använd 0
          const amount = typeof item.amount === 'number' && !isNaN(item.amount) 
            ? item.amount 
            : 0;
          return sum + amount;
        }, 0);
        
        // Beräkna den totala kostnaden för denna intervention
        const totalCost = itemsTotal;
        
        // Lägg till i totalsumman
        totalExternalCosts += totalCost;
        
        return { 
          ...intervention, 
          costItems, // Säkerställ att costItems alltid är en array i resultatet
          totalCost 
        };
      });
      
      // Kontrollera om interventionernas kostnader har ändrats
      const currentCosts = JSON.stringify(
        safeFormData.interventions.map(i => ({ id: i.id, totalCost: i.totalCost }))
      );
      const newCosts = JSON.stringify(
        updatedInterventions.map(i => ({ id: i.id, totalCost: i.totalCost }))
      );
      
      // Uppdatera endast när kostnader ändras för att undvika oändlig loop
      if (currentCosts !== newCosts || safeFormData.totalExternalCosts !== totalExternalCosts) {
        // Update formData with new intervention costs and total
        setFormData(prevData => ({
          ...prevData,
          interventions: updatedInterventions,
          totalExternalCosts
        }));
      }
    }
  }, [safeFormData.interventions, safeFormData.totalExternalCosts, setFormData]);

  // Fix för andra useEffect med saknade beroenden (autosave)
  useEffect(() => {
    // Rensa befintliga timers
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Autospara endast om användern är inloggad
    if (currentUser?.uid) {
      // Förbered data för Firebase (undvik undefined)
      const dataToSave = prepareDataForSave(safeFormData);
      
      // Skapa autosave-timer
      autosaveTimerRef.current = setTimeout(() => {
        saveFormData(currentUser.uid, FORM_TYPE, dataToSave)
          .then(() => console.log('Autosparat'))
          .catch(err => console.error('Fel vid autosparande:', err));
      }, 2000);
    }

    // Rensa timer vid avmontering
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [currentUser, safeFormData]);

  // Exponera handleSave till föräldrakomponenten via ref
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      await handleSave();
    }
  }));

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormHData): Record<string, unknown> => {
    const preparedData: Record<string, unknown> = {
      organizationName: data.organizationName || '',
      contactPerson: data.contactPerson || '',
      timePeriod: data.timePeriod || '',
      totalExternalCosts: data.totalExternalCosts || 0
    };
    
    // Hantera insatser och kostnadsposter
    preparedData.interventions = (data.interventions || []).map(intervention => ({
      id: intervention.id,
      name: intervention.name || '',
      comment: intervention.comment || '',
      totalCost: intervention.totalCost || 0,
      costItems: (intervention.costItems || []).map(item => {
        // Kontrollera om amount är NaN och ersätt med null
        const amount = typeof item.amount === 'number' && !isNaN(item.amount) 
          ? item.amount 
          : null;
          
        return {
          id: item.id,
          interventionName: item.interventionName || '',
          subInterventionName: item.subInterventionName || '',
          costType: item.costType || '',
          amount: amount
        };
      })
    }));
    
    return preparedData;
  };

  const handleSave = async () => {
    if (!currentUser?.uid) {
      console.error('Du måste vara inloggad för att spara data');
      return;
    }

    try {
      const dataToSave = prepareDataForSave(safeFormData);
      
      await saveFormData(currentUser.uid, FORM_TYPE, dataToSave);
      
      console.log('Formuläret har sparats!');
    } catch (error) {
      console.error('Error saving form data:', error);
      console.error('Ett fel uppstod när formuläret skulle sparas till databasen.');
      throw error; // Kasta vidare felet så att föräldrakomponenten kan fånga det
    }
  };

  // Uppdatera en insats
  const updateIntervention = (updatedIntervention: Intervention) => {
    const updatedInterventions = safeFormData.interventions.map(intervention => 
      intervention.id === updatedIntervention.id ? updatedIntervention : intervention
    );
    
    setFormData(prev => ({
      ...prev,
      interventions: updatedInterventions
    }));
  };

  // Ta bort en insats
  const removeIntervention = (interventionId: string) => {
    const updatedInterventions = safeFormData.interventions.filter(
      intervention => intervention.id !== interventionId
    );
    
    setFormData(prev => ({
      ...prev,
      interventions: updatedInterventions
    }));
  };

  const handleChange = (field: keyof FormHData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Säkerställ att e-parameter har korrekt typ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange(name as keyof FormHData, value);
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

  // Funktion för att hämta insats från formulär G
  const fetchInterventionFromFormG = async () => {
    if (!currentUser?.uid) {
      console.error('Du måste vara inloggad för att hämta data');
      return;
    }

    try {
      const formGData = await loadFormData<FormGData>(currentUser.uid, 'G');
      
      if (!formGData || !formGData.interventions || formGData.interventions.length === 0) {
        setFetchMessageFormG('Inga insatser hittades i Formulär G.');
        return;
      }

      // Samla alla insatser och delinsatser från G
      const interventionGroups: Map<string, { 
        insatsName: string, 
        delinsatser: Array<{ name: string, externalCost: number | null }>
      }> = new Map();
      
      // Gruppera delinsatser per insats
      formGData.interventions.forEach(intervention => {
        if (intervention.costs && intervention.costs.length > 0) {
          const delinsatser = intervention.costs.map(cost => ({
            name: cost.name,
            externalCost: cost.externalCost !== null ? Math.round(cost.externalCost) : null
          }));
          
          interventionGroups.set(intervention.name, {
            insatsName: intervention.name,
            delinsatser: delinsatser
          });
        }
      });
      
      // Samla information om befintliga insatser och kostnadsposter i H
      const existingInterventions = new Map<string, Map<string, { id: string; amount: number | null }>>();
      
      safeFormData.interventions.forEach(intervention => {
        const costItemMap = new Map<string, { id: string; amount: number | null }>();
        (intervention.costItems || []).forEach(item => {
          costItemMap.set(item.subInterventionName, {
            id: item.id,
            amount: item.amount
          });
        });
        existingInterventions.set(intervention.name, costItemMap);
      });
      
      let added = 0;
      let updated = 0;
      const interventionsToUpdate: Intervention[] = [];
      
      // Gå igenom alla insatser från G
      for (const [insatsName, insatsData] of interventionGroups) {
        const targetIntervention = safeFormData.interventions.find(
          intervention => intervention.name === insatsName
        );
        
        const existingCostItems = existingInterventions.get(insatsName) || new Map<string, { id: string; amount: number | null }>();
        
        // Hitta delinsatser som behöver läggas till eller uppdateras
        const delinsatserToAdd: Array<{ name: string, externalCost: number | null }> = [];
        const delinsatserToUpdate: Array<{ name: string, externalCost: number | null, id: string }> = [];
        
        insatsData.delinsatser.forEach(delinsats => {
          const existingCostItem = existingCostItems.get(delinsats.name);
          if (!existingCostItem) {
            // Delinsatsen finns inte, lägg till
            delinsatserToAdd.push(delinsats);
          } else if (existingCostItem.amount !== delinsats.externalCost) {
            // Delinsatsen finns men beloppet har ändrats
            delinsatserToUpdate.push({...delinsats, id: existingCostItem.id});
          }
        });
        
        if (delinsatserToAdd.length > 0 || delinsatserToUpdate.length > 0) {
          if (!targetIntervention) {
            // Skapa ny insats om den inte finns
            const newIntervention: Intervention = {
              id: generateId(),
              name: insatsName,
              comment: '',
              costItems: [],
              totalCost: 0
            };
            
            // Lägg till alla nya kostnadsposter
            const newCostItems = delinsatserToAdd.map(delinsats => {
              // Kontrollera om externalCost är ett giltigt nummer
              const amount = typeof delinsats.externalCost === 'number' && !isNaN(delinsats.externalCost)
                ? delinsats.externalCost 
                : null;
                
              return {
                id: generateId(),
                interventionName: insatsName,
                subInterventionName: delinsats.name,
                costType: "Fast avgift för insats/offert", // Standard kostnadtyp
                amount: amount
              };
            });
            
            newIntervention.costItems = newCostItems;
            interventionsToUpdate.push(newIntervention);
            added += delinsatserToAdd.length;
          } else {
            // Uppdatera befintlig insats
            const updatedCostItems = [...(targetIntervention.costItems || [])];
            
            // Lägg till nya kostnadsposter
            if (delinsatserToAdd.length > 0) {
              const newCostItems = delinsatserToAdd.map(delinsats => {
                // Kontrollera om externalCost är ett giltigt nummer
                const amount = typeof delinsats.externalCost === 'number' && !isNaN(delinsats.externalCost)
                  ? delinsats.externalCost 
                  : null;
                  
                return {
                  id: generateId(),
                  interventionName: insatsName,
                  subInterventionName: delinsats.name,
                  costType: "Fast avgift för insats/offert", // Standard kostnadtyp
                  amount: amount
                };
              });
              updatedCostItems.push(...newCostItems);
              added += delinsatserToAdd.length;
            }
            
            // Uppdatera befintliga kostnadsposter
            if (delinsatserToUpdate.length > 0) {
              delinsatserToUpdate.forEach(delinsats => {
                const index = updatedCostItems.findIndex(item => item.id === delinsats.id);
                if (index !== -1) {
                  updatedCostItems[index] = {
                    ...updatedCostItems[index],
                    amount: typeof delinsats.externalCost === 'number' && !isNaN(delinsats.externalCost)
                      ? delinsats.externalCost 
                      : null
                  };
                }
              });
              updated += delinsatserToUpdate.length;
            }
            
            interventionsToUpdate.push({
              ...targetIntervention,
              costItems: updatedCostItems
            });
          }
        }
      }
      
      // Uppdatera alla insatser i ett svep
      if (interventionsToUpdate.length > 0) {
        const currentInterventions = [...safeFormData.interventions];
        const updatedInterventions: Intervention[] = [];
        
        // Uppdatera befintliga insatser
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
          setFetchMessageFormG(`${added} nya delinsatser tillagda och ${updated} befintliga uppdaterade från Formulär G.`);
        } else if (added > 0) {
          setFetchMessageFormG(`${added} nya delinsatser tillagda från Formulär G.`);
        } else if (updated > 0) {
          setFetchMessageFormG(`${updated} befintliga delinsatser uppdaterade från Formulär G.`);
        } else {
          setFetchMessageFormG('Inga ändringar behövdes, allt är redan uppdaterat.');
        }
      } else {
        setFetchMessageFormG('Alla insatser från Formulär G har redan hämtats.');
      }
    } catch (error) {
      console.error('Error fetching data from Form G:', error);
      console.error('Kunde inte hämta data från Formulär G.');
    }
  };

  // Hantera organisationsdatahämtning
  const handleOrgDataLoaded = (data: { organizationName: string; contactPerson: string; } | null) => {
    // ... existing code ...
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
              <h2 className="text-2xl font-bold">H – Insatsens påverkan</h2>
            </div>
            
          </div>
          
          {/* Lägga till externa insatser */}
          <div className="form-card">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader 
                title="Insatser och kostnader" 
                icon={<Wallet className="h-5 w-5 text-primary" />}
              />
              <div className="flex items-center gap-2">
                <FetchValueButton 
                  onClick={fetchInterventionFromFormG}
                  disabled={!currentUser?.uid}
                  message={fetchMessageFormG}
                />
              </div>
            </div>
            
            {safeFormData.interventions.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-primary/20 rounded-md">
                <p className="text-muted-foreground mb-4">
                  Det finns inga insatser att visa. Hämta insatser från Formulär G för att komma igång.
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    type="button" 
                    variant="default" 
                    className="gap-1"
                    onClick={fetchInterventionFromFormG}
                    disabled={!currentUser?.uid}
                  >
                    <ArrowDown className="h-4 w-4" />
                    Hämta från Formulär G
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {safeFormData.interventions.map((intervention, index) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    index={index}
                    onChange={updateIntervention}
                    onRemove={() => removeIntervention(intervention.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Summering */}
          <div className="form-card">
            <SectionHeader 
              title="Summering" 
              icon={<CreditCard className="h-5 w-5 text-primary" />}
            />
            
            <div className="grid gap-6 md:grid-cols-1">
              <ReadOnlyField
                label="H10 – Summa externa kostnader"
                value={formatCurrency(safeFormData.totalExternalCosts)}
                info="Summan av alla externa kostnader"
                highlight={true}
              />
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
});

export default FormH; 