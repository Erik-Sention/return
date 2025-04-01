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
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
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
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
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
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
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
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
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
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
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
  
  // ROI-slutsats
  currentY = addSection(doc, 'Slutsats - ROI', currentY, margin, contentWidth);
  
  // Generera ROI-slutsatstexten
  let roiConclusionText = '';
  
  if (!data || !data.totalCost || !data.totalBenefit || data.totalCost <= 0 || data.totalBenefit <= 0) {
    roiConclusionText = 'Baserat på tillgänglig data kan vi inte fastställa en ROI-analys. Vänligen fyll i både kostnader och fördelar för att generera en slutsats.';
  } else if (data.roi && data.roi > 0) {
    // Bedöm styrkan på ROI
    let strengthText = '';
    if (data.roi >= 200) strengthText = 'extremt stark';
    else if (data.roi >= 100) strengthText = 'mycket stark';
    else if (data.roi >= 50) strengthText = 'stark';
    else if (data.roi >= 20) strengthText = 'god';
    else strengthText = 'positiv';
    
    // Beräkna värde per investerad krona
    const valuePerCrown = data.roi / 100 + 1;
    
    const costText = formatCurrency(data.totalCost);
    const benefitText = formatCurrency(data.totalBenefit);
    const roiText = formatPercent(data.roi);
    
    roiConclusionText = `Analysen visar en ${strengthText} avkastning på ${roiText} för investeringen på ${costText}. 
Det innebär att varje investerad krona genererar ${valuePerCrown.toFixed(2)} kronor i värde. 
Det totala värdet av interventionen uppskattas till ${benefitText}.`;
    
    if (data.paybackPeriod) {
      const paybackText = formatMonths(data.paybackPeriod);
      if (data.paybackPeriod < 3) {
        roiConclusionText += ` Återbetalningstiden är mycket kort (${paybackText}), vilket gör detta till en investering med låg risk.`;
      } else if (data.paybackPeriod < 12) {
        roiConclusionText += ` Återbetalningstiden är rimlig (${paybackText}) och inom ett år, vilket är lovande för denna typ av intervention.`;
      } else {
        roiConclusionText += ` Återbetalningstiden på ${paybackText} är relativt lång, men investeringen ger ändå ett positivt resultat över tid.`;
      }
    }
    
    roiConclusionText += ' Baserat på denna analys rekommenderas investeringen som en ekonomiskt fördelaktig åtgärd.';
  } else {
    const costText = formatCurrency(data.totalCost);
    const benefitText = formatCurrency(data.totalBenefit);
    
    roiConclusionText = `ROI-beräkningen visar att investeringen på ${costText} inte ger en positiv ekonomisk avkastning jämfört med det förväntade värdet på ${benefitText}.
Detta betyder dock inte nödvändigtvis att interventionen saknar värde, då vissa fördelar kan vara svåra att kvantifiera ekonomiskt. 
Vi rekommenderar en fördjupad analys med fokus på både ekonomiska och icke-ekonomiska fördelar innan ett beslut fattas.`;
  }
  
  currentY = addWrappedText(doc, roiConclusionText, currentY, margin, contentWidth);
  currentY += 10;
  
  // Max kostnad-slutsats
  if (data.totalCostAlt2) {
    currentY = addSection(doc, 'Slutsats - Max kostnad', currentY, margin, contentWidth);
    
    const maxCostConclusionText = `Med samma effekt som beräknats i ROI-alternativet (${formatPercent(data.roi || 0)}) kan du maximalt investera ${formatCurrency(data.totalCostAlt2)} för att nå break-even (ROI = 0%). 
Detta skulle innebära att investeringen precis täcker sina kostnader. Allt över detta belopp skulle ge en negativ avkastning med nuvarande effektberäkning.`;
    
    currentY = addWrappedText(doc, maxCostConclusionText, currentY, margin, contentWidth);
    currentY += 10;
  }
  
  // Förutsättning-slutsats
  if (data.totalCostAlt3 && data.minEffectForBreakEvenAlt3) {
    currentY = addSection(doc, 'Slutsats - Förutsättning', currentY, margin, contentWidth);
    
    const minEffectConclusionText = `Med nuvarande investering på ${formatCurrency(data.totalCostAlt3)} skulle stressnivån behöva minska med minst ${formatPercent((data.minEffectForBreakEvenAlt3 || 0) / 100)} för att nå break-even (ROI = 0%). 
Detta är den minimala effekt som krävs för att investeringen ska täcka sina kostnader. All effekt utöver detta skulle ge en positiv avkastning.`;
    
    currentY = addWrappedText(doc, minEffectConclusionText, currentY, margin, contentWidth);
  }
  
  // Sidfot
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const pageCount = doc.getNumberOfPages();
  
  // Lägg till företagsnamn och sidnumrering i sidfoten på varje sida
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text('ROI-kalkylator v1.0', margin, 285);
    doc.text(`Sida ${i} av ${pageCount}`, pageWidth - margin, 285, { align: 'right' });
  }
  
  // Spara PDF-filen
  const fileName = `${data.sharedFields.organizationName.replace(/\s+/g, '_')}_ROI_Rapport_${today.replace(/\-/g, '')}.pdf`;
  doc.save(fileName);
}

/**
 * Hjälpfunktion för att lägga till en ny sektion med rubrik
 */
function addSection(doc: jsPDF, title: string, y: number, margin: number, width: number): number {
  // Lägg till lite mellanrum
  y += 5;
  
  // Kontrollera om det finns plats på sidan, annars lägg till en ny sida
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  
  // Lägg till sektionsrubrik
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text(title, margin, y);
  
  // Lägg till en linje under rubriken
  y += 2;
  doc.setDrawColor(0, 102, 204);
  doc.line(margin, y, margin + width * 0.3, y);
  
  return y + 5;
}

/**
 * Hjälpfunktion för att lägga till text med radbrytning
 */
function addWrappedText(doc: jsPDF, text: string, y: number, margin: number, width: number): number {
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Dela upp texten i rader som passar inom den angivna bredden
  const textLines = doc.splitTextToSize(text, width);
  
  // Kontrollera om vi behöver en ny sida
  if (y + textLines.length * 5 > 270) {
    doc.addPage();
    y = 20;
  }
  
  // Lägg till texten
  doc.text(textLines, margin, y);
  
  // Returnera den nya Y-positionen
  return y + textLines.length * 5 + 5;
} 