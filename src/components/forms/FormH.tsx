import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Save, Info, ClipboardList, Building, Wallet, CreditCard, PlusCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';
import { formatCurrency } from '@/lib/utils/format';
import { Textarea } from '../ui/textarea';

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

const FORM_TYPE = 'H';

// Definiera en typ för komponentens props
type FormHProps = React.ComponentProps<'div'>;

// Gör FormH till en forwardRef component
const FormH = forwardRef<FormHRef, FormHProps>(function FormH(props, ref) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormHData>({
    organizationName: '',
    contactPerson: '',
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

  // Beräkna totalsumma när kostnadsposter ändras
  useEffect(() => {
    // Förhindra att onödiga uppdateringar triggar en oändlig loop
    const costItemValues = safeFormData.interventions.map(intervention => 
      intervention.costItems.map(item => item.amount || 0).reduce((a, b) => a + b, 0)
    );
    
    const newTotalExternalCosts = costItemValues.reduce((a, b) => a + b, 0);
    
    // Endast uppdatera om det faktiskt är en ändring i totalsumman
    if (newTotalExternalCosts !== safeFormData.totalExternalCosts) {
      // Skapa uppdaterade interventions utan att ändra kostnadsposter
      const updatedInterventions = safeFormData.interventions.map((intervention, index) => {
        const totalCost = costItemValues[index];
        
        // Endast uppdatera totalCost om den faktiskt ändrats
        if (totalCost !== intervention.totalCost) {
          return {
            ...intervention,
            totalCost
          };
        }
        
        return intervention;
      });
      
      setFormData(prev => ({
        ...prev,
        interventions: updatedInterventions,
        totalExternalCosts: newTotalExternalCosts
      }));
    }
  }, [costsDependency]); // Ta bort safeFormData.interventions från dependency array

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
        
        {/* Organisationsuppgifter */}
        <div className="form-card">
          <SectionHeader 
            title="Organisationsuppgifter" 
            icon={<Building className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">H1 – Organisationens namn</label>
              <Input
                name="organizationName"
                value={safeFormData.organizationName || ''}
                onChange={handleInputChange}
                placeholder="Ange organisationens namn"
                className="bg-background/50"
              />
              <InfoLabel text="Exempel: Demo Alltjänst AB" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">H2 – Kontaktperson</label>
              <Input
                name="contactPerson"
                value={safeFormData.contactPerson || ''}
                onChange={handleInputChange}
                placeholder="Ange kontaktperson"
                className="bg-background/50"
              />
              <InfoLabel text="Exempel: Anna Andersson" />
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
          
          {safeFormData.interventions.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-primary/20 rounded-md">
              <p className="text-muted-foreground mb-4">
                Det finns inga insatser att visa. Lägg till en insats för att komma igång.
              </p>
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