/**
 * Formaterar ett nummer med tusentalsavgränsare enligt svensk standard
 * @param num - Numret som ska formateras
 * @param decimals - Antal decimaler (valfritt, standard är 0)
 * @returns Formaterat nummer som sträng
 */
export const formatNumber = (num: number | null | undefined, decimals: number = 0): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('sv-SE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formaterar ett belopp med valuta (SEK)
 * @param amount - Beloppet som ska formateras
 * @returns Formaterat belopp med valuta
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  return `${formatNumber(amount)} kr`;
};

/**
 * Formaterar en procentandel
 * @param percentage - Procentandelen som ska formateras
 * @returns Formaterad procentandel med %-tecken
 */
export const formatPercentage = (percentage: number): string => {
  return `${formatNumber(percentage, 1)}%`;
};

/**
 * Formaterar en textsträng som representerar ett nummer med tusentalsavgränsare
 * för användning i input-fält
 * @param value - Värdet som ska formateras (kan vara tom sträng eller undefined)
 * @param allowDecimals - Om decimaler ska tillåtas (standard: true)
 * @returns Ett objekt med formaterat värde och eventuellt felmeddelande
 */
export const formatNumberInput = (
  value: string | number | undefined,
  allowDecimals: boolean = true
): { formattedValue: string; rawValue: number | undefined; warning: string | null } => {
  // Om värdet är undefined, null eller tom sträng, returnera tomma värden
  if (value === undefined || value === null || value === '') {
    return { formattedValue: '', rawValue: undefined, warning: null };
  }

  // Konvertera värdet till sträng om det är ett nummer
  const stringValue = typeof value === 'number' ? value.toString() : value;
  
  // Ta bort befintliga tusentalsavgränsare (mellanslag i svensk standard)
  let cleanValue = stringValue.replace(/\s/g, '');
  
  // Kontrollera om värdet innehåller kommatecken och ersätt med punkt
  let warning: string | null = null;
  if (cleanValue.includes(',')) {
    warning = 'Använd punkt (.) istället för kommatecken (,) för decimaler';
    cleanValue = cleanValue.replace(',', '.');
  }
  
  // Validera att värdet nu är ett giltigt nummer
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) {
    return { formattedValue: '', rawValue: undefined, warning: 'Ogiltigt numeriskt värde' };
  }
  
  // Om decimaler inte är tillåtna, avrunda till heltal
  const finalValue = allowDecimals ? numValue : Math.round(numValue);
  
  // Formatera för visning med tusentalsavgränsare
  // Hantera decimaler separat för att behålla dem under inmatning
  let formattedValue = '';
  
  if (allowDecimals && cleanValue.includes('.')) {
    // Dela upp värdet i heltal och decimaldel
    const parts = cleanValue.split('.');
    // Formatera heltalet med tusentalsavgränsare
    const integerPart = parseInt(parts[0]);
    if (!isNaN(integerPart)) {
      formattedValue = integerPart.toLocaleString('sv-SE');
    } else {
      formattedValue = '0';
    }
    // Lägg till decimaldelen
    formattedValue += '.' + parts[1];
  } else {
    // Formatera utan decimaler
    formattedValue = finalValue.toLocaleString('sv-SE');
  }
  
  return { 
    formattedValue, 
    rawValue: finalValue,
    warning 
  };
}; 