import { useMemo } from 'react';

// Professionella färger som fungerar i både ljust och mörkt tema
// Färgerna har ökad mättnad och kontrast för att fungera väl i mörkt tema
// Varje färg har också en tydligare gräns för god läsbarhet
const COLORS = [
  { bg: '#1e3a5f30', border: '#3a6ea8' }, // mörkblå
  { bg: '#5f3a1e30', border: '#9c6240' }, // brunröd
  { bg: '#2e5f2e30', border: '#4c8c4c' }, // mörkgrön
  { bg: '#4e2a5f30', border: '#7a4c9c' }, // mörklila
  { bg: '#5f4e1e30', border: '#9c8040' }, // senap
  { bg: '#5f2a2a30', border: '#9c4c4c' }, // vinröd
  { bg: '#2a4e5f30', border: '#4c7a9c' }, // petrol
  { bg: '#36363630', border: '#707070' }, // mörkgrå
  { bg: '#2a3a4f30', border: '#4c6480' }, // marinblå
  { bg: '#4f2a3a30', border: '#804c60' }  // bordeaux
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