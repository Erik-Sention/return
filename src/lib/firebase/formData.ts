import { database } from './config';
import { ref, set, get, child, onValue, off} from 'firebase/database';

/**
 * Saves form data to Firebase Realtime Database
 * @param userId - The current user's ID
 * @param formType - The type of form (A, B, C, etc.)
 * @param data - The form data to save
 * @param projectId - Optional project ID för projektspecifik data
 */
export const saveFormData = async <T>(
  userId: string, 
  formType: string, 
  data: T, 
  projectId?: string | null
): Promise<void> => {
  try {
    console.log(`Attempting to save form ${formType}${projectId ? ` for project ${projectId}` : ''} for user ${userId}`);
    console.log('Database instance:', database);
    
    // Make sure we have a valid database reference
    if (!database) {
      console.error('Firebase database is not initialized');
      return Promise.reject(new Error('Firebase database is not initialized'));
    }

    // Bestäm sökväg baserat på om vi har ett projektId eller inte
    const formPath = projectId 
      ? `users/${userId}/projectForms/${projectId}/${formType}`
      : `users/${userId}/forms/${formType}`;
      
    const formRef = ref(database, formPath);
    console.log('Form reference path:', formPath);
    
    // Rekursivt ersätt alla undefined med null för att undvika Firebase-fel
    const sanitizedData = sanitizeDataForFirebase(data);
    
    await set(formRef, sanitizedData);
    console.log(`Form ${formType} data saved successfully`);
    
    // Also update the last updated timestamp
    const timestampPath = projectId
      ? `users/${userId}/projectForms/${projectId}/${formType}_timestamp`
      : `users/${userId}/forms/${formType}_timestamp`;
      
    const timestampRef = ref(database, timestampPath);
    await set(timestampRef, new Date().toISOString());
    console.log('Timestamp updated successfully');
    
    return Promise.resolve();
  } catch (error) {
    console.error(`Error saving form ${formType}:`, error);
    return Promise.reject(error);
  }
};

/**
 * Rekursivt sanitera data för Firebase genom att ersätta undefined med null
 * och hantera nested objekt och arrayer
 */
export function sanitizeDataForFirebase<T>(data: T): unknown {
  if (data === undefined) {
    return null;
  }
  
  if (data === null) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForFirebase(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitizedObject: Record<string, unknown> = {};
    
    Object.keys(data as object).forEach(key => {
      const value = (data as Record<string, unknown>)[key];
      sanitizedObject[key] = sanitizeDataForFirebase(value);
    });
    
    return sanitizedObject;
  }
  
  // Hantera NaN för numeriska värden
  if (typeof data === 'number' && isNaN(data)) {
    return null;
  }
  
  // Returerna primitiva värden som de är
  return data;
}

/**
 * Loads form data from Firebase Realtime Database
 * @param userId - The current user's ID
 * @param formType - The type of form (A, B, C, etc.)
 * @param projectId - Optional project ID för projektspecifik data
 * @returns The form data or null if not found
 */
export const loadFormData = async <T>(
  userId: string, 
  formType: string, 
  projectId?: string | null
): Promise<T | null> => {
  try {
    console.log(`Attempting to load form ${formType}${projectId ? ` for project ${projectId}` : ''} for user ${userId}`);
    
    // Make sure we have a valid database reference
    if (!database) {
      console.error('Firebase database is not initialized');
      return null;
    }
    
    const dbRef = ref(database);
    
    // Bestäm sökväg baserat på om vi har ett projektId eller inte
    const path = projectId 
      ? `users/${userId}/projectForms/${projectId}/${formType}`
      : `users/${userId}/forms/${formType}`;
      
    console.log('Loading from path:', path);
    
    const snapshot = await get(child(dbRef, path));
    
    if (snapshot.exists()) {
      console.log(`Form ${formType} data found:`, snapshot.val());
      return snapshot.val() as T;
    } else {
      console.log(`No data found for form ${formType}`);
      return null;
    }
  } catch (error) {
    console.error(`Error loading form ${formType}:`, error);
    return null;
  }
};

/**
 * Enable autosaving for a form
 * @param userId - The current user's ID
 * @param formType - The type of form (A, B, C, etc.)
 * @param data - The form data to save
 * @param setIsSaving - Function to update saving state
 * @param setSaveMessage - Function to update save message
 * @param projectId - Optional project ID för projektspecifik data
 */
export const setupFormAutosave = <T>(
  userId: string | undefined,
  formType: string, 
  data: T,
  setIsSaving: (saving: boolean) => void,
  setSaveMessage: (message: string | null) => void,
  projectId?: string | null
): NodeJS.Timeout | null => {
  if (!userId) {
    console.log('Cannot setup autosave: No user ID provided');
    return null;
  }
  
  // Create autosave timer
  return setTimeout(async () => {
    try {
      console.log(`Autosaving form ${formType}${projectId ? ` for project ${projectId}` : ''}...`);
      setIsSaving(true);
      
      // Sanitera data innan sparande
      const sanitizedData = sanitizeDataForFirebase(data);
      
      await saveFormData(userId, formType, sanitizedData, projectId);
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

/**
 * Set up a real-time listener for form data changes
 * @param userId - The current user's ID
 * @param formType - The type of form to listen to (A, B, C, etc.)
 * @param callback - Function to call when data changes
 * @param projectId - Optional project ID för projektspecifik data
 * @returns A function to unsubscribe the listener
 */
export const setupFormDataListener = <T>(
  userId: string,
  formType: string,
  callback: (data: T | null) => void,
  projectId?: string | null
): (() => void) => {
  if (!database || !userId) {
    console.error('Cannot setup listener: database not initialized or no userId provided');
    return () => {}; // Return empty function in case of error
  }

  console.log(`Setting up real-time listener for form ${formType}${projectId ? ` for project ${projectId}` : ''} for user ${userId}`);
  
  // Bestäm sökväg baserat på om vi har ett projektId eller inte
  const formPath = projectId 
    ? `users/${userId}/projectForms/${projectId}/${formType}`
    : `users/${userId}/forms/${formType}`;
    
  const formRef = ref(database, formPath);
  
  // Set up the listener
  onValue(formRef, (snapshot) => {
    if (snapshot.exists()) {
      console.log(`Real-time update received for form ${formType}:`, snapshot.val());
      callback(snapshot.val() as T);
    } else {
      console.log(`No data found for form ${formType} in real-time update`);
      callback(null);
    }
  }, (error) => {
    console.error(`Error in real-time listener for form ${formType}:`, error);
    callback(null);
  });
  
  // Return a function to unsubscribe
  return () => {
    console.log(`Removing real-time listener for form ${formType}`);
    off(formRef);
  };
}; 