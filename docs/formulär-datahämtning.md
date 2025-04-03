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
}, [currentUser, autoFetchStatus, handleChange]);
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

## Implementering: Formulär C hämtar data från formulären D, E och F

I detta exempel har vi implementerat att Formulär C (kostnadsberäkningar) automatiskt hämtar data från Formulär D (personalkostnader), Formulär E (kort sjukfrånvaro) och Formulär F (lång sjukfrånvaro).

### 1. Definiera datainterfacen för källformulären

```typescript
// I FormC.tsx
interface FormDData {
  totalPersonnelCosts?: number;  // Hämtas till C4: Totala personalkostnader
}

interface FormEData {
  totalSickLeaveCosts?: number;  // Hämtas till C11: Kostnad för kort sjukfrånvaro
  shortSickLeavePercentage?: number; // Hämtas till C12: Andel av kort sjukfrånvaro pga psykisk ohälsa
}

interface FormFData {
  totalLongSickLeaveCosts?: number;  // Hämtas till C14: Kostnad för lång sjukfrånvaro
  longSickLeavePercentage?: number;  // Hämtas till C15: Andel av lång sjukfrånvaro pga psykisk ohälsa
}
```

### 2. Implementera AutoFilledField-komponenten i FormC

```typescript
// I FormC.tsx
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
        <CalculatorIcon className="w-3 h-3" />
        <span>Auto från Formulär {sourceFormName}</span>
      </div>
      {isEmpty ? (
        <span className="text-amber-500 font-medium">Saknar värde i formulär {sourceFormName}</span>
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

### 3. Lägg till state för att spåra automatisk datahämtning i FormC

```typescript
// I FormC.tsx
const [autoFetchStatus, setAutoFetchStatus] = useState({
  hasFetched: false,             // Om datahämtning har körts
  personnelCosts: false,         // Om personalkostnader har hämtats från FormD
  shortSickLeaveCosts: false,    // Om korttidssjukfrånvarokostnader har hämtats från FormE
  shortSickLeavePercent: false,  // Om kort sjukfrånvaroprocent har hämtats från FormE
  longSickLeaveCosts: false,     // Om långtidssjukfrånvarokostnader har hämtats från FormF
  longSickLeavePercent: false,   // Om lång sjukfrånvaroprocent har hämtats från FormF
  errorMessage: null as string | null
});
```

### 4. Uppdatera FormCProps för navigering

```typescript
// I FormC.tsx
type FormCProps = React.ComponentProps<'div'> & {
  onNavigateToForm?: (formName: string) => void;
};

