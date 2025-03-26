import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Info, Target, FileText, Calendar, Users, Lightbulb, ListChecks } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFormData, loadFormData, setupFormAutosave } from '@/lib/firebase/formData';

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

// Definiera en typ för vad som ska exponeras via ref
export interface FormBRef {
  handleSave: () => Promise<void>;
}

// Lägg till InfoLabel-komponenten för att ge användaren information
const InfoLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Info className="w-3 h-3" />
    <span>{text}</span>
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

// Definiera en typ för komponentens props
type FormBProps = React.ComponentProps<'div'>;

const FORM_TYPE = 'B';

// Gör FormB till en forwardRef component
const FormB = forwardRef<FormBRef, FormBProps>(function FormB(props, ref) {
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
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setError(null);
          const data = await loadFormData<FormBData>(currentUser.uid, FORM_TYPE);
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

  // Exponera handleSave till föräldrakomponenten via ref
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      await handleSave();
    }
  }));

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
      const dataToSave = prepareDataForSave(formData);
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

  // Hjälpfunktion för att förbereda data innan sparande - ta bort alla undefined
  const prepareDataForSave = (data: FormBData): FormBData => {
    const preparedData = { ...data };
    
    // Ersätt undefined med null för alla fält
    Object.keys(preparedData).forEach(key => {
      const typedKey = key as keyof FormBData;
      if (typeof preparedData[typedKey] === 'undefined') {
        (preparedData as any)[typedKey] = null;
      }
    });
    
    return preparedData;
  };

  const handleChange = (field: keyof FormBData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">B – Verksamhetsanalys – insats</h2>
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
        
        {/* B1, B2, B3 */}
        <div className="form-card">
          <SectionHeader 
            title="Grundinformation" 
            icon={<FileText className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">B1: Organisationens namn</label>
              <Input
                value={formData.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                placeholder="Ange organisationens namn"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">B2: Kontaktperson</label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Ange kontaktperson"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">B3: Insatsnamn</label>
              <Input
                value={formData.initiativeName}
                onChange={(e) => handleChange('initiativeName', e.target.value)}
                placeholder="Ange insatsens namn"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>

        {/* B4 */}
        <div className="form-card">
          <SectionHeader 
            title="Vilka insatser avses?" 
            icon={<Target className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv insatsen och de delinsatser den eventuellt består av så tydligt som möjligt" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.initiativeDescription}
              onChange={(e) => handleChange('initiativeDescription', e.target.value)}
              placeholder="Beskriv insatserna..."
            />
          </div>
        </div>

        {/* B5 */}
        <div className="form-card">
          <SectionHeader 
            title="Syfte med insatserna" 
            icon={<Lightbulb className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv vad insatsen skall leda till för organisationen, verksamheten och/eller personalen" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="Beskriv syftet..."
            />
          </div>
        </div>

        {/* B6 */}
        <div className="form-card">
          <SectionHeader 
            title="Stöd för verksamhetens övergripande mål" 
            icon={<Target className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv vilka verksamhetsmål som stöds av den definierade insatsen samt ev på vilket sätt de övergripande mål stöds" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.supportForGoals}
              onChange={(e) => handleChange('supportForGoals', e.target.value)}
              placeholder="Beskriv vilka verksamhetsmål som stöds..."
            />
          </div>
        </div>

        {/* B7 */}
        <div className="form-card">
          <SectionHeader 
            title="Alternativa ansatser" 
            icon={<Lightbulb className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv de alternativ som analyserats, och motivera vald ansats" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.alternativeApproaches}
              onChange={(e) => handleChange('alternativeApproaches', e.target.value)}
              placeholder="Beskriv alternativa ansatser..."
            />
          </div>
        </div>

        {/* B8 */}
        <div className="form-card">
          <SectionHeader 
            title="Mål med insatserna" 
            icon={<Target className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv vad insatsen skall leda till för organisationen, verksamheten och/eller personalen" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
              placeholder="Beskriv målen..."
            />
          </div>
        </div>

        {/* B9 */}
        <div className="form-card">
          <SectionHeader 
            title="Målgrupp" 
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv vilka som skall nås av insatsen samt på vilket sätt de nås" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.targetGroup}
              onChange={(e) => handleChange('targetGroup', e.target.value)}
              placeholder="Beskriv målgruppen..."
            />
          </div>
        </div>

        {/* B10 */}
        <div className="form-card">
          <SectionHeader 
            title="När nås förväntad effekt av insatsen?" 
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv när effekten av insatsen kan nås – tidshorisont, kan vara olika effekt vid olika tidshorisonter" />
            <textarea
              className="w-full min-h-[100px] p-2 rounded-md border bg-background/50"
              value={formData.expectedEffect}
              onChange={(e) => handleChange('expectedEffect', e.target.value)}
              placeholder="Beskriv tidshorisont för förväntad effekt..."
            />
          </div>
        </div>

        {/* B11 */}
        <div className="form-card">
          <SectionHeader 
            title="Genomförandeplan" 
            icon={<ListChecks className="h-5 w-5 text-primary" />}
          />
          
          <div className="space-y-2">
            <InfoLabel text="Beskriv hur insatsen skall genomföras; aktiviteter, tidplan, ansvar" />
            {formData.implementationPlan.map((step, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <Input
                  value={step}
                  onChange={(e) => {
                    const newPlan = [...formData.implementationPlan];
                    newPlan[index] = e.target.value;
                    handleChange('implementationPlan', newPlan);
                  }}
                  placeholder={`Steg ${index + 1}`}
                  className="bg-background/50"
                />
                {index === formData.implementationPlan.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleChange('implementationPlan', [...formData.implementationPlan, ''])}
                  >
                    +
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <div></div> {/* Tom div för att behålla layoututrymmet */}
        </div>
      </div>
    </div>
  );
});

export default FormB; 