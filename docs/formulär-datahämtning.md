# Implementering av datahämtning mellan formulär

Detta dokument beskriver hur datahämtning mellan formulär har implementerats i ROI-kalkylatorn, med specifikt fokus på hur Formulär A hämtar data från Formulär C. Denna lösning kan återanvändas för att implementera liknande funktionalitet mellan andra formulär.

## Översikt

Implementeringen består av följande huvudkomponenter:

1. **Automatisk datahämtning vid sidladdning**
2. **Tydlig visuell presentation av hämtad data**
3. **Validering av datakällor**
4. **Navigation mellan formulär**
5. **Felhantering**

## Grundläggande principer

- Datahämtning sker från Firebase databas via loadFormData-funktionen
- Dataflödet går från källformuläret (t.ex. Formulär C) till mottagarformuläret (t.ex. Formulär A)
- Hämtad data presenteras med tydlig indikation om datakällan
- Användaren kan navigera direkt till källformuläret vid behov
- Datahämtning sker automatiskt vid inladdning av mottagarformuläret

## Steg-för-steg implementering

Följ dessa steg för att implementera datahämtning mellan formulär:

### 1. Definiera datainterfacet för källformuläret

```typescript
// I mottagarformuläret (t.ex. FormA.tsx)
interface FormCData {
  // Definiera de fält från källformuläret som behöver hämtas
  percentHighStress?: number;              // Exempel: C7
  valueProductionLoss?: number;            // Exempel: C10
  totalCostSickLeaveMentalHealth?: number; // Exempel: C17
  
  // För validering av beroenden mellan fält
  productionLossHighStress?: number;       // Exempel: C8
  costShortSickLeave?: number;             // Exempel: C11
  percentShortSickLeaveMentalHealth?: number; // Exempel: C12
  costLongSickLeave?: number;              // Exempel: C14
  percentLongSickLeaveMentalHealth?: number;  // Exempel: C15
  
  [key: string]: string | number | undefined | null;
}
```

### 2. Skapa AutoFilledField-komponenten

Skapa en komponent för att visa automatiskt hämtad data:

```typescript
// I mottagarformuläret (t.ex. FormA.tsx)
const AutoFilledField = ({ 
  value, 
  sourceFormName,
  onNavigate,
  isEmpty = false
}: { 
  value: string; 
  sourceFormName: string;
  onNavigate: (formName: string) => void;
  isEmpty?: boolean;
}) => (
  <div className="space-y-1">
    <div className="p-2 bg-primary/5 border border-dashed border-primary/40 rounded-md flex justify-between shadow-sm items-center">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calculator className="w-3 h-3" />
        <span>Auto från Formulär {sourceFormName}</span>
      </div>
      {isEmpty ? (
        <span className="text-amber-500 font-medium">Inget värde har fyllts i formulär {sourceFormName}</span>
      ) : (
        <span className="font-semibold">{value}</span>
      )}
    </div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onNavigate(sourceFormName)}
      className="mt-1"
    >
      <ArrowRight className="h-4 w-4 mr-2" />
      Gå till Formulär {sourceFormName}
    </Button>
  </div>
);
```

### 3. Lägg till state för att spåra automatisk datahämtning

```typescript
// I mottagarformulärets funktionskomponent
const [autoFetchStatus, setAutoFetchStatus] = useState({
  hasFetched: false,           // Om datahämtning har körts
  stressLevel: false,          // Om stressnivå har hämtats
  productionLoss: false,       // Om produktionsbortfall har hämtats
  sickLeaveCost: false,        // Om sjukfrånvarokostnad har hämtats
  errorMessage: null as string | null
});
```

### 4. Implementera automatisk datahämtning vid inladdning

```typescript
// I mottagarformulärets funktionskomponent
useEffect(() => {
  const autoFetchFromFormC = async () => {
    if (autoFetchStatus.hasFetched || !currentUser?.uid) return;
    
    try {
      // Spara aktuell status för autoFetch
      const currentStatus = { ...autoFetchStatus, hasFetched: true };
      setAutoFetchStatus(currentStatus);
      
      const formCData = await loadFormData<FormCData>(currentUser.uid, 'C');
      
      if (formCData) {
        const updatedStatus = { ...currentStatus };
        
        // Hämta stressnivå om tillgänglig
        if (formCData.percentHighStress !== undefined) {
          handleChange('stressLevel', formCData.percentHighStress);
          updatedStatus.stressLevel = true;
        }
        
        // Hämta produktionsbortfall om tillgänglig och beroende fält har värden
        if (formCData.valueProductionLoss !== undefined && 
            typeof formCData.productionLossHighStress === 'number' && 
            formCData.productionLossHighStress > 0) {
          handleChange('productionLoss', formCData.valueProductionLoss);
          updatedStatus.productionLoss = true;
        }
        
        // Kontrollera om alla nödvändiga fält för sjukfrånvarokostnad finns
        const hasAllSickLeaveFields = 
          formCData.costShortSickLeave !== undefined && 
          formCData.percentShortSickLeaveMentalHealth !== undefined &&
          formCData.costLongSickLeave !== undefined && 
          formCData.percentLongSickLeaveMentalHealth !== undefined;
        
        // Hämta sjukfrånvarokostnad endast om alla nödvändiga fält finns
        if (formCData.totalCostSickLeaveMentalHealth !== undefined && hasAllSickLeaveFields) {
          handleChange('sickLeaveCost', formCData.totalCostSickLeaveMentalHealth);
          updatedStatus.sickLeaveCost = true;
        }
        
        setAutoFetchStatus(updatedStatus);
      }
    } catch (error) {
      console.error('Fel vid automatisk hämtning från Formulär C:', error);
      setAutoFetchStatus(prev => ({ 
        ...prev, 
        hasFetched: true, 
        errorMessage: 'Kunde inte automatiskt hämta data från Formulär C. Gå till Formulär C för att fylla i data.' 
      }));
    }
  };
  
  autoFetchFromFormC();
}, [currentUser, autoFetchStatus.hasFetched, handleChange]);
```

