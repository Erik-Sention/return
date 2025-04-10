# PDF-export med webbläsarens utskriftsfunktion

## Bakgrund

Tidigare exporterades PDF för exekutiva rapporter genom att programmatiskt bygga upp PDF-dokumentet med biblioteket jsPDF. Detta fungerade men resulterade i ett dokument som skiljde sig utseendemässigt från den digitala versionen.

För att skapa en PDF som exakt återspeglar rapporten såsom den visas i webbgränssnittet implementerades en ny metod som använder webbläsarens inbyggda utskriftsfunktion (print to PDF).

## Implementering

### 1. Ny funktion för printToPdf

En ny funktion `printToPdf` skapades i `src/lib/reports/pdfExport.ts` som använder webbläsarens inbyggda utskriftsfunktion:

```typescript
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
```

### 2. Uppdatering av PDF-exportfunktioner

Bytte ut den gamla `exportROIToPdf` med den nya `printToPdf` i både exekutiv och detaljerad rapport:

**Exekutiv sammanfattning:**
```typescript
// src/app/rapporter/exekutiv/page.tsx
const handleExportPdf = async () => {
  if (!reportData || !currentUser) return;
  
  try {
    printToPdf();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Ett fel uppstod vid export till PDF. Försök igen senare.');
  }
};
```

**Detaljerad rapport:**
```typescript
// src/app/rapporter/detaljerad/layout.tsx
const handleExportPdf = () => {
  if (!reportData) return;
  
  try {
    printToPdf();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Ett fel uppstod vid export till PDF. Försök igen senare.');
  }
};
```

## Nyckelfunktioner

### Exakt utseende från webbsidan
Genom att använda webbläsarens inbyggda utskriftsfunktion säkerställs att PDF:en behåller exakt samma utseende som webbsidan, inklusive CSS-styling, layout och färger.

### Skriva ut utan brytningar i innehåll
Speciella CSS-regler har lagts till för att förhindra att viktiga element delas mellan sidor:
- `break-inside: avoid` och `page-break-inside: avoid` för kort, tabeller, bilder och rubriker
- `break-after: avoid` och `page-break-after: avoid` för rubriker så de inte hamnar ensamma i slutet av en sida

### Automatiskt dölja navigeringselement
När PDF:en genereras döljs automatiskt:
- Navigationsfält
- Knappar (utom de som specifikt markerats för att inkluderas)
- Sidhuvud och sidfot
- Externa länkar

### Användning
Användaren klickar på "Exportera PDF" i rapporten, vilket öppnar webbläsarens utskriftsdialog där användaren kan välja att spara som PDF. Detta genererar en exakt kopia av rapporten som visas på skärmen.

## Fördelar
- Exakt samma utseende i PDF som på webbsidan
- Alla diagram, tabeller och layoutelement behålls intakta
- Förbättrad läsbarhet med kontroll över sidbrytningar
- Enklare underhåll då styling automatiskt följer webbgränssnittets utseende
- Ingen tredjepartsbibliotekskod behövs för att generera innehållet i PDF:en

## Framtida förbättringar
- Lägg till ett automatiskt försättsblad
- Förbättra hantering av sidfot och sidnummer 