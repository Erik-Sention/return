import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

// Utöka jsPDF-typen för att inkludera lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Definiera typer för enkel ROI-kalkylator
interface SimpleROIResults {
  annual_salary_cost: number;
  social_fees_cost: number;
  personnel_overhead: number;
  total_personnel_cost: number;
  short_term_days: number;
  long_term_days: number;
  short_term_mental_health_cost: number;
  long_term_mental_health_cost: number;
  total_mental_health_cost: number;
  total_production_loss: number;
  total_sick_leave_cost: number;
  intervention_cost: number;
  economic_benefit: number;
  economic_surplus: number;
  roi_percentage: number;
  break_even_effect: number;
}

interface SimpleROIData {
  num_employees: number | undefined;
  avg_monthly_salary: number | undefined;
  social_fees: number | undefined;
  personnel_costs: number | undefined;
  stress_level: number | undefined;
  production_loss: number | undefined;
  workdays_per_year: number | undefined;
  short_term_absence: number | undefined;
  long_term_absence: number | undefined;
  intervention_cost: number | undefined;
  expected_reduction: number | undefined;
}

// Definiera typer för jämförande ROI-kalkylator
interface InterventionResult {
  id: string;
  name: string;
  cost: number;
  economic_benefit: number;
  economic_surplus: number;
  roi_percentage: number;
  break_even_effect: number;
}

interface ComparativeROIResults {
  annual_salary_cost: number;
  social_fees_cost: number;
  personnel_overhead: number;
  total_personnel_cost: number;
  short_term_days: number;
  long_term_days: number;
  short_term_mental_health_cost: number;
  long_term_mental_health_cost: number;
  total_mental_health_cost: number;
  total_production_loss: number;
  total_sick_leave_cost: number;
  intervention_results: InterventionResult[];
}

interface ComparativeROIData {
  num_employees: number | undefined;
  avg_monthly_salary: number | undefined;
  social_fees: number | undefined;
  personnel_costs: number | undefined;
  stress_level: number | undefined;
  production_loss: number | undefined;
  workdays_per_year: number | undefined;
  short_term_absence: number | undefined;
  long_term_absence: number | undefined;
  interventions: Array<{
    id: string;
    name: string;
    cost: number | undefined;
    expected_reduction: number | undefined;
  }>;
}

// Formatera nummer med vald valuta
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(value);
};

// Formattera procent
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Formattera heltal
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('sv-SE').format(value);
};

// Skapa en cirkeldiagram-liknande visualisering
const drawDonutChart = (
  pdf: jsPDF, 
  x: number, 
  y: number, 
  radius: number, 
  innerRadius: number, 
  value: number, 
  maxValue: number, 
  color: [number, number, number],
  bgColor: [number, number, number] = [220, 220, 220]
) => {
  const angle = (value / maxValue) * 360;
  const startAngle = -90; // Start from top
  const endAngle = startAngle + angle;
  
  // Draw background circle
  pdf.setDrawColor(...bgColor);
  pdf.setFillColor(...bgColor);
  pdf.circle(x, y, radius, 'F');
  
  // Cut out inner circle to create donut
  pdf.setDrawColor(255, 255, 255);
  pdf.setFillColor(255, 255, 255);
  pdf.circle(x, y, innerRadius, 'F');
  
  // Only draw arc if value > 0
  if (value > 0) {
    // Draw arc segments individually to create the filled area
    pdf.setFillColor(...color);
    
    // Konvertera vinklar till radianer
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Antal segment för en jämn arc (fler segment = jämnare kurva)
    const segments = 36;
    const angleStep = (endRad - startRad) / segments;
    
    // Rita sektoriella trianglar för att skapa "tårtbiten"
    for (let i = 0; i < segments; i++) {
      const currentAngle = startRad + i * angleStep;
      const nextAngle = startRad + (i + 1) * angleStep;
      
      const x1 = x + Math.cos(currentAngle) * radius;
      const y1 = y + Math.sin(currentAngle) * radius;
      const x2 = x + Math.cos(nextAngle) * radius;
      const y2 = y + Math.sin(nextAngle) * radius;
      
      // Skapa en triangel mellan centrum och två punkter på cirkeln
      pdf.setFillColor(...color);
      pdf.triangle(x, y, x1, y1, x2, y2, 'F');
    }
    
    // Rita inre cirkel igen för att skapa hål i mitten
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x, y, innerRadius, 'F');
  }
  
  // Text i mitten
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const text = formatPercent(value / maxValue * 100);
  const textWidth = pdf.getTextWidth(text);
  pdf.text(text, x - textWidth / 2, y + 4);
};