### 5. Hjälpfunktion för att formatera nummer

```typescript
// I mottagarformulärets funktionskomponent
const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '';
  return num.toLocaleString('sv-SE');
};
```

### 6. Implementera navigering mellan formulär

```typescript
// I mottagarformulärets funktionskomponent
const navigateToForm = (formName: string) => {
  if (onNavigateToForm) {
    onNavigateToForm(formName);
  } else {
    console.warn('Navigation callback is not provided to FormA component');
  }
};
```

### 7. Uppdatera komponentens props för att ta emot navigeringsfunktion

```typescript
// I mottagarformuläret (t.ex. FormA.tsx)
type FormAProps = React.ComponentProps<'div'> & {
  onNavigateToForm?: (formName: string) => void;
};
```

### 8. Implementera presentationsdelen i formuläret

```tsx
{/* I mottagarformulärets JSX */}
<div className="space-y-2">
  <label className="text-sm font-medium">Andel av personalen med hög stressnivå (%)</label>
  <AutoFilledField
    value={formatNumber(formData.stressLevel || 0) + " %"}
    sourceFormName="C"
    onNavigate={navigateToForm}
    isEmpty={!autoFetchStatus.stressLevel || !formData.stressLevel}
  />
</div>
```

### 9. Visa information om automatiskt hämtad data

```tsx
{/* I mottagarformulärets JSX, nära början */}
{autoFetchStatus.hasFetched && (autoFetchStatus.stressLevel || autoFetchStatus.productionLoss || autoFetchStatus.sickLeaveCost) && (
  <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
    <p className="font-medium">Data har automatiskt hämtats från Formulär C:</p>
    <ul className="list-disc list-inside mt-1">
      {autoFetchStatus.stressLevel && <li>Andel personalen med hög stressnivå</li>}
      {autoFetchStatus.productionLoss && <li>Värde av produktionsbortfall</li>}
      {autoFetchStatus.sickLeaveCost && <li>Kostnad för sjukfrånvaro</li>}
    </ul>
  </div>
)}

{autoFetchStatus.errorMessage && (
  <div className="p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm mb-4">
    {autoFetchStatus.errorMessage}
  </div>
)}
```

### 10. Uppdatera föräldrakomponenten (ROIPage)

För att hantera navigering mellan formulär:

```tsx
// I ROIPage.tsx
{currentForm === 'A' && <FormA 
  ref={formARef} 
  onNavigateToForm={(formName) => {
    // Navigera till det specifika formuläret
    setCurrentForm(formName);
  }} 
/>}
```

## Viktiga koncept att känna till

### 1. Validering av beroenden mellan fält

För vissa fält är det viktigt att kontrollera om beroende fält finns och har giltiga värden. Till exempel:

- Produktionsbortfall kräver att `productionLossHighStress` (C8) har ett värde > 0
- Sjukfrånvarokostnad kräver att alla fält C11, C12, C14 och C15 har värden

### 2. Visuell presentation

- Använd `AutoFilledField`-komponenten för att tydligt visa att data kommer från ett annat formulär
- Använd `isEmpty`-flaggan för att visa ett meddelande när data saknas i källformuläret
- Inkludera en "Gå till"-knapp för att underlätta navigering till källformuläret

### 3. Felhantering

- Fånga upp och visa fel vid datahämtning
- Ge användaren tydlig information om vad som gick fel och vad nästa steg är

## Exempel på att återanvända för andra formulär

### Exempel: Formulär B hämtar data från Formulär D

1. Definiera interfacet för FormDData i FormB.tsx
2. Lägg till state för autoFetchStatus
3. Skapa en useEffect för att hämta data från Formulär D
4. Använd AutoFilledField-komponenten för presentation
5. Navigera till Formulär D via knappen

```typescript
// I FormB.tsx

interface FormDData {
  // Definiera de fält från Formulär D som behöver hämtas
  totalPersonnelCosts?: number;
  // ... andra relevanta fält
}

// I useEffect
const formDData = await loadFormData<FormDData>(currentUser.uid, 'D');
if (formDData && formDData.totalPersonnelCosts !== undefined) {
  handleChange('personnelCost', formDData.totalPersonnelCosts);
  updatedStatus.personnelCost = true;
}
```

## Slutsats

Genom att följa denna implementering kan du enkelt skapa datahämtning mellan olika formulär i applikationen. Kom ihåg att:

1. Definiera tydliga interfacen för källformulärets data
2. Implementera automatisk datahämtning vid sidladdning
3. Validera beroenden mellan fält
4. Ge tydlig visuell feedback till användaren
5. Implementera navigering mellan formulär

Detta ger en konsistent användarupplevelse och minskar behovet av manuell dataöverföring mellan formulär. 