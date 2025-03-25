import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave, setupFormDataListener } from '@/lib/firebase/formData';

interface FormBData {
  organizationName: string;
  contactPerson: string;
  initiativeName: string;
  initiativeDescription: string;
  purpose: string;
  supportForGoals: string;
  alternativeApproaches: string;
  goals: string;
  targetGroup: string;
  expectedEffect: string;
  implementationPlan: string[];
}

const STORAGE_KEY = 'roi-calculator-form-b';
const FORM_TYPE = 'formB' as const;

export default function FormB() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormBData>({
    organizationName: '',
    contactPerson: '',
    initiativeName: '',
    initiativeDescription: '',
    purpose: '',
    supportForGoals: '',
    alternativeApproaches: '',
    goals: '',
    targetGroup: '',
    expectedEffect: '',
    implementationPlan: ['']
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
          <h2 className="text-2xl font-bold">Formulär B – Verksamhetsanalys – insats</h2>
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
        
        {/* B1, B2, B3 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">B1: Organisationens namn</label>
            <Input
              value={formData.organizationName}
              onChange={handleChange}
              name="organizationName"
              placeholder="Ange organisationens namn"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">B2: Kontaktperson</label>
            <Input
              value={formData.contactPerson}
              onChange={handleChange}
              name="contactPerson"
              placeholder="Ange kontaktperson"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">B3: Insatsnamn</label>
            <Input
              value={formData.initiativeName}
              onChange={handleChange}
              name="initiativeName"
              placeholder="Ange insatsens namn"
            />
          </div>
        </div>

        {/* B4 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Vilka insatser avses?</h3>
          <p className="text-sm text-muted-foreground">Beskriv insatsen och de delinsatser den eventuellt består av så tydligt som möjligt</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.initiativeDescription}
            onChange={handleChange}
            name="initiativeDescription"
            placeholder="Beskriv insatserna..."
          />
        </div>

        {/* B5 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Syfte med insatserna</h3>
          <p className="text-sm text-muted-foreground">Beskriv vad insatsen skall leda till för organisationen, verksamheten och/eller personalen</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.purpose}
            onChange={handleChange}
            name="purpose"
            placeholder="Beskriv syftet..."
          />
        </div>

        {/* B6 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Stöd för verksamhetens övergripande mål</h3>
          <p className="text-sm text-muted-foreground">Beskriv vilka verksamhetsmål som stöds av den definierade insatsen samt ev på vilket sätt de övergripande mål stöds</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.supportForGoals}
            onChange={handleChange}
            name="supportForGoals"
            placeholder="Beskriv vilka verksamhetsmål som stöds..."
          />
        </div>

        {/* B7 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Alternativa ansatser</h3>
          <p className="text-sm text-muted-foreground">Beskriv de alternativ som analyserats, och motivera vald ansats</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.alternativeApproaches}
            onChange={handleChange}
            name="alternativeApproaches"
            placeholder="Beskriv alternativa ansatser..."
          />
        </div>

        {/* B8 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Mål med insatserna</h3>
          <p className="text-sm text-muted-foreground">Beskriv vad insatsen skall leda till för organisationen, verksamheten och/eller personalen</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.goals}
            onChange={handleChange}
            name="goals"
            placeholder="Beskriv målen..."
          />
        </div>

        {/* B9 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Målgrupp</h3>
          <p className="text-sm text-muted-foreground">Beskriv vilka som skall nås av insatsen samt på vilket sätt de nås</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.targetGroup}
            onChange={handleChange}
            name="targetGroup"
            placeholder="Beskriv målgruppen..."
          />
        </div>

        {/* B10 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">När nås förväntad effekt av insatsen?</h3>
          <p className="text-sm text-muted-foreground">Beskriv när effekten av insatsen kan nås – tidshorisont, kan vara olika effekt vid olika tidshorisonter</p>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border bg-background"
            value={formData.expectedEffect}
            onChange={handleChange}
            name="expectedEffect"
            placeholder="Beskriv tidshorisont för förväntad effekt..."
          />
        </div>

        {/* B11 */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Genomförandeplan</h3>
          <p className="text-sm text-muted-foreground">Beskriv hur insatsen skall genomföras; aktiviteter, tidplan, ansvar</p>
          {formData.implementationPlan.map((step, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={step}
                onChange={handleChange}
                name={`implementationPlan.${index}`}
                placeholder={`Steg ${index + 1}`}
              />
              {index === formData.implementationPlan.length - 1 && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFormData(prev => ({
                      ...prev,
                      implementationPlan: [...prev.implementationPlan, '']
                    }));
                  }}
                >
                  +
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 