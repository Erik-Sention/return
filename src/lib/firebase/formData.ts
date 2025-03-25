import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import { app } from './config';

const database = getDatabase(app);

type FormType = 'formA' | 'formB';

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

type FormData = FormAData | FormBData;

/**
 * Saves form data to Firebase Realtime Database
 * @param userId - The current user's ID
 * @param formType - The type of form (A, B, C, etc.)
 * @param data - The form data to save
 */
export const saveFormData = async (userId: string, formType: FormType, data: FormData) => {
  try {
    console.log('Försöker spara data till Firebase:', { userId, formType });
    
    if (!database) {
      throw new Error('Firebase-databasen är inte initialiserad');
    }

    const formRef = ref(database, `users/${userId}/forms/${formType}`);
    await set(formRef, data);
    console.log('Data sparad framgångsrikt till Firebase');
  } catch (error) {
    console.error('Fel vid sparande till Firebase:', error);
    throw new Error('Kunde inte spara data till databasen');
  }
};

/**
 * Loads form data from Firebase Realtime Database
 * @param userId - The current user's ID
 * @param formType - The type of form (A, B, C, etc.)
 * @returns The form data or null if not found
 */
export const loadFormData = async <T extends FormData>(userId: string, formType: FormType): Promise<T | null> => {
  try {
    console.log('Försöker ladda data från Firebase:', { userId, formType });
    
    if (!database) {
      throw new Error('Firebase-databasen är inte initialiserad');
    }

    const formRef = ref(database, `users/${userId}/forms/${formType}`);
    const snapshot = await get(formRef);
    
    if (snapshot.exists()) {
      console.log('Data laddad framgångsrikt från Firebase');
      return snapshot.val() as T;
    }
    
    console.log('Ingen data hittades i Firebase');
    return null;
  } catch (error) {
    console.error('Fel vid laddning från Firebase:', error);
    throw new Error('Kunde inte ladda data från databasen');
  }
};

/**
 * Enable autosaving for a form
 * @param userId - The current user's ID
 * @param formType - The type of form (A, B, C, etc.)
 * @param data - The form data to save
 * @param setIsSaving - Function to update saving state
 * @param setSaveMessage - Function to update save message
 */
export const setupFormAutosave = <T>(
  userId: string | undefined,
  formType: string, 
  data: T,
  setIsSaving: (saving: boolean) => void,
  setSaveMessage: (message: string | null) => void
): NodeJS.Timeout | null => {
  if (!userId) {
    console.log('Cannot setup autosave: No user ID provided');
    return null;
  }
  
  // Create autosave timer
  return setTimeout(async () => {
    try {
      console.log(`Autosaving form ${formType}...`);
      setIsSaving(true);
      await saveFormData(userId, formType as FormType, data);
      console.log(`Autosave successful for form ${formType}`);
      setSaveMessage('Autosparat');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Autosave error:', error);
      setSaveMessage('Kunde inte spara automatiskt');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, 10000); // Autosave after 10 seconds of inactivity
};

export const setupFormDataListener = (
  userId: string,
  formType: FormType,
  callback: (data: FormData | null) => void
) => {
  try {
    console.log('Sätter upp lyssnare för Firebase:', { userId, formType });
    
    if (!database) {
      throw new Error('Firebase-databasen är inte initialiserad');
    }

    const formRef = ref(database, `users/${userId}/forms/${formType}`);
    
    const unsubscribe = onValue(formRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('Ny data mottagen från Firebase');
        callback(snapshot.val());
      } else {
        console.log('Ingen data hittades i Firebase');
        callback(null);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Fel vid uppsättning av Firebase-lyssnare:', error);
    throw new Error('Kunde inte sätta upp databaslyssnare');
  }
}; 