import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave, setupFormDataListener } from '@/lib/firebase/formData';

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
const FORM_TYPE = 'formA' as const;

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
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setError(null);
        const data = await loadFormData(currentUser.uid, FORM_TYPE);
        if (data) {
          console.log('Loaded form data:', data);
          setFormData(data);
        }
      } catch (error) {
        console.error('Fel vid laddning av data:', error);
        setError('Kunde inte ladda data från databasen');
      }
    };

    loadData();
  }, [currentUser]);

  // Sätt upp lyssnare för realtidsuppdateringar
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = setupFormDataListener(currentUser.uid, FORM_TYPE, (data) => {
      if (data) {
        setFormData(data);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    try {
      setIsSaving(true);
      await saveFormData(currentUser.uid, FORM_TYPE, formData);
      setSaveMessage('Sparat');
      setError(null);
    } catch (error) {
      console.error('Fel vid sparande:', error);
      setError('Kunde inte spara data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
              onClick={handleSubmit} 
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
              onChange={handleChange}
              name="organizationName"
              placeholder="Ange organisationens namn"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kontaktperson</label>
            <Input
              value={formData.contactPerson}
              onChange={handleChange}
              name="contactPerson"
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
            onChange={handleChange}
            name="businessDefinition"
            placeholder="Beskriv verksamheten..."
          />
        </div>

        {/* A4 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Steg 2 – Nulägesbeskrivning, psykisk hälsa</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.currentSituation}
            onChange={handleChange}
            name="currentSituation"
            placeholder="Beskriv nuläget..."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Andel av personalen med hög stressnivå (%)</label>
              <Input
                type="number"
                value={formData.stressLevel}
                onChange={handleChange}
                name="stressLevel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Värde av produktionsbortfall (kr/år)</label>
              <Input
                type="number"
                value={formData.productionLoss}
                onChange={handleChange}
                name="productionLoss"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kostnad för sjukfrånvaro (kr/år)</label>
              <Input
                type="number"
                value={formData.sickLeaveCost}
                onChange={handleChange}
                name="sickLeaveCost"
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
            onChange={handleChange}
            name="causeAnalysis"
            placeholder="Beskriv orsaker och risker..."
          />
        </div>

        {/* A6 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Steg 4 – Målformulering och Behovsanalys</h3>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.goals}
            onChange={handleChange}
            name="goals"
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
                onChange={handleChange}
                name={`interventions.${index}`}
                placeholder={`Insats ${index + 1}`}
              />
              {index === formData.interventions.length - 1 && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFormData(prev => ({
                      ...prev,
                      interventions: [...prev.interventions, '']
                    }));
                  }}
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
            onChange={handleChange}
            name="recommendation"
            placeholder="Ange rekommendation..."
          />
        </div>
      </div>
    </div>
  );
} 