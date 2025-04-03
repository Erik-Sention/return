# Guide: Implementera FadeIn i formulär

Detta dokument beskriver hur du kan implementera FadeIn-komponenten i alla formulär för att skapa en mjuk övergång när innehållet laddas in, istället för att använda en explicit laddningsindikator.

## Steg 1: Importera nödvändiga komponenter

Lägg till följande imports i toppen av formulärfilen:

```tsx
import { FadeIn } from '@/components/ui/fade-in';
```

## Steg 2: Lägg till laddningstillstånd i formulärkomponenten

Lägg till följande state-variabler i formulärkomponenten:

```tsx
const [isContentReady, setIsContentReady] = useState(false);
const [isDataLoading, setIsDataLoading] = useState(true);
const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
const [orgData, setOrgData] = useState<{ organizationName: string; contactPerson: string } | null>(null);
```

## Steg 3: Uppdatera datainladdningslogiken

Uppdatera den befintliga `loadFromFirebase`-funktionen (eller motsvarande) för att hantera laddningsstatus:

```tsx
const loadFromFirebase = async () => {
  if (currentUser?.uid) {
    try {
      setIsDataLoading(true);
      setError(null);
      const data = await loadFormData<FormData>(currentUser.uid, FORM_TYPE);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
      setError('Kunde inte ladda data från databasen.');
    } finally {
      setIsDataLoading(false);
    }
  } else {
    setIsDataLoading(false);
  }
};
```

## Steg 4: Lägg till en effekt för att kombinera alla laddningstillstånd

Lägg till följande useEffect för att avgöra när innehållet är redo att visas:

```tsx
useEffect(() => {
  if (!isDataLoading && !isOrgInfoLoading) {
    setIsContentReady(true);
  }
}, [isDataLoading, isOrgInfoLoading]);
```

## Steg 5: Skapa en callback för organisationsdata

Lägg till en callback-funktion för att hantera organisationsdata:

```tsx
const handleOrgDataLoaded = useCallback((data: { organizationName: string; contactPerson: string } | null) => {
  setOrgData(data);
}, []);
```

## Steg 6: Använd en dold OrganizationHeader för datahämtning

Lägg till en dold OrganizationHeader-komponent för att hämta organisationsdata:

```tsx
<div className="sr-only">
  <OrganizationHeader 
    onLoadingChange={setIsOrgInfoLoading} 
    onDataLoaded={handleOrgDataLoaded}
  />
</div>
```

## Steg 7: Visa organisationsdata direkt

Visa organisationsdata direkt i formuläret istället för att använda OrganizationHeader-komponentens rendering:

```tsx
{orgData && (orgData.organizationName || orgData.contactPerson) && (
  <div className="bg-primary/5 border border-primary/20 p-3 rounded-md mb-4">
    <div className="flex flex-col sm:flex-row justify-between">
      <div className="mb-2 sm:mb-0">
        <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
        <span className="ml-2 font-semibold">{orgData.organizationName || "Ej angiven"}</span>
      </div>
      <div>
        <span className="text-sm font-medium text-muted-foreground">Kontaktperson:</span>
        <span className="ml-2 font-semibold">{orgData.contactPerson || "Ej angiven"}</span>
      </div>
    </div>
  </div>
)}
```

## Steg 8: Omslut innehållet med FadeIn

Omslut formulärinnehållet med FadeIn-komponenten:

```tsx
<FadeIn show={isContentReady} duration={500}>
  {/* Formulärinnehåll */}
</FadeIn>
```

## Exempel på fullständig implementation

```tsx
const FormExample = forwardRef<FormExampleRef, FormExampleProps>(function FormExample(props, ref) {
  // Befintliga statevariabler...
  
  const [isContentReady, setIsContentReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  const [orgData, setOrgData] = useState<{ organizationName: string; contactPerson: string } | null>(null);
  
  // Ladda data från Firebase vid montering
  useEffect(() => {
    const loadFromFirebase = async () => {
      if (currentUser?.uid) {
        try {
          setIsDataLoading(true);
          setError(null);
          const data = await loadFormData<FormExampleData>(currentUser.uid, FORM_TYPE);
          if (data) {
            setFormData(data);
          }
        } catch (error) {
          console.error('Error loading data from Firebase:', error);
          setError('Kunde inte ladda data från databasen.');
        } finally {
          setIsDataLoading(false);
        }
      } else {
        setIsDataLoading(false);
      }
    };

    loadFromFirebase();
  }, [currentUser]);
  
  // Kombinera alla laddningstillstånd
  useEffect(() => {
    if (!isDataLoading && !isOrgInfoLoading) {
      setIsContentReady(true);
    }
  }, [isDataLoading, isOrgInfoLoading]);
  
  // Callback för när organisationsdata har laddats
  const handleOrgDataLoaded = useCallback((data: { organizationName: string; contactPerson: string } | null) => {
    setOrgData(data);
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Dold OrganizationHeader för att ladda data */}
      <div className="sr-only">
        <OrganizationHeader 
          onLoadingChange={setIsOrgInfoLoading} 
          onDataLoaded={handleOrgDataLoaded}
        />
      </div>
      
      <FadeIn show={isContentReady} duration={500}>
        <div className="space-y-4">
          {/* Visa organisationsdata direkt */}
          {orgData && (orgData.organizationName || orgData.contactPerson) && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-md mb-4">
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="mb-2 sm:mb-0">
                  <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
                  <span className="ml-2 font-semibold">{orgData.organizationName || "Ej angiven"}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Kontaktperson:</span>
                  <span className="ml-2 font-semibold">{orgData.contactPerson || "Ej angiven"}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Resten av formulärinnehållet */}
        </div>
      </FadeIn>
    </div>
  );
});
```

Genom att följa denna guide kommer formulären att tonas in på ett mjukt och elegant sätt när all innehåll är redo, vilket ger en sömlös användarupplevelse utan hackiga övergångar. 