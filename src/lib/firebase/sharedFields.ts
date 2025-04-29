import { database } from './config';
import { ref, set, get, child } from 'firebase/database';

export interface SharedFields {
  organizationName: string;
  contactPerson: string;
  startDate: string;
  endDate: string;
}

/**
 * Hämta gemensamma fält från Form A (organisationsnamn och kontaktperson) och Form D (tidsperiod)
 * @param userId - Användarens ID
 * @param projectId - Projekt-ID för projektspecifik datalagring (optional)
 * @returns De gemensamma fälten eller null om de inte finns
 */
export const loadSharedFields = async (userId: string, projectId?: string | null): Promise<SharedFields | null> => {
  try {
    console.log(`[DEBUG] loadSharedFields: Attempting to load shared fields for user ${userId}${projectId ? ` and project ${projectId}` : ''}`);
    
    // Kontrollera om vi har en giltig databasreferens
    if (!database) {
      console.error('Firebase database is not initialized');
      return null;
    }
    
    const dbRef = ref(database);
    const sharedFields: SharedFields = {
      organizationName: '',
      contactPerson: '',
      startDate: '',
      endDate: ''
    };
    
    // Bestäm sökväg baserat på om vi har ett projektId eller inte
    const formPrefix = projectId 
      ? `users/${userId}/projectForms/${projectId}`
      : `users/${userId}/forms`;
    
    // STEG 1: Hämta organisationsnamn och kontaktperson från Formulär A
    const formAPath = `${formPrefix}/A`;
    console.log('[DEBUG] loadSharedFields: Loading organization name and contact person from path:', formAPath);
    
    let snapshot = await get(child(dbRef, formAPath));
    
    if (snapshot.exists()) {
      const formAData = snapshot.val();
      console.log(`[DEBUG] loadSharedFields: Form A data found:`, formAData);
      
      // Extrahera organisationsnamn och kontaktperson från Form A
      sharedFields.organizationName = formAData.organizationName || '';
      sharedFields.contactPerson = formAData.contactPerson || '';
      console.log(`[DEBUG] loadSharedFields: Extracted from Form A: organizationName="${sharedFields.organizationName}", contactPerson="${sharedFields.contactPerson}"`);
    } else {
      console.log('[DEBUG] loadSharedFields: No data found in Form A');
    }
    
    // STEG 2: Hämta start- och slutdatum från Formulär D
    const formDPath = `${formPrefix}/D`;
    console.log('[DEBUG] loadSharedFields: Loading start and end date from path:', formDPath);
    
    snapshot = await get(child(dbRef, formDPath));
    
    if (snapshot.exists()) {
      const formDData = snapshot.val();
      console.log(`[DEBUG] loadSharedFields: Form D data found:`, formDData);
      
      // VIKTIGT: Hämta också organizationName och contactPerson från Form D om det finns
      if (formDData.organizationName) {
        sharedFields.organizationName = formDData.organizationName;
        console.log(`[DEBUG] loadSharedFields: Updated organizationName from Form D: "${sharedFields.organizationName}"`);
      }
      
      if (formDData.contactPerson) {
        sharedFields.contactPerson = formDData.contactPerson;
        console.log(`[DEBUG] loadSharedFields: Updated contactPerson from Form D: "${sharedFields.contactPerson}"`);
      }
      
      // Extrahera startdatum och slutdatum från Form D
      if (formDData.startDate) {
        sharedFields.startDate = formDData.startDate;
      }
      if (formDData.endDate) {
        sharedFields.endDate = formDData.endDate;
      }
      console.log(`[DEBUG] loadSharedFields: Dates from Form D: startDate="${sharedFields.startDate}", endDate="${sharedFields.endDate}"`);
    } else {
      console.log('[DEBUG] loadSharedFields: No data found in Form D');
      
      // Om Form D inte har data, försök med Form C (för bakåtkompatibilitet)
      const formCPath = `${formPrefix}/C`;
      console.log('[DEBUG] loadSharedFields: Trying to load time period from path:', formCPath);
      
      snapshot = await get(child(dbRef, formCPath));
      
      if (snapshot.exists()) {
        const formCData = snapshot.val();
        console.log(`[DEBUG] loadSharedFields: Form C data found:`, formCData);
        
        // Om formCData har timePeriod, försök att dela upp den i start- och slutdatum
        if (formCData.timePeriod) {
          const parts = formCData.timePeriod.split(' - ');
          if (parts.length === 2) {
            sharedFields.startDate = parts[0];
            sharedFields.endDate = parts[1];
            console.log(`[DEBUG] loadSharedFields: Split timePeriod from Form C: startDate="${sharedFields.startDate}", endDate="${sharedFields.endDate}"`);
          }
        }
      }
    }
    
    // Returnera fälten bara om vi har hittat något
    if (sharedFields.organizationName || sharedFields.contactPerson || sharedFields.startDate || sharedFields.endDate) {
      console.log(`[DEBUG] loadSharedFields: Returning shared fields:`, sharedFields);
      return sharedFields;
    }
    
    console.log(`[DEBUG] loadSharedFields: No shared fields found`);
    return null;
  } catch (error) {
    console.error(`[DEBUG] loadSharedFields: Error loading shared fields:`, error);
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
 * @param projectId - Projekt-ID för projektspecifik datalagring
 */
export const updateSharedFieldsFromCurrentForm = async (
  userId: string, 
  formData: Record<string, unknown>,
  projectId?: string | null
): Promise<void> => {
  if (!userId) return Promise.reject(new Error('No user ID provided'));
  
  try {
    const sharedFields: SharedFields = {
      organizationName: typeof formData.organizationName === 'string' ? formData.organizationName : '',
      contactPerson: typeof formData.contactPerson === 'string' ? formData.contactPerson : '',
      startDate: typeof formData.startDate === 'string' ? formData.startDate : '',
      endDate: typeof formData.endDate === 'string' ? formData.endDate : ''
    };
    
    if (projectId) {
      // Om vi har ett projektId, spara gemensamma fält till den projektspecifika lagringsplatsen
      const sharedFieldsRef = ref(database, `users/${userId}/projectForms/${projectId}/sharedFields`);
      await set(sharedFieldsRef, sharedFields);
      console.log(`Shared fields saved successfully for project ${projectId}`);
      
      // Uppdatera även tidsstämpeln
      const timestampRef = ref(database, `users/${userId}/projectForms/${projectId}/sharedFields_timestamp`);
      await set(timestampRef, new Date().toISOString());
      console.log('Project timestamp updated successfully');
    } else {
      // Annars använd standardlagringsplatsen för gemensamma fält
      await saveSharedFields(userId, sharedFields);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error updating shared fields:', error);
    return Promise.reject(error);
  }
};

/**
 * Hämta organisationsinformation från Form D (organisationsnamn och kontaktperson)
 * @param userId - Användarens ID
 * @param projectId - Projekt-ID för projektspecifik datalagring (optional)
 * @returns Organisationens namn och kontaktperson eller null om de inte finns
 */
export const loadOrganizationInfoFromFormD = async (userId: string, projectId?: string | null): Promise<{ 
  organizationName: string, 
  contactPerson: string,
  startDate: string,
  endDate: string 
} | null> => {
  try {
    console.log(`Hämtar organisationsinfo från formulär D för användare ${userId}${projectId ? ` och projekt ${projectId}` : ''}`);
    
    // Kontrollera om vi har en giltig databasreferens
    if (!database) {
      console.error('Firebase database is not initialized');
      return null;
    }
    
    const dbRef = ref(database);
    
    // Bestäm sökväg baserat på om vi har ett projektId eller inte
    const formPath = projectId 
      ? `users/${userId}/projectForms/${projectId}/D`
      : `users/${userId}/forms/D`;
      
    console.log('Hämtar från sökväg:', formPath);
    
    const snapshot = await get(child(dbRef, formPath));
    
    if (snapshot.exists()) {
      const formDData = snapshot.val();
      console.log(`Formulär D-data hittad:`, formDData);
      
      // Extrahera organisationsnamn, kontaktperson och datum från Form D
      const organizationInfo = {
        organizationName: formDData.organizationName || '',
        contactPerson: formDData.contactPerson || '',
        startDate: formDData.startDate || '',
        endDate: formDData.endDate || ''
      };
      
      // Returnera bara om minst ett av fälten har data
      if (organizationInfo.organizationName || organizationInfo.contactPerson || 
          organizationInfo.startDate || organizationInfo.endDate) {
        return organizationInfo;
      }
    } else {
      console.log('Ingen data hittad i Formulär D');
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading organization info from Form D:`, error);
    return null;
  }
}; 