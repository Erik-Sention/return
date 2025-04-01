import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatPercent, formatMonths, ROIReportData } from './reportUtils';

/**
 * Exporterar ROI-data till en välformaterad PDF-fil
 */
export function exportROIToPdf(data: ROIReportData): void {
  // Skapa ett nytt PDF-dokument i A4-format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Konfigurera fonter och färger
  doc.setFont('helvetica');
  
  // Lägg till logo och rubrik
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // Mörkblå färg för rubriker
  doc.text('Exekutiv sammanfattning', margin, 20);
  
  // Lägg till en linje under rubriken
  doc.setDrawColor(0, 102, 204); // Blå färg för linjer
  doc.line(margin, 22, pageWidth - margin, 22);
  
  // Företags- och rapportinformation
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(data.sharedFields.organizationName, margin, 30);
  doc.setFontSize(10);
  doc.text(`Kontaktperson: ${data.sharedFields.contactPerson}`, margin, 35);
  
  if (data.timePeriod) {
    doc.text(`Period: ${data.timePeriod}`, margin, 40);
  }
  
  // Datum för rapporten
  const today = new Date().toLocaleDateString('sv-SE');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Rapport genererad: ${today}`, pageWidth - margin - 50, 40, { align: 'right' });
  
  let currentY = 50; // Startvärde för Y-positionen
  
  // Organisationsuppgifter
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(data.sharedFields.organizationName, margin, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Kontaktperson: ${data.sharedFields.contactPerson}`, margin, currentY);
  currentY += 7;
  
  if (data.timePeriod) {
    doc.text(`Period: ${data.timePeriod}`, margin, currentY);
    currentY += 7;
  }
  
  currentY += 10;
  
  // ROI och nyckeltal - Alternativ 1 (standard)
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('ROI-beräkning', margin, currentY);
  currentY += 10;
  
  // Nyckeltal
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Nyckeltal', margin, currentY);
  currentY += 10;
  
  // Kostnader och fördelar i tabellformat
  autoTable(doc, {
    startY: currentY,
    head: [['Beskrivning', 'Värde']],
    body: [
      ['Total kostnad', formatCurrency(data.totalCost)],
      ['Total nytta', formatCurrency(data.totalBenefit)],
      ['ROI', formatPercent(data.roi)],
      data.paybackPeriod ? ['Återbetalningstid', formatMonths(data.paybackPeriod)] : ['Återbetalningstid', 'N/A']
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204], textColor: 255 },
    margin: { left: margin, right: margin }
  });
  
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  // Alternativ 2: Maxkostnad för break-even
  if (data.totalCostAlt2) {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Max kostnad', margin, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Beskrivning', 'Värde']],
      body: [
        ['Max kostnad', formatCurrency(data.totalCostAlt2)],
        ['Total nytta', formatCurrency(data.totalBenefitAlt2 || data.totalBenefit)],
        ['ROI', '0%'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 153, 51], textColor: 255 },
      margin: { left: margin, right: margin }
    });
    
    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }
  
  // Alternativ 3: Minsta effekt för break-even
  if (data.totalCostAlt3) {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Förutsättning', margin, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Beskrivning', 'Värde']],
      body: [
        ['Total kostnad', formatCurrency(data.totalCostAlt3)],
        ['Minsta effekt (minskad stressnivå)', data.minEffectForBreakEvenAlt3 ? formatPercent(data.minEffectForBreakEvenAlt3 / 100) : 'N/A'],
        ['ROI', '0%'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [102, 0, 204], textColor: 255 },
      margin: { left: margin, right: margin }
    });
    
    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }
  
  // Add a page break before details
  doc.addPage();
  currentY = 20;
  
  // Beskrivningssektioner
  if (data.currentSituation) {
    currentY = addSection(doc, 'Nuläge', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.currentSituation, currentY, margin, contentWidth);
    
    // Lägg till nulägesstatistik om den finns
    if (data.stressPercentage || data.productionLossValue || data.sickLeaveValue) {
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Mätning', 'Värde']],
        body: [
          data.stressPercentage ? ['Andel av personalen med hög stressnivå', formatPercent(data.stressPercentage / 100)] : [],
          data.productionLossValue ? ['Värde av produktionsbortfall per år', formatCurrency(data.productionLossValue)] : [],
          data.sickLeaveValue ? ['Kostnad för sjukfrånvaro per år', formatCurrency(data.sickLeaveValue)] : []
        ].filter(row => row.length > 0),
        theme: 'plain',
        tableWidth: contentWidth,
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }
  
  // Orsaksanalys
  if (data.causeAnalysis) {
    currentY = addSection(doc, 'Orsaksanalys', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.causeAnalysis, currentY, margin, contentWidth);
  }
  
  // Syfte med insatserna
  if (data.interventionPurpose) {
    currentY = addSection(doc, 'Syfte med insatserna', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.interventionPurpose, currentY, margin, contentWidth);
  }
  
  if (data.goalsDescription) {
    currentY = addSection(doc, 'Målsättning', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.goalsDescription, currentY, margin, contentWidth);
  }
  
  // Målgrupp
  if (data.targetGroup) {
    currentY = addSection(doc, 'Målgrupp', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.targetGroup, currentY, margin, contentWidth);
  }
  
  if (data.interventionDescription) {
    currentY = addSection(doc, 'Intervention', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.interventionDescription, currentY, margin, contentWidth);
    
    // Kostnader visas endast om de finns
    if (data.interventionCosts && data.interventionCosts.length > 0) {
      // Lägg till lite mellanrum
      currentY += 5;
      
      // Kontrollera om vi behöver en ny sida
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Lägg till underrubrik
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Kostnadsfördelning', margin, currentY);
      currentY += 5;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Beskrivning', 'Belopp']],
        body: data.interventionCosts.map(cost => [cost.description, formatCurrency(cost.amount)]),
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], textColor: 255 },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }
  
  // Genomförandeplan
  if (data.implementationPlan) {
    currentY = addSection(doc, 'Genomförandeplan', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.implementationPlan, currentY, margin, contentWidth);
  }
  
  // Rekommendation
  if (data.recommendation) {
    currentY = addSection(doc, 'Rekommendation för beslut', currentY, margin, contentWidth);
    currentY = addWrappedText(doc, data.recommendation, currentY, margin, contentWidth);
  }
  
  // Slutsats
  // Kontrollera om vi behöver en ny sida
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }
  
  // Spara filen till användarens dator
  doc.save(`ROI-rapport-${data.sharedFields.organizationName}-${today}.pdf`);
}

/**
 * Hjälpfunktion för att lägga till en sektionsrubrik i PDF-dokumentet
 */
function addSection(doc: jsPDF, title: string, y: number, margin: number, width: number): number {
  // Kontrollera om vi behöver en ny sida innan vi lägger till rubriken
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  // Lägg till sektionsrubrik
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text(title, margin, y);
  
  // Lägg till en linje under rubriken
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y + 2, margin + width, y + 2);
  
  return y + 8; // Returnera ny Y-position
}

/**
 * Hjälpfunktion för att lägga till text med automatisk radbrytning
 */
function addWrappedText(doc: jsPDF, text: string, y: number, margin: number, width: number): number {
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  
  const textLines = doc.splitTextToSize(text, width);
  
  // Om texten skulle gå utanför sidan, lägg till en ny sida
  if (y + (textLines.length * 5) > 280) {
    doc.addPage();
    y = 20;
  }
  
  doc.text(textLines, margin, y);
  
  return y + (textLines.length * 5) + 5; // Returnera ny Y-position
} 