// Hjälpfunktion för navigering
const navigateToForm = (formName: string) => {
  if (onNavigateToForm) {
    onNavigateToForm(formName);
  } else {
    console.warn('Navigation callback is not provided to FormC component');
  }
};
```

### 5. Implementera automatisk datahämtning vid inladdning av FormC

```typescript
// I FormC.tsx
useEffect(() => {
  const autoFetchFromOtherForms = async () => {
    if (autoFetchStatus.hasFetched || !currentUser?.uid) return;
    
    try {
      // Spara aktuell status för autoFetch
      const currentStatus = { ...autoFetchStatus, hasFetched: true };
      setAutoFetchStatus(currentStatus);
      
      // Hämta data från FormD
      const formDData = await loadFormData<FormDData>(currentUser.uid, 'D');
      if (formDData) {
        // Hämta totalPersonnelCosts om det finns
        if (formDData.totalPersonnelCosts !== undefined) {
          const roundedValue = Math.round(formDData.totalPersonnelCosts);
          handleChange('totalPersonnelCosts', roundedValue);
          currentStatus.personnelCosts = true;
        }
      }
      
      // Hämta data från FormE
      const formEData = await loadFormData<FormEData>(currentUser.uid, 'E');
      if (formEData) {
        // Hämta totalSickLeaveCosts om det finns
        if (formEData.totalSickLeaveCosts !== undefined) {
          const roundedValue = Math.round(formEData.totalSickLeaveCosts);
          handleChange('costShortSickLeave', roundedValue);
          currentStatus.shortSickLeaveCosts = true;
        }
        
        // Hämta procentsats för kort sjukfrånvaro om det finns
        if (formEData.shortSickLeavePercentage !== undefined) {
          handleChange('percentShortSickLeaveMentalHealth', formEData.shortSickLeavePercentage);
          currentStatus.shortSickLeavePercent = true;
        }
      }
      
      // Hämta data från FormF
      const formFData = await loadFormData<FormFData>(currentUser.uid, 'F');
      if (formFData) {
        // Hämta totalLongSickLeaveCosts om det finns
        if (formFData.totalLongSickLeaveCosts !== undefined) {
          const roundedValue = Math.round(formFData.totalLongSickLeaveCosts);
          handleChange('costLongSickLeave', roundedValue);
          currentStatus.longSickLeaveCosts = true;
        }
        
        // Hämta procentsats för lång sjukfrånvaro om det finns
        if (formFData.longSickLeavePercentage !== undefined) {
          handleChange('percentLongSickLeaveMentalHealth', formFData.longSickLeavePercentage);
          currentStatus.longSickLeavePercent = true;
        }
      }
      
      setAutoFetchStatus(currentStatus);
    } catch (error) {
      console.error('Fel vid automatisk hämtning från andra formulär:', error);
      setAutoFetchStatus(prev => ({ 
        ...prev, 
        hasFetched: true, 
        errorMessage: 'Kunde inte automatiskt hämta data från formulär D, E och F.' 
      }));
    }
  };
  
  autoFetchFromOtherForms();
}, [currentUser, autoFetchStatus, handleChange]);
```

### 6. Visa information om automatiskt hämtad data i FormC

```tsx
{/* I FormC.tsx */}
{autoFetchStatus.hasFetched && (autoFetchStatus.personnelCosts || 
                              autoFetchStatus.shortSickLeaveCosts || 
                              autoFetchStatus.shortSickLeavePercent || 
                              autoFetchStatus.longSickLeaveCosts || 
                              autoFetchStatus.longSickLeavePercent) && (
  <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
    <p className="font-medium">Följande data har automatiskt hämtats:</p>
    <ul className="list-disc list-inside mt-1">
      {autoFetchStatus.personnelCosts && <li>Totala personalkostnader från Formulär D</li>}
      {autoFetchStatus.shortSickLeaveCosts && <li>Kostnader för kort sjukfrånvaro från Formulär E</li>}
      {autoFetchStatus.shortSickLeavePercent && <li>Procent kort sjukfrånvaro från Formulär E</li>}
      {autoFetchStatus.longSickLeaveCosts && <li>Kostnader för lång sjukfrånvaro från Formulär F</li>}
      {autoFetchStatus.longSickLeavePercent && <li>Procent lång sjukfrånvaro från Formulär F</li>}
    </ul>
  </div>
)}

{autoFetchStatus.errorMessage && (
  <div className="p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm mb-4">
    {autoFetchStatus.errorMessage}
  </div>
)}
```

### 7. Implementera fält med AutoFilledField i FormC

```tsx
{/* Exempel för totalPersonnelCosts (C4) */}
<div className="space-y-2">
  <label className="text-sm font-medium">
    C4: Totala personalkostnader (lön + sociala + kringkostnader), kr per år
  </label>
  <InfoLabel text="Detta fält hämtas automatiskt från formulär D9" />
  <AutoFilledField
    value={`${formatNumber(formData.totalPersonnelCosts || 0)} kr`}
    sourceFormName="D"
    onNavigate={navigateToForm}
    isEmpty={!autoFetchStatus.personnelCosts || !formData.totalPersonnelCosts}
  />
</div>

{/* Exempel för percentShortSickLeaveMentalHealth (C12) */}
<div className="space-y-2">
  <label className="text-sm font-medium">C12: Andel av kort sjukfrånvaro som beror på psykisk ohälsa (%)</label>
  <InfoLabel text="Standardvärde är 6% baserat på forskning..." />
  <AutoFilledField
    value={`${formatNumber(formData.percentShortSickLeaveMentalHealth || 0)} %`}
    sourceFormName="E"
    onNavigate={navigateToForm}
    isEmpty={!autoFetchStatus.shortSickLeavePercent || !formData.percentShortSickLeaveMentalHealth}
  />
