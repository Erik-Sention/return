import { SharedFields } from '@/lib/firebase/sharedFields';

/**
 * Uppdaterar ett formulärs data med gemensamma fält
 * @param formData - Nuvarande formulärdata
 * @param sharedFields - De gemensamma fälten
 * @param options - Alternativ för hur fälten ska uppdateras
 * @returns Uppdaterad formulärdata med gemensamma fält
 */
export function updateFormWithSharedFields<T extends { organizationName?: string; contactPerson?: string; timePeriod?: string }>(
  formData: T,
  sharedFields: SharedFields,
  options?: {
    includeTimePeriod?: boolean // Om true, uppdateras timePeriod, annars bevaras befintligt värde
  }
): T {
  const includeTimePeriod = options?.includeTimePeriod ?? false;
  
  // Skapa den uppdaterade datan
  const updatedData = {
    ...formData,
    organizationName: sharedFields.organizationName || formData.organizationName || '',
    contactPerson: sharedFields.contactPerson || formData.contactPerson || '',
  };
  
  // Uppdatera timePeriod endast om includeTimePeriod är true
  if (includeTimePeriod) {
    updatedData.timePeriod = sharedFields.timePeriod || formData.timePeriod || '';
  }
  
  return updatedData;
} 