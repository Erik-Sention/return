import { SharedFields } from '@/lib/firebase/sharedFields';

/**
 * Uppdaterar ett formulärs data med gemensamma fält
 * @param formData - Nuvarande formulärdata
 * @param sharedFields - De gemensamma fälten
 * @param options - Alternativ för hur fälten ska uppdateras
 * @returns Uppdaterad formulärdata med gemensamma fält
 */
export function updateFormWithSharedFields<T extends { 
  organizationName?: string; 
  contactPerson?: string; 
  timePeriod?: string; 
  startDate?: string; 
  endDate?: string;
}>(
  formData: T,
  sharedFields: SharedFields,
  options?: {
    includeTimePeriod?: boolean // Om true, uppdateras tidsfält, annars bevaras befintliga värden
  }
): T {
  const includeTimePeriod = options?.includeTimePeriod ?? false;
  
  // Skapa den uppdaterade datan
  const updatedData = {
    ...formData,
    // Säkerställ att strängar alltid har ett strängvärde, aldrig null eller undefined
    organizationName: sharedFields.organizationName || formData.organizationName || '',
    contactPerson: sharedFields.contactPerson || formData.contactPerson || '',
  };
  
  // Uppdatera tidsfält endast om includeTimePeriod är true
  if (includeTimePeriod) {
    // Kolla vilka tidsfält som finns i formuläret
    if ('startDate' in formData && 'endDate' in formData) {
      // Nytt format med separata datum
      updatedData.startDate = sharedFields.startDate || formData.startDate || '';
      updatedData.endDate = sharedFields.endDate || formData.endDate || '';
    } else if ('timePeriod' in formData) {
      // Äldre format med kombinerad tidsperiod
      if (sharedFields.startDate && sharedFields.endDate) {
        updatedData.timePeriod = `${sharedFields.startDate} - ${sharedFields.endDate}`;
      } else {
        updatedData.timePeriod = formData.timePeriod || '';
      }
    }
  } else if ('startDate' in formData && 'endDate' in formData) {
    // Även när includeTimePeriod är false, säkerställ att fälten har strängvärden
    updatedData.startDate = formData.startDate || '';
    updatedData.endDate = formData.endDate || '';
  }
  
  return updatedData;
} 