</div>
```

### 8. Uppdatera ROIPage.tsx för att inkludera navigeringsfunktion

```tsx
// I ROIPage.tsx
{currentForm === 'C' && <FormC 
  ref={formCRef} 
  onNavigateToForm={(formName) => {
    // Navigera till det specifika formuläret
    setCurrentForm(formName);
  }}
/>}
```

Genom att följa detta mönster kan du implementera automatisk datahämtning mellan alla formulär i applikationen, vilket ger en smidig användarupplevelse och minskar risken för felinmatning.

## Implementering: Formulär J hämtar data från formulären C och G

I detta exempel har vi implementerat att Formulär J (ROI-beräkningar) automatiskt hämtar data från Formulär C (kostnadsberäkningar) och Formulär G (insatskostnader).

### 1. Definiera datainterfacen för källformulären

```typescript
// I FormJ.tsx
interface FormCData {
  totalCostMentalHealth?: number;  // Hämtas till J5, J12, J16: Total kostnad för psykisk ohälsa
  [key: string]: unknown;
}

interface FormGData {
  totalInterventionCost?: number;  // Hämtas till J8, J15: Total kostnad för insatsen
  [key: string]: unknown;
}
```

### 2. Uppdatera FormJProps för navigering

```typescript
// I FormJ.tsx
type FormJProps = React.ComponentProps<'div'> & {
  onNavigateToForm?: (formName: string) => void;
};

// Hjälpfunktion för navigering
const navigateToForm = (formName: string) => {
  if (onNavigateToForm) {
    onNavigateToForm(formName);
  } else {
    console.warn('Navigation callback is not provided to FormJ component');
  }
};
```

### 3. Lägg till state för att spåra automatisk datahämtning i FormJ

```typescript
// I FormJ.tsx
const [autoFetchStatus, setAutoFetchStatus] = useState({
  hasFetched: false,
  costMentalHealthAlt1: false,     // J5: Total kostnad för psykisk ohälsa (alt 1)
  interventionCostAlt1: false,     // J8: Total kostnad för insatsen (alt 1)
  costMentalHealthAlt2: false,     // J12: Total kostnad för psykisk ohälsa (alt 2)
  interventionCostAlt3: false,     // J15: Total kostnad för insatsen (alt 3)
  costMentalHealthAlt3: false,     // J16: Total kostnad för psykisk ohälsa (alt 3)
  errorMessage: null as string | null
});
```

### 4. Implementera handleChange med useCallback

För att undvika att handleChange skapas på nytt vid varje rendering använder vi useCallback:

```typescript
// I FormJ.tsx
const handleChange = useCallback(<K extends keyof FormJData>(field: K, value: FormJData[K]) => {
  setFormData(prev => {
    const updatedData = { ...prev, [field]: value };
    return calculateValues(updatedData);
  });
}, []);
```

### 5. Implementera automatisk datahämtning vid inladdning av FormJ

```typescript
// I FormJ.tsx
useEffect(() => {
  const autoFetchFromForms = async () => {
    if (autoFetchStatus.hasFetched || !currentUser?.uid) return;
    
    try {
      // Spara aktuell status för autoFetch
      const currentStatus = { ...autoFetchStatus, hasFetched: true };
      setAutoFetchStatus(currentStatus);
      
      // Hämta data från Form C (totalCostMentalHealth)
      const formCData = await loadFormData<FormCData>(currentUser.uid, 'C');
      
      if (formCData && formCData.totalCostMentalHealth !== undefined) {
        const roundedValue = Math.round(formCData.totalCostMentalHealth);
        
        // Uppdatera alla fält som använder totalCostMentalHealth
        handleChange('totalCostMentalHealthAlt1', roundedValue);
        handleChange('totalCostMentalHealthAlt2', roundedValue);
        handleChange('totalCostMentalHealthAlt3', roundedValue);
        
        currentStatus.costMentalHealthAlt1 = true;
        currentStatus.costMentalHealthAlt2 = true;
        currentStatus.costMentalHealthAlt3 = true;
      }
      
      // Hämta data från Form G (totalInterventionCost)
      const formGData = await loadFormData<FormGData>(currentUser.uid, 'G');
      
      if (formGData && formGData.totalInterventionCost !== undefined) {
        const roundedValue = Math.round(formGData.totalInterventionCost);
        
        // Uppdatera alla fält som använder totalInterventionCost
        handleChange('totalInterventionCostAlt1', roundedValue);
        handleChange('totalInterventionCostAlt3', roundedValue);
        
        currentStatus.interventionCostAlt1 = true;
        currentStatus.interventionCostAlt3 = true;
      }
      
      setAutoFetchStatus(currentStatus);
    } catch (error) {
      console.error('Fel vid automatisk hämtning från formulär:', error);
      setAutoFetchStatus(prev => ({ 
        ...prev, 
        hasFetched: true, 
        errorMessage: 'Kunde inte automatiskt hämta data från formulär C och G.' 
      }));
    }
  };
  
  autoFetchFromForms();
}, [currentUser, autoFetchStatus, handleChange]);
```

### 6. Visa information om automatiskt hämtad data i FormJ

```tsx
{/* I FormJ.tsx */}
{autoFetchStatus.hasFetched && (
  autoFetchStatus.costMentalHealthAlt1 || 
  autoFetchStatus.interventionCostAlt1 || 
  autoFetchStatus.costMentalHealthAlt2 || 
  autoFetchStatus.interventionCostAlt3 || 
  autoFetchStatus.costMentalHealthAlt3
) && (
  <div className="p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-sm mb-4">
    <p className="font-medium">Följande data har automatiskt hämtats:</p>
    <ul className="list-disc list-inside mt-1">
      {(autoFetchStatus.costMentalHealthAlt1 || 
        autoFetchStatus.costMentalHealthAlt2 || 
        autoFetchStatus.costMentalHealthAlt3) && 
        <li>Total kostnad för psykisk ohälsa från Formulär C</li>
      }
      {(autoFetchStatus.interventionCostAlt1 || 
        autoFetchStatus.interventionCostAlt3) && 
        <li>Total kostnad för insatsen från Formulär G</li>
      }
    </ul>
  </div>
)}

