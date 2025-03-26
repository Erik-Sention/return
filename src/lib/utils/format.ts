/**
 * Formaterar ett nummer med tusentalsavgränsare enligt svensk standard
 * @param num - Numret som ska formateras
 * @param decimals - Antal decimaler (valfritt, standard är 0)
 * @returns Formaterat nummer som sträng
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
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
export const formatCurrency = (amount: number): string => {
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