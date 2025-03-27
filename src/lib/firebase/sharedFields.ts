import { database } from './config';
import { ref, set, get, child } from 'firebase/database';

export interface SharedFields {
  organizationName: string;
  contactPerson: string;
  timePeriod: string;
}

/**
 * Hämta gemensamma fält från Form A (organisationsnamn och kontaktperson) och Form C (tidsperiod)
 * @param userId - Användarens ID
 * @returns De gemensamma fälten eller null om de inte finns
 */
export const loadSharedFields = async (userId: string): Promise<SharedFields | null> => {
  try {
    console.log(`Attempting to load shared fields for user ${userId}`);
    
    // Kontrollera om vi har en giltig databasreferens
    if (!database) {
      console.error('Firebase database is not initialized');
      return null;
    }
    
    const dbRef = ref(database);
    const sharedFields: SharedFields = {
      organizationName: '',
      contactPerson: '',
      timePeriod: ''
    };
    
    // STEG 1: Hämta alltid organisationsnamn och kontaktperson från Formulär A
    const formAPath = `users/${userId}/forms/A`;
    console.log('Loading organization name and contact person from Form A path:', formAPath);
    
    let snapshot = await get(child(dbRef, formAPath));
    
    if (snapshot.exists()) {
      const formAData = snapshot.val();
      console.log(`Form A data found:`, formAData);
      
      // Extrahera organisationsnamn och kontaktperson från Form A
      sharedFields.organizationName = formAData.organizationName || '';
      sharedFields.contactPerson = formAData.contactPerson || '';
    } else {
      console.log('No data found in Form A');
    }
    
    // STEG 2: Hämta alltid tidsperiod från Formulär C
    const formCPath = `users/${userId}/forms/C`;
    console.log('Loading time period from Form C path:', formCPath);
    
    snapshot = await get(child(dbRef, formCPath));
    
    if (snapshot.exists()) {
      const formCData = snapshot.val();
      console.log(`Form C data found:`, formCData);
      
      // Extrahera tidsperiod från Form C
      if (formCData.timePeriod) {
        sharedFields.timePeriod = formCData.timePeriod;
      }
    } else {
      console.log('No data found in Form C');
    }
    
    // Returnera fälten bara om vi har hittat något
    if (sharedFields.organizationName || sharedFields.contactPerson || sharedFields.timePeriod) {
      return sharedFields;
    }
    
    console.log(`No shared fields found`);
    return null;
  } catch (error) {
    console.error(`Error loading shared fields:`, error);
    return null;
  }
};

/**
 * Spara gemensamma fält till central lagring
 * @param userId - Användarens ID
 * @param data - De gemensamma fälten att spara
 */
export const saveSharedFields = async (userId: string, data: SharedFields): Promise<void> => {
  try {
    console.log(`Attempting to save shared fields for user ${userId}`);
    
    // Kontrollera om vi har en giltig databasreferens
    if (!database) {
      console.error('Firebase database is not initialized');
      return Promise.reject(new Error('Firebase database is not initialized'));
    }
    
    // Spara till den centrala lagringsplatsen
    const sharedFieldsRef = ref(database, `users/${userId}/sharedFields`);
    console.log('Shared fields reference path:', `users/${userId}/sharedFields`);
    
    await set(sharedFieldsRef, data);
    console.log(`Shared fields saved successfully`);
    
    // Uppdatera även tidsstämpeln
    const timestampRef = ref(database, `users/${userId}/sharedFields_timestamp`);
    await set(timestampRef, new Date().toISOString());
    console.log('Timestamp updated successfully');
    
    return Promise.resolve();
  } catch (error) {
    console.error(`Error saving shared fields:`, error);
    return Promise.reject(error);
  }
};

/**
 * Uppdatera gemensamma fält från det aktuella formuläret
 * @param userId - Användarens ID
 * @param formData - Data från formuläret som innehåller gemensamma fält
 */
export const updateSharedFieldsFromCurrentForm = async (userId: string, formData: Record<string, string | undefined>): Promise<void> => {
  if (!userId) return Promise.reject(new Error('No user ID provided'));
  
  try {
    const sharedFields: SharedFields = {
      organizationName: formData.organizationName || '',
      contactPerson: formData.contactPerson || '',
      timePeriod: formData.timePeriod || '' // Ta bort standardvärdet
    };
    
    await saveSharedFields(userId, sharedFields);
    return Promise.resolve();
  } catch (error) {
    console.error('Error updating shared fields:', error);
    return Promise.reject(error);
  }
}; 