{autoFetchStatus.errorMessage && (
  <div className="p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm mb-4">
    {autoFetchStatus.errorMessage}
  </div>
)}
```

### 7. Implementera fält med AutoFilledField i FormJ

```tsx
{/* Exempel för totalCostMentalHealthAlt1 (J5) */}
<div className="space-y-2">
  <label className="text-sm font-medium">J5: Total kostnad för psykisk ohälsa, kr per år</label>
  <InfoLabel text="Detta fält hämtas automatiskt från formulär C20" />
  {autoFetchStatus.costMentalHealthAlt1 ? (
    <AutoFilledField
      value={`${formatNumber(safeFormData.totalCostMentalHealthAlt1 || 0)} kr`}
      sourceFormName="C"
      onNavigate={navigateToForm}
      isEmpty={!safeFormData.totalCostMentalHealthAlt1}
    />
  ) : (
    <>
      <FormattedNumberInput
        value={safeFormData.totalCostMentalHealthAlt1}
        onChange={(value) => handleChange('totalCostMentalHealthAlt1', value)}
        allowDecimals={false}
        placeholder="0"
        className="bg-background/50"
      />
      <FetchValueButton 
        onClick={() => fetchValueFromForm('C', 'totalCostMentalHealthAlt1', setTransferMessage)}
        disabled={!currentUser?.uid}
        formName="C"
        message={transferMessage}
      />
    </>
  )}
</div>
```

### 8. Uppdatera ROIPage.tsx för att inkludera navigeringsfunktion

```tsx
// I ROIPage.tsx
{currentForm === 'J' && <FormJ 
  ref={formJRef} 
  onNavigateToForm={(formName) => {
    // Navigera till det specifika formuläret
    setCurrentForm(formName);
  }}
/>}
```

### 9. Specialfunktioner för Formulär J

I Formulär J används samma data (total kostnad för psykisk ohälsa och total kostnad för insatsen) i flera olika beräkningsalternativ, vilket kräver en något annorlunda implementation:

1. Vi hämtar data från källformulären en gång och använder den för att populera flera olika fält i Formulär J.
2. Vi håller reda på vilka fält som har uppdaterats i autoFetchStatus.
3. Vi visar automatiskt hämtad data på samma sätt för alla fält som använder samma källa.

Detta ger en smidig användarupplevelse där alla relevanta fält uppdateras konsekvent från samma källdata.

## Slutsats

Genom att följa denna implementering kan du enkelt skapa datahämtning mellan olika formulär i applikationen. Kom ihåg att:

1. Definiera tydliga interfacen för källformulärets data
2. Implementera automatisk datahämtning vid sidladdning
3. Validera beroenden mellan fält
4. Ge tydlig visuell feedback till användaren
5. Implementera navigering mellan formulär

Detta ger en konsistent användarupplevelse och minskar behovet av manuell dataöverföring mellan formulär. 