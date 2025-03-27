import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, ClipboardList, Wallet, CreditCard, PlusCircle, X, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Textarea } from '../ui/textarea';

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

// Generera ett unikt ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Konvertera null till undefined för FormattedNumberInput
const nullToUndefined = (value: number | null): number | undefined => {
  return value === null ? undefined : value;
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
    <div className="grid grid-cols-12 gap-2 items-center mb-1 p-1 rounded-md bg-background/30">
      <div className="col-span-3">
        <Input 
          value={costItem.subInterventionName || ''}
          onChange={(e) => onChange({ ...costItem, subInterventionName: e.target.value })}
          placeholder="Ange delinsats"
          className="text-sm"
        />
      </div>
      <div className="col-span-4">
        <select 
          value={costItem.costType || ''}
          onChange={(e) => onChange({ ...costItem, costType: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none"
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
          onChange={(value) => onChange({ ...costItem, amount: value === undefined ? null : value })}
          placeholder="0 kr"
          className="text-sm"
        />
      </div>
      <div className="col-span-1 flex justify-center">
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 text-red-500"
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
      costItems: [...intervention.costItems, newCostItem]
    });
  };

  const updateCostItem = (updatedCostItem: CostItem) => {
    const updatedCostItems = intervention.costItems.map(item => 
      item.id === updatedCostItem.id ? updatedCostItem : item
    );
    
    onChange({
      ...intervention,
      costItems: updatedCostItems
    });
  };

  const removeCostItem = (costItemId: string) => {
    const updatedCostItems = intervention.costItems.filter(item => item.id !== costItemId);
    
    onChange({
      ...intervention,
      costItems: updatedCostItems
    });
  };

  return (
    <div className="border border-border rounded-md p-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center">
            <span className="text-primary text-xs font-medium">{index + 1}</span>
          </div>
          <h4 className="font-medium">Insats</h4>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3 mb-3">
        <div>
          <label className="text-sm font-medium">Insatsnamn</label>
          <Input 
            value={intervention.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...intervention, name: e.target.value })}
            placeholder="Ange namn på insatsen"
            className="text-sm"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Kommentar (valfri)</label>
          <Textarea 
            value={intervention.comment || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...intervention, comment: e.target.value })}
            placeholder="Lägg till en kommentar om insatsen"
            className="text-sm h-16 resize-none"
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
            className="h-7 text-xs gap-1"
            onClick={addCostItem}
          >
            <PlusCircle className="h-3 w-3" />
            Lägg till kostnadspost
          </Button>
        </div>
        
        {intervention.costItems.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2 border border-dashed border-muted-foreground/20 rounded-md text-center">
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
            {intervention.costItems.map((costItem) => (
              <CostItemRow
                key={costItem.id}
                costItem={costItem}
                onChange={updateCostItem}
                onRemove={() => removeCostItem(costItem.id)}
              />
            ))}
            <div className="flex justify-end mt-2">
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
    timePeriod: '12 månader',
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchMessageFormG, setFetchMessageFormG] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Skapa en dependency för att uppdatera beräkningar när kostnaderna ändras
  const costsDependency = useMemo(() => {
    return safeFormData.interventions
      .map(intervention => 
        intervention.costItems
          .map(item => `${item.id}:${item.amount}`)
          .join('|')
      )
      .join('||');
  }, [safeFormData.interventions]);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setError(null);
          const data = await loadFormData<FormHData>(currentUser.uid, FORM_TYPE);
          if (data) {
            console.log('Loaded form data:', data);
            
            // Säkerställ att datan har rätt struktur
            const sanitizedData: FormHData = {
              ...data,
              interventions: (data.interventions || []).map(intervention => ({
                ...intervention,
                costItems: intervention.costItems || [],
                totalCost: intervention.totalCost || 0
              }))
            };
            
            setFormData(sanitizedData);
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

  // Beräkna total kostnad när kostnaderna ändras
  useEffect(() => {
    if (safeFormData.interventions) {
      const updatedInterventions = safeFormData.interventions.map(intervention => {
        // Beräkna totalbeloppet för varje insats
        const totalCost = (intervention.costItems || []).reduce(
          (sum, item) => sum + (item.amount || 0), 
          0
        );
        
        return { ...intervention, totalCost };
      });
      
      // Beräkna total extern kostnad
      const newTotalExternalCosts = updatedInterventions.reduce(
        (sum, intervention) => sum + intervention.totalCost, 
        0
      );
      
      setFormData(prev => ({
        ...prev,
        interventions: updatedInterventions,
        totalExternalCosts: newTotalExternalCosts
      }));
    }
  }, [costsDependency]);

  // Setup autosave whenever formData changes
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Only autosave if user is logged in and form has been interacted with
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

    // Cleanup timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, currentUser, safeFormData, safeFormData.interventions, safeFormData.totalExternalCosts]);

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
      costItems: (intervention.costItems || []).map(item => ({
        id: item.id,
        interventionName: item.interventionName || '',
        subInterventionName: item.subInterventionName || '',
        costType: item.costType || '',
        amount: item.amount === undefined ? null : item.amount
      }))
    }));
    
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

  // Lägga till en ny insats
  const addIntervention = () => {
    const newIntervention: Intervention = {
      id: generateId(),
      name: '',
      comment: '',
      costItems: [],
      totalCost: 0
    };
    
    setFormData(prev => ({
      ...prev,
      interventions: [...safeFormData.interventions, newIntervention]
    }));
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
      const interventionGroups: Map<string, { 
        insatsName: string, 
        delinsatser: Array<{ name: string, externalCost: number | null }>
      }> = new Map();
      
      // Gruppera delinsatser per insats
      formGData.interventions.forEach(intervention => {
        if (intervention.costs && intervention.costs.length > 0) {
          const delinsatser = intervention.costs.map(cost => ({
            name: cost.name,
            externalCost: cost.externalCost
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
        intervention.costItems.forEach(item => {
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
            const newCostItems = delinsatserToAdd.map(delinsats => ({
              id: generateId(),
              interventionName: insatsName,
              subInterventionName: delinsats.name,
              costType: "Fast avgift för insats/offert", // Standard kostnadtyp
              amount: delinsats.externalCost
            }));
            
            newIntervention.costItems = newCostItems;
            interventionsToUpdate.push(newIntervention);
            added += delinsatserToAdd.length;
          } else {
            // Uppdatera befintlig insats
            const updatedCostItems = [...targetIntervention.costItems];
            
            // Lägg till nya kostnadsposter
            if (delinsatserToAdd.length > 0) {
              const newCostItems = delinsatserToAdd.map(delinsats => ({
                id: generateId(),
                interventionName: insatsName,
                subInterventionName: delinsats.name,
                costType: "Fast avgift för insats/offert", // Standard kostnadtyp
                amount: delinsats.externalCost
              }));
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
                    amount: delinsats.externalCost
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
      setError('Kunde inte hämta data från Formulär G.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">H – Externa kostnader för insats</h2>
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
              <label className="text-sm font-medium">G1: Organisationens namn</label>
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
              <label className="text-sm font-medium">G2: Kontaktperson</label>
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
              <label className="text-sm font-medium">G3: Tidsperiod</label>
              <InfoLabel text="Ange tidsperiod (standard är 12 månader)" />
              <Input
                name="timePeriod"
                value={safeFormData.timePeriod || '12 månader'}
                onChange={handleInputChange}
                placeholder="Ange tidsperiod"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>
        
        {/* Insatser och kostnader */}
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
          
          {safeFormData.interventions.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-primary/20 rounded-md">
              <p className="text-muted-foreground mb-4">
                Det finns inga insatser att visa. Lägg till en insats för att komma igång eller hämta från Formulär G.
              </p>
              <div className="flex justify-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="gap-1"
                  onClick={fetchInterventionFromFormG}
                  disabled={!currentUser?.uid}
                >
                  <ArrowDown className="h-4 w-4" />
                  Hämta från Formulär G
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
    </div>
  );
});

export default FormH; 