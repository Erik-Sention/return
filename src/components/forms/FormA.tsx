import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';

interface FormAData {
  organizationName: string;
  contactPerson: string;
  businessDefinition: string;
  currentSituation: string;
  stressLevel: number;
  productionLoss: number;
  sickLeaveCost: number;
  causeAnalysis: string;
  goals: string;
  interventions: string[];
  recommendation: string;
}

const STORAGE_KEY = 'roi-calculator-form-a';
const FORM_TYPE = 'A';

export default function FormA() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormAData>({
    organizationName: '',
    contactPerson: '',
    businessDefinition: '',
    currentSituation: '',
    stressLevel: 0,
    productionLoss: 0,
    sickLeaveCost: 0,
    causeAnalysis: '',
    goals: '',
    interventions: [''],
    recommendation: ''
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
          const data = await loadFormData<FormAData>(currentUser.uid, FORM_TYPE);
          if (data) {
            console.log('Loaded form data:', data);
            setFormData(data);
          } else {
            // Fall back to localStorage if no data in Firebase
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
              console.log('Using localStorage data instead of Firebase');
              setFormData(JSON.parse(savedData));
            }
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
          setError('Kunde inte ladda data från databasen. Försöker med lokalt sparad data.');
          
          // Fall back to localStorage
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            try {
              setFormData(JSON.parse(savedData));
            } catch (e) {
              console.error('Error parsing localStorage data:', e);
            }
          }
        }
      } else {
        console.log('No user logged in, cannot load data from Firebase');
      }
    };

    loadFromFirebase();
  }, [currentUser]);

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
      
      // Save to both Firebase and localStorage for redundancy
      await saveFormData(currentUser.uid, FORM_TYPE, formData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      
      setSaveMessage('Formuläret har sparats!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving form data:', error);
      setError('Ett fel uppstod när formuläret skulle sparas till databasen. Data har sparats lokalt.');
      
      // Still try to save locally
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof FormAData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">A – Verksamhetsanalys</h2>
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
        
        {/* A1 & A2 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organisationens namn</label>
            <Input
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              placeholder="Ange organisationens namn"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kontaktperson</label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              placeholder="Ange kontaktperson"
            />
          </div>
        </div>

        {/* A3 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Steg 1 – Definition av verksamheten</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.businessDefinition}
            onChange={(e) => handleChange('businessDefinition', e.target.value)}
            placeholder="Beskriv verksamheten..."
          />
        </div>

        {/* A4 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Steg 2 – Nulägesbeskrivning, psykisk hälsa</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.currentSituation}
            onChange={(e) => handleChange('currentSituation', e.target.value)}
            placeholder="Beskriv nuläget..."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Andel av personalen med hög stressnivå (%)</label>
              <Input
                type="number"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Värde av produktionsbortfall (kr/år)</label>
              <Input
                type="number"
                value={formData.productionLoss}
                onChange={(e) => handleChange('productionLoss', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kostnad för sjukfrånvaro (kr/år)</label>
              <Input
                type="number"
                value={formData.sickLeaveCost}
                onChange={(e) => handleChange('sickLeaveCost', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* A5 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Steg 3 – Orsaksanalys och riskbedömning</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.causeAnalysis}
            onChange={(e) => handleChange('causeAnalysis', e.target.value)}
            placeholder="Beskriv orsaker och risker..."
          />
        </div>

        {/* A6 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Steg 4 – Målformulering och Behovsanalys</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.goals}
            onChange={(e) => handleChange('goals', e.target.value)}
            placeholder="Beskriv mål och behov..."
          />
        </div>

        {/* A7 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Steg 5 – Val av lämpliga insatser</h3>
          {formData.interventions.map((intervention, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={intervention}
                onChange={(e) => {
                  const newInterventions = [...formData.interventions];
                  newInterventions[index] = e.target.value;
                  handleChange('interventions', newInterventions);
                }}
                placeholder={`Insats ${index + 1}`}
              />
              {index === formData.interventions.length - 1 && (
                <Button
                  type="button"
                  onClick={() => handleChange('interventions', [...formData.interventions, ''])}
                >
                  +
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* A9 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Steg 7 – Rekommendation för beslut</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.recommendation}
            onChange={(e) => handleChange('recommendation', e.target.value)}
            placeholder="Ange rekommendation..."
          />
        </div>
      </div>
    </div>
  );
} 