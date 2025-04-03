import { useMemo } from 'react';

// Professionella färger som fungerar i både ljust och mörkt tema
// Varje färg har en mer dämpad ton med högre kontrast mot bakgrunden
// Färgerna är valda för att vara både distinkta och professionella
const COLORS = [
  { bg: '#e0eaf4', border: '#b0c8e0' }, // stålblå
  { bg: '#f0e8e0', border: '#d8c0a8' }, // mocka
  { bg: '#e0ebe0', border: '#b8d0b8' }, // jadegrön
  { bg: '#e8e0e8', border: '#c8b0c8' }, // plommon
  { bg: '#f0e8d0', border: '#d8c4a0' }, // sand
  { bg: '#e8d8d8', border: '#c8a8a8' }, // terrakotta
  { bg: '#d8e8e8', border: '#a8c8c8' }, // slate
  { bg: '#e8e8e8', border: '#c0c0c0' }, // grafit
  { bg: '#dce4e8', border: '#b0c0c8' }, // dimblå
  { bg: '#e8e0e0', border: '#c8b0b0' }  // mauve
];

/**
 * Beräknar ett färgindex baserat på ett givet insatsnamn
 * Detta säkerställer att samma insatsnamn alltid får samma färg
 */
const getColorIndexForName = (name: string): number => {
  if (!name) return 0;
  
  // Beräkna en enkel hash för namnet
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash = hash & hash; // Konvertera till 32-bit int
  }
  
  // Använd absolutvärde och ta modulo av arrayens längd
  return Math.abs(hash) % COLORS.length;
};

/**
 * Hook som returnerar färger för ett interventionsnamn
 */
export const useInterventionColor = (interventionName: string) => {
  return useMemo(() => {
    const colorIndex = getColorIndexForName(interventionName);
    return COLORS[colorIndex];
  }, [interventionName]);
};

/**
 * Funktion som direkt returnerar färgen för ett interventionsnamn
 * Användbar när React hooks inte kan användas
 */
export const getInterventionColor = (interventionName: string) => {
  const colorIndex = getColorIndexForName(interventionName);
  return COLORS[colorIndex];
};

/**
 * Hjälpmetod som returnerar CSS-klasser för intervention styling
 */
export const getInterventionColorClasses = (interventionName: string) => {
  const { bg, border } = getInterventionColor(interventionName);
  return {
    headerClass: `bg-[${bg}] border-[${border}]`,
    borderClass: `border-[${border}]`,
    bgClass: `bg-[${bg}]`
  };
};

// Exportera färgpaletten för andra användningsområden
export const INTERVENTION_COLORS = COLORS; 