// Skapa en horisontell progress bar
const drawProgressBar = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  maxValue: number,
  color: [number, number, number],
  bgColor: [number, number, number] = [220, 220, 220]
) => {
  // Bakgrund
  pdf.setFillColor(...bgColor);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Beräkna fyllnad baserat på värde
  const fillWidth = Math.max(0, Math.min(1, value / maxValue)) * width;
  
  // Fyllnad
  if (fillWidth > 0) {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, y, fillWidth, height, 2, 2, 'F');
  }
  
  // Text
  const text = formatPercent(value / maxValue * 100);
  const textWidth = pdf.getTextWidth(text);
  pdf.setTextColor(0, 0, 0);
  pdf.text(text, x + width / 2 - textWidth / 2, y + height + 4);
};

// Generator för enkel ROI-kalkylator - Exekutiv version
export const generateSimpleROIPDF = (
  formData: SimpleROIData,
  results: SimpleROIResults,
  companyName: string = 'Företag AB'
) => {
  const pdf = new jsPDF();
  const currentDate = format(new Date(), 'yyyy-MM-dd', { locale: sv });
  
  // Lägg till företagsnamn och datum
  pdf.setFillColor(20, 40, 104); // header bakgrund
  pdf.rect(0, 0, 210, 30, 'F');
  
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Sentions ROI-Kalkyl', 105, 15, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`${companyName} | ${currentDate}`, 105, 23, { align: 'center' });
  
  // DASHBOARD - HUVUDNYCKELTAL
  // -------------------------
  pdf.setFillColor(245, 245, 250);
  pdf.rect(0, 30, 210, 60, 'F');
  
  pdf.setTextColor(20, 40, 104);
  pdf.setFontSize(16);
  pdf.text('SAMMANFATTANDE NYCKELTAL', 105, 42, { align: 'center' });
  
  // KPI-Layout: 4 viktiga KPI:er på en rad
  const kpiStartY = 50;
  const kpiWidth = 45;
  
  // KPI 1: ROI
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10, kpiStartY, kpiWidth, 30, 3, 3, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('AVKASTNING PÅ INVESTERING', 10 + kpiWidth/2, kpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(14);
  if (results.roi_percentage >= 100) {
    pdf.setTextColor(0, 150, 0);
  } else if (results.roi_percentage >= 0) {
    pdf.setTextColor(0, 100, 150);
  } else {
    pdf.setTextColor(200, 0, 0);
  }
  pdf.text(formatPercent(results.roi_percentage), 10 + kpiWidth/2, kpiStartY + 20, { align: 'center' });
  
  // KPI 2: Ekonomiskt överskott
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10 + kpiWidth + 5, kpiStartY, kpiWidth, 30, 3, 3, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('EKONOMISKT ÖVERSKOTT', 10 + kpiWidth + 5 + kpiWidth/2, kpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(14);
  if (results.economic_surplus > 0) {
    pdf.setTextColor(0, 150, 0);
  } else {
    pdf.setTextColor(200, 0, 0);
  }
  pdf.text(formatCurrency(results.economic_surplus), 10 + kpiWidth + 5 + kpiWidth/2, kpiStartY + 20, { align: 'center' });
  
  // KPI 3: Total kostnad för psykisk ohälsa
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10 + (kpiWidth + 5) * 2, kpiStartY, kpiWidth, 30, 3, 3, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('KOSTNAD PSYKISK OHÄLSA', 10 + (kpiWidth + 5) * 2 + kpiWidth/2, kpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setTextColor(200, 0, 0);
  pdf.text(formatCurrency(results.total_mental_health_cost), 10 + (kpiWidth + 5) * 2 + kpiWidth/2, kpiStartY + 20, { align: 'center' });
  
  // KPI 4: Break-even effekt
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10 + (kpiWidth + 5) * 3, kpiStartY, kpiWidth, 30, 3, 3, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('BREAK-EVEN EFFEKT', 10 + (kpiWidth + 5) * 3 + kpiWidth/2, kpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(formatPercent(results.break_even_effect), 10 + (kpiWidth + 5) * 3 + kpiWidth/2, kpiStartY + 20, { align: 'center' });
  
  // VISUALISERINGAR 
  // -------------------------
  const vizStartY = 95;
  
  pdf.setTextColor(20, 40, 104);
  pdf.setFontSize(14);
  pdf.text('VISUELL ÖVERSIKT', 105, vizStartY, { align: 'center' });
  
  // Donut/KPI-kort för minskning av stressnivå
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15, vizStartY + 10, 80, 65, 3, 3, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(20, 40, 104);
  pdf.text('FÖRBÄTTRING AV STRESSNIVÅ', 15 + 40, vizStartY + 20, { align: 'center' });
  
  // Rita donut-diagrammet
  drawDonutChart(
    pdf, 
    15 + 40, 
    vizStartY + 45, 
    20, 
    12, 
    formData.expected_reduction || 0, 
    100, 
    [50, 150, 230]
  );
  
  // Målformulering
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Mål: ${formatPercent((formData.expected_reduction || 0) / 2)} - ${formatPercent((formData.expected_reduction || 0) * 1.5)}`, 15 + 40, vizStartY + 68, { align: 'center' });
  
  // Ekonomiska effekter
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(105, vizStartY + 10, 80, 65, 3, 3, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(20, 40, 104);
  pdf.text('EKONOMISKA EFFEKTER', 105 + 40, vizStartY + 20, { align: 'center' });
  
  // Kostnader vs. nytta
  const costBarY = vizStartY + 30;
  const benefitBarY = vizStartY + 45;
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Kostnad:', 110, costBarY - 2);
  pdf.text('Nytta:', 110, benefitBarY - 2);
  
  // Kostnadsbar
  drawProgressBar(
    pdf,
    110,
    costBarY,
    70,
    6,
    results.intervention_cost,
    results.intervention_cost + results.economic_benefit,
    [200, 80, 80]
  );
  
  // Nyttabar
  drawProgressBar(
    pdf,
    110,
    benefitBarY,
    70,
    6,
    results.economic_benefit,
    results.intervention_cost + results.economic_benefit,
    [80, 180, 80]
  );
  
  // Textförklaring
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Kostnad: ${formatCurrency(results.intervention_cost)}`, 110, vizStartY + 60);
  pdf.text(`Ekonomisk nytta: ${formatCurrency(results.economic_benefit)}`, 110, vizStartY + 68);
  
  // DETALJERADE RESULTAT
  // -------------------------
  pdf.setTextColor(20, 40, 104);
  pdf.setFontSize(14);
  pdf.text('DETALJER OCH KPI:ER', 105, vizStartY + 85, { align: 'center' });
  
  // Skapa en rad med små 2x2 KPI-kort
  const smallKpiStartY = vizStartY + 90;
  const smallKpiWidth = 45;
  const smallKpiHeight = 32;
  const columnGap = 5;
  const rowGap = 5;
  
  // Rad 1, Kolumn 1: Produktivitetsförlust
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15, smallKpiStartY, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('PRODUKTIONSBORTFALL', 15 + smallKpiWidth/2, smallKpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(200, 0, 0);
  pdf.text(formatCurrency(results.total_production_loss), 15 + smallKpiWidth/2, smallKpiStartY + 20, { align: 'center' });
  
  // Rad 1, Kolumn 2: Insatskostnad per anställd
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15 + smallKpiWidth + columnGap, smallKpiStartY, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('KOSTNAD PER ANSTÄLLD', 15 + smallKpiWidth + columnGap + smallKpiWidth/2, smallKpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const costPerEmployee = (formData.num_employees && formData.num_employees > 0) 
    ? results.intervention_cost / formData.num_employees 
    : 0;
  pdf.text(formatCurrency(costPerEmployee), 15 + smallKpiWidth + columnGap + smallKpiWidth/2, smallKpiStartY + 20, { align: 'center' });
  
  // Rad 1, Kolumn 3: ROI per anställd
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15 + (smallKpiWidth + columnGap) * 2, smallKpiStartY, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('NYTTA PER ANSTÄLLD', 15 + (smallKpiWidth + columnGap) * 2 + smallKpiWidth/2, smallKpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const benefitPerEmployee = (formData.num_employees && formData.num_employees > 0) 
    ? results.economic_benefit / formData.num_employees 
    : 0;
  pdf.text(formatCurrency(benefitPerEmployee), 15 + (smallKpiWidth + columnGap) * 2 + smallKpiWidth/2, smallKpiStartY + 20, { align: 'center' });
  
  // Rad 1, Kolumn 4: Återbetalningstid
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15 + (smallKpiWidth + columnGap) * 3, smallKpiStartY, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('ÅTERBETALNINGSTID', 15 + (smallKpiWidth + columnGap) * 3 + smallKpiWidth/2, smallKpiStartY + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  const paybackTime = results.economic_benefit > 0 
    ? results.intervention_cost / (results.economic_benefit / 12) 
    : 0;
  
  if (paybackTime <= 12) {
    pdf.setTextColor(0, 150, 0);
  } else if (paybackTime <= 24) {
    pdf.setTextColor(180, 130, 0);
  } else {
    pdf.setTextColor(200, 0, 0);
  }
  
  pdf.text(`${paybackTime.toFixed(1)} mån`, 15 + (smallKpiWidth + columnGap) * 3 + smallKpiWidth/2, smallKpiStartY + 20, { align: 'center' });
  
  // Rad 2, Kolumn 1: Sjukfrånvarokostnad
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15, smallKpiStartY + smallKpiHeight + rowGap, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('SJUKFRÅNVAROKOSTNAD', 15 + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(200, 0, 0);
  pdf.text(formatCurrency(results.total_sick_leave_cost), 15 + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 20, { align: 'center' });
  
  // Rad 2, Kolumn 2: Total personalkostnad
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15 + smallKpiWidth + columnGap, smallKpiStartY + smallKpiHeight + rowGap, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('PERSONALKOSTNAD', 15 + smallKpiWidth + columnGap + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(formatCurrency(results.total_personnel_cost), 15 + smallKpiWidth + columnGap + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 20, { align: 'center' });
  
  // Rad 2, Kolumn 3: Ohälsokostnad %
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15 + (smallKpiWidth + columnGap) * 2, smallKpiStartY + smallKpiHeight + rowGap, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('OHÄLSOKOSTNAD %', 15 + (smallKpiWidth + columnGap) * 2 + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const healthCostPercent = results.total_personnel_cost > 0 
    ? (results.total_mental_health_cost / results.total_personnel_cost) * 100 
    : 0;
  pdf.text(formatPercent(healthCostPercent), 15 + (smallKpiWidth + columnGap) * 2 + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 20, { align: 'center' });
  
  // Rad 2, Kolumn 4: Produktivitetsförbättring
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(15 + (smallKpiWidth + columnGap) * 3, smallKpiStartY + smallKpiHeight + rowGap, smallKpiWidth, smallKpiHeight, 3, 3, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('PRODUKTIVITETSFÖRBÄTTRING', 15 + (smallKpiWidth + columnGap) * 3 + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 6, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 150, 0);
  
  // Beräkna produktivitetsökning baserat på minskning av stressnivå
  const expectedStressReduction = formData.expected_reduction || 0;
  const productivityIncrease = expectedStressReduction * (formData.production_loss || 0) / 100;
  
  pdf.text(formatPercent(productivityIncrease), 15 + (smallKpiWidth + columnGap) * 3 + smallKpiWidth/2, smallKpiStartY + smallKpiHeight + rowGap + 20, { align: 'center' });
  
  // DETALJERADE DATARAPPORTER
  // -------------------------
  // Lägg till en ny sida för investeringssammanfattningen
  pdf.addPage();
  
  pdf.setTextColor(20, 40, 104);
  pdf.setFontSize(14);
  pdf.text('INVESTERINGSSAMMANFATTNING', 105, 20, { align: 'center' });
  
  // Skapa sammanfattande datatabell
  const summaryData = [
    ['Antal anställda', formatNumber(formData.num_employees || 0)],
    ['Andel med hög stressnivå', formatPercent(formData.stress_level || 0)],
    ['Förväntad minskning', formatPercent(formData.expected_reduction || 0)],
    ['Interventionskostnad', formatCurrency(results.intervention_cost)],
    ['Ekonomisk nytta', formatCurrency(results.economic_benefit)],
    ['ROI', formatPercent(results.roi_percentage)]
  ];
  
  autoTable(pdf, {
    startY: 30,
    head: [['Nyckelparameter', 'Värde']],
    body: summaryData,
    theme: 'plain',
    headStyles: { fillColor: [20, 40, 104], textColor: [255, 255, 255] },
    styles: { cellPadding: 3, fontSize: 9 },
    columnStyles: { 0: { cellWidth: 60 } },
    margin: { left: 15, right: 15 }
  });
  
  // Lägg till förklaringstext
  const explanationY = pdf.lastAutoTable.finalY + 10;
  
  pdf.setTextColor(20, 40, 104);
  pdf.setFontSize(12);
  pdf.text('SLUTSATS & REKOMMENDATION', 105, explanationY, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  
  let conclusion = '';
  if (results.roi_percentage >= 100) {
    conclusion = `Investeringen ger en MYCKET GOD avkastning på ${formatPercent(results.roi_percentage)}`;
  } else if (results.roi_percentage >= 20) {
    conclusion = `Investeringen ger en GOD avkastning på ${formatPercent(results.roi_percentage)}`;
  } else if (results.roi_percentage >= 0) {
    conclusion = `Investeringen ger en POSITIV avkastning på ${formatPercent(results.roi_percentage)}`;
  } else {
    conclusion = `Investeringen ger en NEGATIV avkastning på ${formatPercent(results.roi_percentage)}`;
  }
  
  conclusion += ` och en ekonomisk nytta på ${formatCurrency(results.economic_benefit)}. `;
  
  if (results.roi_percentage >= 0) {
    conclusion += 'REKOMMENDATION: Genomför insatsen.';
  } else {
    conclusion += 'REKOMMENDATION: Utvärdera alternativa insatser med högre ROI.';
  }
  
  // Textruta för slutsats
  pdf.setFillColor(245, 245, 250);
  pdf.roundedRect(15, explanationY + 5, 180, 20, 3, 3, 'F');
  
  // Centrera texten inom rutan
  const splitConclusion = pdf.splitTextToSize(conclusion, 170);
  let textY = explanationY + 12;
  splitConclusion.forEach((line: string) => {
    pdf.text(line, 105, textY, { align: 'center' });
    textY += 8;
  });
  
  // Sidfot
  const pageCount = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      'Exekutiv ROI-rapport för psykosocial arbetsmiljö | ' + currentDate,
      105,
      pdf.internal.pageSize.height - 10,
      { align: 'center' }
    );
    pdf.text(`${companyName} | Sida ${i} av ${pageCount}`, 105, pdf.internal.pageSize.height - 5, { align: 'center' });
  }
  
  // Spara PDF:en
  pdf.save(`Exekutiv-ROI-rapport_${companyName}_${currentDate}.pdf`);
};

// Generator för jämförande ROI-kalkylator
export const generateComparativeROIPDF = (
  formData: ComparativeROIData,
  results: ComparativeROIResults,
  companyName: string = 'Företag AB'
) => {
  const pdf = new jsPDF();
  const currentDate = format(new Date(), 'yyyy-MM-dd', { locale: sv });
  
  // Lägg till företagsnamn och datum
  pdf.setFontSize(20);
  pdf.setTextColor(20, 40, 104);
  pdf.text('Jämförande ROI-beräkning för stressinterventioner', 105, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${companyName} - ${currentDate}`, 105, 30, { align: 'center' });
  
  // Sammanfattning
  pdf.setFontSize(16);
  pdf.setTextColor(20, 40, 104);
  pdf.text('Sammanfattning', 20, 45);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  // Total kostnad för psykisk ohälsa
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, 50, 170, 15, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total kostnad för psykisk ohälsa:', 25, 58);
  pdf.text(formatCurrency(results.total_mental_health_cost), 105, 58);
  
  // Lägg till indata
  pdf.setFontSize(16);
  pdf.setTextColor(20, 40, 104);
  pdf.text('Indata', 20, 80);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Skapa indata-tabell
  const inputData = [
    ['Antal anställda', formatNumber(formData.num_employees || 0)],
    ['Genomsnittlig månadslön', formatCurrency(formData.avg_monthly_salary || 0)],
    ['Sociala avgifter', formatPercent(formData.social_fees || 0)],
    ['Personalkostnader', formatPercent(formData.personnel_costs || 0)],
    ['Andel med hög stressnivå', formatPercent(formData.stress_level || 0)],
    ['Produktionsbortfall vid hög stress', formatPercent(formData.production_loss || 0)],
    ['Arbetsdagar per år', formatNumber(formData.workdays_per_year || 0)],
    ['Kort sjukfrånvaro', formatPercent(formData.short_term_absence || 0)],
    ['Lång sjukfrånvaro', formatPercent(formData.long_term_absence || 0)]
  ];
  
  autoTable(pdf, {
    startY: 85,
    head: [['Parameter', 'Värde']],
    body: inputData,
    theme: 'striped',
    headStyles: { fillColor: [20, 40, 104] },
    margin: { left: 20, right: 20 }
  });
  
  // Lägg till jämförelse av insatser
  pdf.setFontSize(16);
  pdf.setTextColor(20, 40, 104);
  
  // Lägg till en ESLint-disable-kommentar för att undvika 'any' fel i jsPDF attributer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text('Jämförelse av insatser', 20, (pdf as any).lastAutoTable.finalY + 20);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Skapa tabell för insatsjämförelse
  const interventionTableRows: Array<Array<string | number>> = [];
  
  results.intervention_results.forEach((result, index) => {
    interventionTableRows.push([
      index + 1,
      result.name,
      formatCurrency(result.cost),
      formatCurrency(result.economic_benefit),
      formatCurrency(result.economic_surplus),
      formatPercent(result.roi_percentage),
      formatPercent(result.break_even_effect)
    ]);
  });
  
  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 25,
    head: [['Rank', 'Insats', 'Kostnad', 'Ekonomisk nytta', 'Överskott', 'ROI', 'Break-even']],
    body: interventionTableRows,
    theme: 'striped',
    headStyles: { fillColor: [20, 40, 104] },
    margin: { left: 20, right: 20 }
  });
  
  // Rekommenderade insatser
  const bestIntervention = results.intervention_results[0];
  
  pdf.setFontSize(14);
  pdf.setTextColor(20, 40, 104);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text('Rekommenderad insats', 20, (pdf as any).lastAutoTable.finalY + 20);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  pdf.setFillColor(230, 250, 230);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.rect(20, (pdf as any).lastAutoTable.finalY + 25, 170, 35, 'F');
  
  pdf.setFont('helvetica', 'bold');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text(bestIntervention.name, 25, (pdf as any).lastAutoTable.finalY + 35);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  // Detaljer för rekommenderad insats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text(`Kostnad: ${formatCurrency(bestIntervention.cost)}`, 25, (pdf as any).lastAutoTable.finalY + 45);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text(`Ekonomisk nytta: ${formatCurrency(bestIntervention.economic_benefit)}`, 25, (pdf as any).lastAutoTable.finalY + 52);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text(`ROI: ${formatPercent(bestIntervention.roi_percentage)}`, 110, (pdf as any).lastAutoTable.finalY + 45);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf.text(`Ekonomiskt överskott: ${formatCurrency(bestIntervention.economic_surplus)}`, 110, (pdf as any).lastAutoTable.finalY + 52);
  
  // Detaljerade resultat för kostnad för psykisk ohälsa
  pdf.setFontSize(16);
  pdf.setTextColor(20, 40, 104);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startY = (pdf as any).lastAutoTable.finalY + 70;
  
  if (startY > 240) {
    pdf.addPage();
    pdf.text('Detaljerade resultat', 20, 20);
  } else {
    pdf.text('Detaljerade resultat', 20, startY);
  }
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Skapa resultat-tabell för psykisk ohälsa
  const mentalHealthData = [
    ['Total kostnad för psykisk ohälsa', formatCurrency(results.total_mental_health_cost)],
    ['Produktionsbortfall', formatCurrency(results.total_production_loss)],
    ['Sjukfrånvarokostnad', formatCurrency(results.total_sick_leave_cost)],
    ['Korttidssjukfrånvaro (dagar)', formatNumber(results.short_term_days)],
    ['Långtidssjukfrånvaro (dagar)', formatNumber(results.long_term_days)]
  ];
  
  const tableStartY = startY > 240 ? 25 : startY + 5;
  
  autoTable(pdf, {
    startY: tableStartY,
    head: [['Kostnader för psykisk ohälsa', 'Värde']],
    body: mentalHealthData,
    theme: 'striped',
    headStyles: { fillColor: [20, 40, 104] },
    margin: { left: 20, right: 20 }
  });
  
  // Lägg till förklaringstext
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const explanationY = (pdf as any).lastAutoTable.finalY + 15;
  pdf.text('Tolkning av resultaten:', 20, explanationY);
  
  const explanation = [
    'Insatserna är rangordnade efter deras avkastning på investering (ROI). Insatsen med',
    'högst ROI ger mest ekonomisk nytta i förhållande till kostnaden.',
    '',
    'Den ekonomiska nyttan beräknas genom den förväntade minskningen av andelen',
    'personal med hög stressnivå, vilket i sin tur minskar både produktionsbortfall',
    'och sjukfrånvaro.',
    '',
    'Tänk på att utöver ekonomisk nytta kan andra faktorer som genomförbarhet, tidsperspektiv',
    'och anpassning till organisationens behov vara viktiga i valet av insats.'
  ];
  
  let yPos = explanationY + 5;
  explanation.forEach(line => {
    pdf.text(line, 20, yPos);
    yPos += 5;
  });
  
  // Lägg till sidfot
  const pageCount = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      'Genererad med ROI-kalkylatorn för psykosocial arbetsmiljö | ' + currentDate,
      105,
      pdf.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Spara PDF:en
  pdf.save(`Jämförande-ROI-kalkyl_${companyName}_${currentDate}.pdf`);
};

// Funktion för att skapa PDF från ett HTML-element för interaktiva rapporter
export const generatePDFFromElement = async (
  element: HTMLElement,
  filename: string,
  companyName: string = 'Företag AB'
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true,
    allowTaint: true
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const currentDate = format(new Date(), 'yyyy-MM-dd', { locale: sv });
  
  // Bildbredd och höjd (anpassad till A4)
  const imgWidth = 210 - 40; // A4 width - margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Lägg till företagsnamn och datum
  pdf.setFontSize(16);
  pdf.setTextColor(20, 40, 104);
  pdf.text(`ROI-beräkning för ${companyName}`, 105, 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(currentDate, 105, 22, { align: 'center' });
  
  // Lägg till bilden
  pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
  
  // Ny sida om bilden är för stor
  if (imgHeight > 240) {
    const pages = Math.ceil(imgHeight / 240);
    
    // Ta bort första sidan och lägg till nya sidor med bilden
    const imgDataURI = canvas.toDataURL('image/png');
    pdf.deletePage(1);
    
    for (let i = 0; i < pages; i++) {
      pdf.addPage();
      
      // Lägg till rubrik på första sidan
      if (i === 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(20, 40, 104);
        pdf.text(`ROI-beräkning för ${companyName}`, 105, 15, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(currentDate, 105, 22, { align: 'center' });
      }
      
      // Beräkna vilken del av bilden som ska visas på denna sida
      const srcY = i * 240 * (canvas.height / imgHeight);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const srcHeight = Math.min(240 * (canvas.height / imgHeight), canvas.height - srcY);
      
      // Använd korrekt översättning för att visa rätt del av bilden
      pdf.addImage({
        imageData: imgDataURI,
        format: 'PNG',
        x: 20,
        y: i === 0 ? 30 : 10,
        width: imgWidth,
        height: imgHeight,
        alias: `page${i}`,
        compression: 'FAST',
        rotation: 0
      });
    }
  }
  
  // Lägg till sidfot
  const pageCount = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      'Genererad med ROI-kalkylatorn för psykosocial arbetsmiljö | ' + currentDate,
      105,
      pdf.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Spara PDF:en
  pdf.save(`${filename}_${currentDate}.pdf`);
}; 