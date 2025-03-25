import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';

interface FormCData {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
  totalPersonnelCosts?: number;
  companyProfit?: number;
  totalWorkValue: number;
  percentHighStress?: number;
  productionLossHighStress: number;
  totalProductionLoss: number;
  valueProductionLoss: number;
  costShortSickLeave?: number;
  percentShortSickLeaveMentalHealth: number;
  costShortSickLeaveMentalHealth: number;
  costLongSickLeave?: number;
  percentLongSickLeaveMentalHealth: number;
  costLongSickLeaveMentalHealth: number;
  totalCostSickLeaveMentalHealth: number;
  totalCostMentalHealth: number;
}


const FORM_TYPE = 'C';

export default function FormC() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormCData>({
    organizationName: '',
    contactPerson: '',
    timePeriod: '',
    totalPersonnelCosts: undefined,
    companyProfit: undefined,
    totalWorkValue: 0,
    percentHighStress: undefined,
    productionLossHighStress: 2.0,
    totalProductionLoss: 0,
    valueProductionLoss: 0,
    costShortSickLeave: undefined,
    percentShortSickLeaveMentalHealth: 6,
    costShortSickLeaveMentalHealth: 0,
    costLongSickLeave: undefined,
    percentLongSickLeaveMentalHealth: 40,
    costLongSickLeaveMentalHealth: 0,
    totalCostSickLeaveMentalHealth: 0,
    totalCostMentalHealth: 0
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setError(null);
          const data = await loadFormData<FormCData>(currentUser.uid, FORM_TYPE);
          if (data) {
            console.log('Loaded form data:', data);
            setFormData(data);
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

  // Beräkna automatiska värden när relevanta fält ändras
  useEffect(() => {
    const totalWorkValue = (formData.totalPersonnelCosts ?? 0) + (formData.companyProfit ?? 0);
    const totalProductionLoss = formData.productionLossHighStress;
    const valueProductionLoss = (totalWorkValue * totalProductionLoss) / 100;
  
    const costShortSickLeaveMentalHealth = ((formData.costShortSickLeave ?? 0) * formData.percentShortSickLeaveMentalHealth) / 100;
    const costLongSickLeaveMentalHealth = ((formData.costLongSickLeave ?? 0) * formData.percentLongSickLeaveMentalHealth) / 100;
  
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

  const handleSave = async () => {
    if (!currentUser?.uid) {
      setError('Du måste vara inloggad för att spara data');
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setError(null);
      
      console.log('Saving form data to Firebase:', formData);
      
      // Save only to Firebase
      await saveFormData(currentUser.uid, FORM_TYPE, formData);
      
      setSaveMessage('Formuläret har sparats!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Ett fel uppstod när formuläret skulle sparas till databasen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof FormCData, value: string | number) => {
    // Konvertera till nummer om det är ett numeriskt fält
    if (typeof formData[field] === 'number' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Hjälpfunktion för att formatera nummer med tusentalsavgränsare
  const formatNumber = (num: number): string => {
    return num.toLocaleString('sv-SE');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">C – Beräkningsmodell för ekonomiska konsekvenser av psykisk ohälsa</h2>
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
          <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {/* C1-C3 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">C1: Organisationens namn</label>
            <Input
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              placeholder="Ange organisationens namn"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">C2: Kontaktperson</label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              placeholder="Ange kontaktperson"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">C3: Tidsperiod (12 månader)</label>
            <Input
              value={formData.timePeriod}
              onChange={(e) => handleChange('timePeriod', e.target.value)}
              placeholder="t.ex. 2023-01-01 – 2023-12-31"
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-md">
          <h3 className="text-lg font-semibold mb-4">Beräkning av kostnad för produktionsbortfall pga psykisk ohälsa</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                C4: Totala personalkostnader (lön + sociala + kringkostnader), kr per år
              </label>
              <Input
                type="number"
                value={formData.totalPersonnelCosts ?? ''}
                onChange={(e) => handleChange('totalPersonnelCosts', e.target.value)}
                placeholder="Ange summa i kr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C5: Vinst i företaget, kr per år</label>
              <Input
                type="number"
                value={formData.companyProfit ?? ''}
                onChange={(e) => handleChange('companyProfit', e.target.value)}
                placeholder="Ange vinst i kr"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">C6: Summa, värde av arbete</label>
              <span className="font-semibold">
                {(formData.totalWorkValue ?? 0) > 0 ? `${formatNumber(formData.totalWorkValue)} kr` : ''}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">C7: Andel av personalen med hög stressnivå (%)</label>
              <Input
                type="number"
                value={formData.percentHighStress ?? ''}
                onChange={(e) => handleChange('percentHighStress', e.target.value)}
                placeholder="Ange andel i %"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">C8: Produktionsbortfall vid hög stressnivå (%)</label>
              <Input
                type="number"
                value={formData.productionLossHighStress ?? ''}
                onChange={(e) => handleChange('productionLossHighStress', e.target.value)}
                placeholder="t.ex. 2.0"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">C9: Totalt produktionsbortfall</label>
              <span className="font-semibold">
                {(formData.totalProductionLoss ?? 0) > 0 ? `${formData.totalProductionLoss}%` : ''}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">C10: Värde av produktionsbortfall (för över till ruta C18)</label>
              <span className="font-semibold">
                {(formData.valueProductionLoss ?? 0) > 0 ? `${formatNumber(formData.valueProductionLoss)} kr` : ''}
              </span>
            </div>
          </div>
        </div>


        <div className="p-4 bg-muted rounded-md">
          <h3 className="text-lg font-semibold mb-4">Beräkning av kostnad för sjukfrånvaro pga psykisk ohälsa</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                C11: Total kostnad för kort sjukfrånvaro (dag 1–14), kr per år
              </label>
              <Input
                type="number"
                value={formData.costShortSickLeave ?? ''}
                onChange={(e) => handleChange('costShortSickLeave', e.target.value)}
                placeholder="Ange total kostnad i kr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                C12: Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)
              </label>
              <Input
                type="number"
                value={formData.percentShortSickLeaveMentalHealth ?? ''}
                onChange={(e) => handleChange('percentShortSickLeaveMentalHealth', e.target.value)}
                placeholder="Ange andel i %"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">
                C13: Kostnad för kort sjukfrånvaro beroende på psykisk ohälsa, kr per år
              </label>
              <span className="font-semibold">
                {(formData.costShortSickLeaveMentalHealth ?? 0) > 0
                  ? `${formatNumber(formData.costShortSickLeaveMentalHealth)} kr`
                  : ''}
              </span>
            </div>
          </div>
        </div>


        <div className="p-4 bg-muted rounded-md">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                C14: Total kostnad för lång sjukfrånvaro (dag 15–), kr per år
              </label>
              <Input
                type="number"
                value={formData.costLongSickLeave ?? ''}
                onChange={(e) => handleChange('costLongSickLeave', e.target.value)}
                placeholder="Ange total kostnad i kr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                C15: Andel av lång sjukfrånvaro som beror på psykisk ohälsa (%)
              </label>
              <Input
                type="number"
                value={formData.percentLongSickLeaveMentalHealth ?? ''}
                onChange={(e) => handleChange('percentLongSickLeaveMentalHealth', e.target.value)}
                placeholder="Ange andel i %"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">
                C16: Kostnad för lång sjukfrånvaro beroende på psykisk ohälsa, kr per år
              </label>
              <span className="font-semibold">
                {(formData.costLongSickLeaveMentalHealth ?? 0) > 0
                  ? `${formatNumber(formData.costLongSickLeaveMentalHealth)} kr`
                  : ''}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">
                C17: Kostnad för sjukfrånvaro beroende på psykisk ohälsa, kr per år
              </label>
              <span className="font-semibold">
                {(formData.totalCostSickLeaveMentalHealth ?? 0) > 0
                  ? `${formatNumber(formData.totalCostSickLeaveMentalHealth)} kr`
                  : ''}
              </span>
            </div>
          </div>
        </div>


        <div className="p-4 bg-muted rounded-md">
          <h3 className="text-lg font-semibold mb-4">Summering av kostnad pga psykisk ohälsa</h3>
          
          <div className="mt-2 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">C18: Värde av produktionsbortfall, kr per år</label>
              <span className="font-semibold">{formatNumber(formData.valueProductionLoss)} kr</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">C19: Kostnad för sjukfrånvaro beroende på psykisk ohälsa, kr per år</label>
              <span className="font-semibold">{formatNumber(formData.totalCostSickLeaveMentalHealth)} kr</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-background rounded-md">
            <div className="flex justify-between">
              <label className="text-sm font-medium">C20: Total kostnad för psykisk ohälsa, kr per år</label>
              <span className="font-semibold">{formatNumber(formData.totalCostMentalHealth)} kr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 