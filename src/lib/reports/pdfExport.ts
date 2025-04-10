import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatPercent, formatMonths, ROIReportData } from './reportUtils';
import { database } from '@/lib/firebase/config';
import { ref, get, child } from 'firebase/database';

/**
 * Exporterar ROI-data till en välformaterad PDF-fil som liknar webbgränssnittet
 */
export async function exportROIToPdf(data: ROIReportData, currentUserId?: string): Promise<void> {
  // Hämta eventuell ytterligare information om organisation och tidsperiod från Form D
  let enhancedData = { ...data };
  
  try {
    // Använd currentUserId om det finns, annars fortsätt med befintlig data
    if (currentUserId) {
      const formDPath = `users/${currentUserId}/forms/D`;
      const dbRef = ref(database);
      const formDSnapshot = await get(child(dbRef, formDPath));
      
      if (formDSnapshot.exists()) {
        const formDData = formDSnapshot.val();
        
        // Använd FormD-data om det finns, annars behåll befintlig data
        enhancedData = {
          ...data,
          sharedFields: {
            ...data.sharedFields,
            organizationName: formDData.organizationName || data.sharedFields.organizationName,
            contactPerson: formDData.contactPerson || data.sharedFields.contactPerson,
          }
        };
        
        // Om vi har startDate och endDate från FormD, skapa en tidsperiod-sträng
        if (formDData.startDate && formDData.endDate) {
          enhancedData.timePeriod = `${formDData.startDate} - ${formDData.endDate}`;
        }
      }
    }
  } catch (error) {
    console.error('Kunde inte hämta data från FormD:', error);
    // Fortsätt med befintlig data om det blev ett fel
  }
  
  // Skapa ett nytt PDF-dokument i A4-format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Konfigurera fonter och färger
  doc.setFont('helvetica');
  
  // ========== LÄGG TILL FÖRSÄTTSSIDA ==========
  
  // Bakgrund till försättssidan (ljusgrå)
  doc.setFillColor(248, 249, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Lägga till SENTION logotypen
  try {
    // Använd den svarta loggan med transparant bakgrund istället
    doc.addImage(
      'https://i.postimg.cc/FRwbMSBN/SENTION-logo-Black-Transparent-BG.png',
      'PNG',
      (pageWidth - 100) / 2, // Centrerad horisontellt
      10, // Placering från toppen
      100, // Bredd (justerad för bättre proportioner)
      100, // Höjd (justerad för bättre proportioner)
      undefined,
      'FAST'
    );
  } catch (error) {
    console.error('Kunde inte lägga till logotypen:', error);
    // Fallback om bilden inte kunde laddas
    doc.setFontSize(24);
    doc.setTextColor(0, 51, 102);
    doc.text('SENTION', pageWidth / 2, 60, { align: 'center' });
  }
  
  // Huvudtitel
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102);
  doc.text('ROI-rapport', pageWidth / 2, 115, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Avkastning på hälsofrämjande investeringar', pageWidth / 2, 130, { align: 'center' });
  
  // Informationsruta - nu med ljus färg istället för svart
  const infoBoxY = 140;
  const infoBoxHeight = 80;
  
  // Ljus inforuta med subtil skugga
  doc.setFillColor(252, 252, 252); // Nästan vit bakgrund
  doc.roundedRect(margin + 10, infoBoxY, contentWidth - 20, infoBoxHeight, 5, 5, 'F');
  doc.setDrawColor(230, 230, 240); // Ljus kantlinje
  doc.roundedRect(margin + 10, infoBoxY, contentWidth - 20, infoBoxHeight, 5, 5, 'S');
  
  // Information i rutan - mörkare text på ljus bakgrund
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 100);
  doc.text('Organisation:', margin + 20, infoBoxY + 20);
  doc.text('Kontaktperson:', margin + 20, infoBoxY + 35);
  doc.text('Tidsperiod:', margin + 20, infoBoxY + 50);
  doc.text('Datum:', margin + 20, infoBoxY + 65);
  
  doc.setFontSize(12);
  doc.setTextColor(10, 10, 10); // Mörkare text för bättre läsbarhet
  doc.text(enhancedData.sharedFields.organizationName || 'Ej angiven', margin + 70, infoBoxY + 20);
  doc.text(enhancedData.sharedFields.contactPerson || 'Ej angiven', margin + 70, infoBoxY + 35);
  doc.text(enhancedData.timePeriod || 'Ej angiven', margin + 70, infoBoxY + 50);
  
  const today = new Date().toLocaleDateString('sv-SE');
  doc.text(today, margin + 70, infoBoxY + 65);
  
  // Sidfot
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 120);
  doc.text('© SENTION ' + new Date().getFullYear().toString(), pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Lägg till en beskrivning
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 70);
  const descriptionText = "Denna rapport presenterar en analys av avkastningen på investering (ROI) för hälsofrämjande insatser inom organisationen. Den innehåller en sammanfattning av nuläge, orsaker, insatser, kostnader och förväntade ekonomiska fördelar.";
  const descriptionLines = doc.splitTextToSize(descriptionText, contentWidth - 40);
  doc.text(descriptionLines, pageWidth / 2, infoBoxY + 100, { align: 'center' });
  
  // Lägg till en ny sida för den exekutiva sammanfattningen
  doc.addPage();
  
  // ========== FORTSÄTT MED EXEKUTIV SAMMANFATTNING ==========
  
  // Lägg till en toppbanner med titeln - mer visuellt lik webbgränssnittet
  doc.setFillColor(240, 240, 245); // Ljusgrå bakgrund som matchar UI
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Lägg till logo och rubrik
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // Mörkblå färg för rubriker
  doc.text('Exekutiv sammanfattning', margin, 17);
  
  // Visa alltid organisation, kontaktperson och tidsperiod i en inforuta
  doc.setFillColor(250, 250, 255); // Ljus bakgrund för inforuta
  doc.roundedRect(margin, 30, contentWidth, 30, 2, 2, 'F');
  doc.setDrawColor(220, 220, 230); // Kantlinje
  doc.roundedRect(margin, 30, contentWidth, 30, 2, 2, 'S');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(enhancedData.sharedFields.organizationName || 'Organisation inte angiven', margin + 5, 38);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 100);
  doc.text(`Kontaktperson: ${enhancedData.sharedFields.contactPerson || 'Ej angiven'}`, margin + 5, 45);
  
  // Visa tidsperiod om den finns
  const periodText = enhancedData.timePeriod ? `Period: ${enhancedData.timePeriod}` : 'Period: Ej angiven';
  doc.text(periodText, margin + 5, 52);
  
  // Datum för rapporten (högerjusterad)
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Rapport genererad: ${today}`, pageWidth - margin - 5, 52, { align: 'right' });
  
  let currentY = 70; // Startvärde för Y-positionen efter headern
  
  // Nyckeltal i färgade kort - likt webbgränssnittet
  const cardWidth = contentWidth / 2 - 5;
  
  // Första raden med kort
  // Kort 1: Kostnad
  doc.setFillColor(240, 248, 255); // Ljusblå bakgrund
  doc.roundedRect(margin, currentY, cardWidth, 40, 3, 3, 'F');
  doc.setDrawColor(220, 230, 240); // Ljusblå ram
  doc.roundedRect(margin, currentY, cardWidth, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(60, 100, 170);
  doc.text('Total kostnad', margin + 5, currentY + 8);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(enhancedData.totalCost), margin + 5, currentY + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Total investering i interventionen', margin + 5, currentY + 30);
  
  // Kort 2: Totalnytta
  doc.setFillColor(240, 255, 240); // Ljusgrön bakgrund
  doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, 40, 3, 3, 'F');
  doc.setDrawColor(220, 240, 220); // Ljusgrön ram
  doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(60, 160, 60);
  doc.text('Totalnytta', margin + cardWidth + 15, currentY + 8);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(enhancedData.totalBenefit), margin + cardWidth + 15, currentY + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Total ekonomisk nytta per år', margin + cardWidth + 15, currentY + 30);
  
  currentY += 50; // Flytta ner för nästa rad med kort
  
  // Andra raden med kort
  // Kort 3: ROI
  doc.setFillColor(245, 240, 255); // Ljuslila bakgrund
  doc.roundedRect(margin, currentY, cardWidth, 40, 3, 3, 'F');
  doc.setDrawColor(230, 220, 240); // Ljuslila ram
  doc.roundedRect(margin, currentY, cardWidth, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(120, 60, 170);
  doc.text('ROI', margin + 5, currentY + 8);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(formatPercent(enhancedData.roi), margin + 5, currentY + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Return on Investment', margin + 5, currentY + 30);
  
  // Kort 4: Återbetalningstid
  doc.setFillColor(255, 245, 230); // Ljusorange bakgrund
  doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, 40, 3, 3, 'F');
  doc.setDrawColor(240, 220, 200); // Ljusorange ram
  doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(180, 100, 40);
  doc.text('Återbetalningstid', margin + cardWidth + 15, currentY + 8);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const paybackText = enhancedData.paybackPeriod ? formatMonths(enhancedData.paybackPeriod) : 'N/A';
  doc.text(paybackText, margin + cardWidth + 15, currentY + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Tid till break-even', margin + cardWidth + 15, currentY + 30);
  
  currentY += 50; // Flytta ner för nästa rad med kort
  
  // Tredje raden med kort - Max kostnad och Minsta effekt
  // Kort 5: Max kostnad
  doc.setFillColor(230, 240, 255); // Ljusblå bakgrund
  doc.roundedRect(margin, currentY, cardWidth, 40, 3, 3, 'F');
  doc.setDrawColor(210, 220, 240); // Ljusblå ram
  doc.roundedRect(margin, currentY, cardWidth, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(50, 100, 180);
  doc.text('Max kostnad', margin + 5, currentY + 8);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(enhancedData.totalCostAlt2 || 0), margin + 5, currentY + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Maximal kostnad för break-even', margin + 5, currentY + 30);
  
  // Kort 6: Minsta effekt
  doc.setFillColor(245, 235, 255); // Ljuslila bakgrund
  doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, 40, 3, 3, 'F');
  doc.setDrawColor(230, 215, 245); // Ljuslila ram
  doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(140, 80, 180);
  doc.text('Minsta effekt', margin + cardWidth + 15, currentY + 8);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const minEffectText = enhancedData.minEffectForBreakEvenAlt3 !== undefined ? formatPercent(enhancedData.minEffectForBreakEvenAlt3) : 'N/A';
  doc.text(minEffectText, margin + cardWidth + 15, currentY + 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Minsta effekt för break-even', margin + cardWidth + 15, currentY + 30);
  
  currentY += 60; // Flytta ner för detaljsektioner
  
  // Lägg till en ny sida för detaljsektioner
  doc.addPage();
  currentY = 20;
  
  // Nuläge med tydligare visuell stil
  if (enhancedData.currentSituation) {
    currentY = addSectionWithStyle(doc, 'Nuläge', enhancedData.currentSituation, currentY, margin, contentWidth);
    
    // Lägg till nulägesstatistik om den finns
    if (enhancedData.stressPercentage || enhancedData.productionLossValue || enhancedData.sickLeaveValue) {
      currentY += 5;
      
      const statsArray = [];
      if (enhancedData.stressPercentage) statsArray.push(['Andel av personalen med hög stressnivå', formatPercent(enhancedData.stressPercentage)]);
      if (enhancedData.productionLossValue) statsArray.push(['Värde av produktionsbortfall per år', formatCurrency(enhancedData.productionLossValue)]);
      if (enhancedData.sickLeaveValue) statsArray.push(['Kostnad för sjukfrånvaro per år', formatCurrency(enhancedData.sickLeaveValue)]);
      
      if (statsArray.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Mätning', 'Värde']],
          body: statsArray,
          theme: 'grid',
          headStyles: { fillColor: [60, 100, 170], textColor: 255 },
          margin: { left: margin, right: margin }
        });
        
        currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }
  }
  
  // Övriga sektioner med förbättrad visuell presentation
  if (enhancedData.causeAnalysis) {
    currentY = addSectionWithStyle(doc, 'Orsaksanalys', enhancedData.causeAnalysis, currentY, margin, contentWidth);
  }
  
  if (enhancedData.interventionPurpose) {
    currentY = addSectionWithStyle(doc, 'Syfte med insatserna', enhancedData.interventionPurpose, currentY, margin, contentWidth);
  }
  
  if (enhancedData.goalsDescription) {
    currentY = addSectionWithStyle(doc, 'Målsättning', enhancedData.goalsDescription, currentY, margin, contentWidth);
  }
  
  if (enhancedData.targetGroup) {
    currentY = addSectionWithStyle(doc, 'Målgrupp', enhancedData.targetGroup, currentY, margin, contentWidth);
  }
  
  // Kontrollera om vi behöver en ny sida för längre sektioner
  if (currentY > 240 && (enhancedData.interventionDescription || enhancedData.interventionsArray)) {
    doc.addPage();
    currentY = 20;
  }
  
  // Visa intervention i ett färgat kort med ram, liknande genomförandeplan
  if (enhancedData.interventionsArray && enhancedData.interventionsArray.length > 0) {
    const cardHeight = Math.max(70, enhancedData.interventionsArray.length * 7 + 25); // Dynamisk höjd baserat på antal interventioner
    
    // Interventionskort
    doc.setFillColor(240, 240, 255); // Ljusblå bakgrund för intervention
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(220, 230, 250); // Ljusblå ram
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(12);
    doc.setTextColor(60, 100, 170); // Blå färg för rubrik
    doc.text('Intervention', margin + 5, currentY + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    // Visa interventionerna som numrerad lista
    let lineY = currentY + 18;
    enhancedData.interventionsArray.forEach((intervention, index) => {
      if (intervention.trim()) {
        const interventionText = `${index + 1}. ${intervention.trim()}`;
        const interventionLines = doc.splitTextToSize(interventionText, contentWidth - 15);
        doc.text(interventionLines, margin + 5, lineY);
        lineY += interventionLines.length * 5 + 2; // Lägg till lite extra utrymme mellan punkter
      }
    });
    
    currentY += cardHeight + 10;
    
    // Kostnader visas endast om de finns
    if (enhancedData.interventionCosts && enhancedData.interventionCosts.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Kostnadsfördelning', margin, currentY);
      currentY += 5;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Beskrivning', 'Belopp']],
        body: enhancedData.interventionCosts.map(cost => [cost.description, formatCurrency(cost.amount)]),
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], textColor: 255 },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }
  // Annars använd den gamla interventionDescription som tidigare
  else if (enhancedData.interventionDescription) {
    // Visa intervention i ett färgat kort med ram
    const interventions = enhancedData.interventionDescription.split(',');
    const cardHeight = Math.max(70, interventions.length * 7 + 25); // Dynamisk höjd
    
    // Interventionskort
    doc.setFillColor(240, 240, 255); // Ljusblå bakgrund för intervention
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(220, 230, 250); // Ljusblå ram
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(12);
    doc.setTextColor(60, 100, 170); // Blå färg för rubrik
    doc.text('Intervention', margin + 5, currentY + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    // Visa interventionerna som numrerad lista
    let lineY = currentY + 18;
    interventions.forEach((intervention, index) => {
      const trimmedIntervention = intervention.trim();
      if (trimmedIntervention) {
        const number = index + 1;
        const interventionText = `${number}. ${trimmedIntervention}`;
        const interventionLines = doc.splitTextToSize(interventionText, contentWidth - 15);
        doc.text(interventionLines, margin + 5, lineY);
        lineY += interventionLines.length * 5 + 2; // Lägg till lite extra utrymme mellan punkter
      }
    });
    
    currentY += cardHeight + 10;
    
    // Kostnader visas endast om de finns
    if (enhancedData.interventionCosts && enhancedData.interventionCosts.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Kostnadsfördelning', margin, currentY);
      currentY += 5;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Beskrivning', 'Belopp']],
        body: enhancedData.interventionCosts.map(cost => [cost.description, formatCurrency(cost.amount)]),
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], textColor: 255 },
        margin: { left: margin, right: margin }
      });
      
      currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }
  
  // Kontrollera om vi behöver en ny sida för genomförandeplan och rekommendation
  if (currentY > 220 && ((enhancedData.implementationPlan || enhancedData.implementationPlanArray) && enhancedData.recommendation)) {
    doc.addPage();
    currentY = 20;
  }
  
  // Genomförandeplan och rekommendation sida vid sida om möjligt
  if ((enhancedData.implementationPlan || enhancedData.implementationPlanArray) && enhancedData.recommendation) {
    // Om båda finns, placera dem sida vid sida i färgade kort
    const cardHeight = 70;
    
    // Genomförandeplan
    doc.setFillColor(255, 245, 230); // Ljusorange bakgrund
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(240, 220, 200); // Ljusorange ram
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(12);
    doc.setTextColor(180, 100, 40);
    doc.text('Genomförandeplan', margin + 5, currentY + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    // Hantera genomförandeplan beroende på om det är array eller sträng
    if (enhancedData.implementationPlanArray && enhancedData.implementationPlanArray.length > 0) {
      // Visa genomförandeplan som numrerad lista
      let lineY = currentY + 18;
      enhancedData.implementationPlanArray.forEach((step, index) => {
        if (step.trim()) {
          const stepText = `${index + 1}. ${step.trim()}`;
          const stepLines = doc.splitTextToSize(stepText, cardWidth - 10);
          doc.text(stepLines, margin + 5, lineY);
          lineY += stepLines.length * 5;
        }
      });
    } else {
      // Fallback till strängen
      const planLines = doc.splitTextToSize(enhancedData.implementationPlan || '', cardWidth - 10);
      doc.text(planLines, margin + 5, currentY + 18);
    }
    
    // Rekommendation
    doc.setFillColor(240, 255, 240); // Ljusgrön bakgrund
    doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(220, 240, 220); // Ljusgrön ram
    doc.roundedRect(margin + cardWidth + 10, currentY, cardWidth, cardHeight, 3, 3, 'S');
    
    doc.setFontSize(12);
    doc.setTextColor(60, 160, 60);
    doc.text('Rekommendation för beslut', margin + cardWidth + 15, currentY + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const recLines = doc.splitTextToSize(enhancedData.recommendation || '', cardWidth - 10);
    doc.text(recLines, margin + cardWidth + 15, currentY + 18);
    
    currentY += cardHeight + 20;
  } else {
    // Annars lägg till dem i sekvens
    if (enhancedData.implementationPlanArray && enhancedData.implementationPlanArray.length > 0) {
      currentY = addInterventionsWithStyle(doc, 'Genomförandeplan', enhancedData.implementationPlanArray, currentY, margin, contentWidth);
    } else if (enhancedData.implementationPlan) {
      currentY = addSectionWithStyle(doc, 'Genomförandeplan', enhancedData.implementationPlan, currentY, margin, contentWidth);
    }
    
    if (enhancedData.recommendation) {
      currentY = addSectionWithStyle(doc, 'Rekommendation för beslut', enhancedData.recommendation, currentY, margin, contentWidth);
    }
  }
  
  // Kontrollera om vi behöver en ny sida för slutsatsen
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }
  
  // Slutsats i en färgad ruta
  const conclusion = generateConclusion(enhancedData);
  
  if (conclusion) {
    doc.setFillColor(245, 245, 250); // Ljusblå bakgrund för slutsats
    doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F');
    doc.setDrawColor(220, 220, 230);
    doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'S');
    
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Slutsats', margin + 5, currentY + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const conclusionLines = doc.splitTextToSize(conclusion, contentWidth - 10);
    doc.text(conclusionLines, margin + 5, currentY + 20);
    
    currentY += 60;
  }
  
  // Lägg till sidfot på alla sidor
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFillColor(240, 240, 245); // Ljusgrå bakgrund för sidfot
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 120);
    doc.text(`${enhancedData.sharedFields.organizationName || 'Organisation inte angiven'} | Kontaktperson: ${enhancedData.sharedFields.contactPerson || 'Ej angiven'}`, margin, doc.internal.pageSize.getHeight() - 7);
    doc.text(`Sida ${i} av ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 7, { align: 'right' });
  }
  
  // Spara filen till användarens dator
  const filename = `ROI-rapport-${enhancedData.sharedFields.organizationName || 'rapport'}-${today.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

/**
 * Hjälpfunktion för att lägga till en sektion med förbättrad visuell stil
 */
function addSectionWithStyle(doc: jsPDF, title: string, text: string, y: number, margin: number, width: number): number {
  // Kontrollera om vi behöver en ny sida innan vi lägger till rubriken
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  // Lägg till sektionsrubrik med färgad bakgrund
  doc.setFillColor(245, 245, 250); // Ljusblå bakgrund för rubrik
  doc.roundedRect(margin, y - 4, width, 8, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text(title, margin + 5, y);
  
  // Lägg till text
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  // Kontrollera om texten är en intervention som behöver formateras
  if (title === 'Intervention') {
    // Splitta på kommatecken för att få de enskilda interventionerna
    const interventions = text.split(',');
    
    // Kontrollera om listan skulle gå utanför sidan
    if (y + (interventions.length * 7) > 270) {
      doc.addPage();
      y = 20;
      
      // Upprepa rubriken på den nya sidan
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(margin, y - 4, width, 8, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(`${title} (forts.)`, margin + 5, y);
      
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
    }
    
    // Visa varje intervention som en numrerad punkt
    interventions.forEach((intervention, index) => {
      const trimmedIntervention = intervention.trim();
      if (trimmedIntervention) {
        const number = index + 1;
        doc.text(`${number}. ${trimmedIntervention}`, margin + 5, y);
        y += 7; // Öka y med ett mindre värde per rad för att ge en tätare lista
      }
    });
    
    return y + 5; // Lite extra utrymme efter listan
  } else {
    const textLines = doc.splitTextToSize(text, width);
    
    // Om texten skulle gå utanför sidan, lägg till en ny sida
    if (y + (textLines.length * 5) > 270) {
      doc.addPage();
      y = 20;
      
      // Upprepa rubriken på den nya sidan
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(margin, y - 4, width, 8, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(`${title} (forts.)`, margin + 5, y);
      
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
    }
    
    doc.text(textLines, margin, y);
    
    return y + (textLines.length * 5) + 10; // Returnera ny Y-position med marginal
  }
}

/**
 * Hjälpfunktion för att generera slutsats
 */
function generateConclusion(data: ROIReportData): string {
  if (!data) {
    return 'Baserat på tillgänglig data kan vi inte fastställa en ROI-analys. Vänligen fyll i både kostnader och fördelar för att generera en slutsats.';
  }
  
  if (data.totalCost <= 0 || data.totalBenefit <= 0) {
    return 'Baserat på tillgänglig data kan vi inte fastställa en fullständig ROI-analys. Vänligen fyll i både kostnader och fördelar för att generera en slutsats.';
  }
  
  const costText = formatCurrency(data.totalCost);
  const benefitText = formatCurrency(data.totalBenefit);
  const roiText = data.roi ? formatPercent(data.roi) : "0%";
  const paybackText = data.paybackPeriod ? formatMonths(data.paybackPeriod) : "okänd tid";
  
  return `Baserat på våra analyser ger en investering på ${costText} för att minska stressnivån på arbetsplatsen en ekonomisk nytta på ${benefitText} under ett år.

Detta ger en avkastning på ${roiText}, och investeringen återbetalar sig på ${paybackText}.

Avkastningen är uppenbart lönsam och vi rekommenderar ett beslut om genomförande av interventionen.`;
}

// Lägg till en ny funktion för att visa interventioner som en numrerad lista
function addInterventionsWithStyle(doc: jsPDF, title: string, interventions: string[], y: number, margin: number, width: number): number {
  // Kontrollera om vi behöver en ny sida innan vi lägger till rubriken
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  // Lägg till sektionsrubrik med färgad bakgrund
  doc.setFillColor(245, 245, 250); // Ljusblå bakgrund för rubrik
  doc.roundedRect(margin, y - 4, width, 8, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text(title, margin + 5, y);
  
  // Lägg till interventioner
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  // Kontrollera om listan skulle gå utanför sidan
  if (y + (interventions.length * 7) > 270) {
    doc.addPage();
    y = 20;
    
    // Upprepa rubriken på den nya sidan
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin, y - 4, width, 8, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.text(`${title} (forts.)`, margin + 5, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
  }
  
  // Visa varje intervention som en numrerad punkt
  interventions.forEach((intervention, index) => {
    if (intervention.trim()) {
      const number = index + 1;
      doc.text(`${number}. ${intervention.trim()}`, margin + 5, y);
      y += 7; // Öka y med ett mindre värde per rad för att ge en tätare lista
    }
  });
  
  return y + 5; // Lite extra utrymme efter listan
}

/**
 * Exporterar ROI-data till en PDF genom att använda webbläsarens utskriftsfunktion
 * Detta ger en exakt kopia av webbsidan med all styling intakt
 */
export function printToPdf(): void {
  // Spara nuvarande scrollposition
  const scrollPosition = window.scrollY;
  
  // Applicera tillfällig CSS för att förbättra utskrift
  const style = document.createElement('style');
  style.id = 'print-style';
  style.innerHTML = `
    @media print {
      @page { 
        size: A4 portrait;
        margin: 10mm; 
      }
      body { 
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
        background-color: white !important;
      }
      
      /* Dölj element som inte behövs i utskriften */
      .no-print, .no-print * {
        display: none !important;
      }
      nav, footer, header, button, [role="navigation"], 
      a[href]:not([href^="#"]), a.no-print {
        display: none !important;
      }
      
      /* Se till att alla diagram och tabeller får plats på en sida */
      .chart-container, .table-container {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      /* Förhindra sidbrytning inuti viktiga element */
      h1, h2, h3, h4, h5, h6, img, table, figure, .card, div[class*="chart"], div[class*="card"], div[class*="statItem"] {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      /* Se till att rubriker inte blir ensamma på slutet av en sida */
      h1, h2, h3, h4, h5, h6 {
        break-after: avoid;
        page-break-after: avoid;
      }
      
      /* Säkerställ att all text är svart för bättre utskriftsläsbarhet */
      p, h1, h2, h3, h4, h5, h6, span, li, td, th {
        color: black !important;
      }
      
      /* Säkerställ att alla kort och tabeller har synliga kanter vid utskrift */
      .card, .table, table, div[class*="card"], div[class*="statItem"] {
        border: 1px solid #ddd !important;
        box-shadow: none !important;
      }
      
      /* Förbättra läsbarheten av grafiska element */
      svg, canvas {
        max-width: 100% !important;
      }
      
      /* Förbättra container-utseende för utskrift */
      .container {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Lägg till no-print klasser på nav/knappar som inte ska vara med i utskriften
  const elementsToHide = document.querySelectorAll(
    'nav, header, footer, [role="navigation"], button:not(.print-include), a.back-link, .tabs-list'
  );
  const hiddenElements: Element[] = [];
  
  elementsToHide.forEach(el => {
    if (!el.classList.contains('no-print')) {
      el.classList.add('no-print');
      hiddenElements.push(el);
    }
  });
  
  // Säkerställ att hela rapportinnehållet är synligt före utskrift
  const reportContent = document.querySelector('.container');
  if (reportContent) {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
  
  // Anropa utskriftsdialogen
  setTimeout(() => {
    window.print();
    
    // Återställning: Ta bort temp-styling och dolda elements-klasser
    setTimeout(() => {
      document.head.removeChild(style);
      hiddenElements.forEach(el => {
        el.classList.remove('no-print');
      });
      
      // Återställ scroll-positionen
      window.scrollTo(0, scrollPosition);
    }, 1000);
  }, 300); // Liten fördröjning för att säkerställa att CSS hinner laddas
} 