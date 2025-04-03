# Guide: Implementera PageLoader i formulär

Detta dokument beskriver hur du kan implementera PageLoader-komponenten i alla formulär för att undvika att gränssnittet hoppar när organisationsinformation och formulärdata laddas in.

## Steg 1: Importera nödvändiga komponenter

Lägg till följande imports i toppen av formulärfilen:

```tsx
import { PageLoader } from '@/components/ui/page-loader';
```

## Steg 2: Lägg till laddningstillstånd i formulärkomponenten

Lägg till följande state-variabler i formulärkomponenten:

```tsx
const [isPageLoading, setIsPageLoading] = useState(true);
const [isDataLoading, setIsDataLoading] = useState(true);
const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
```

## Steg 3: Uppdatera datainladdningslogiken

Uppdatera den befintliga `loadFromFirebase`-funktionen (eller motsvarande) för att uppdatera laddningstillståndet:

```tsx
const loadFromFirebase = async () => {
  if (currentUser?.uid) {
    try {
      setIsDataLoading(true);
      setError(null);
      const data = await loadFormData<FormData>(currentUser.uid, FORM_TYPE);
      if (data) {
        console.log('Loaded form data:', data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
      setError('Kunde inte ladda data från databasen.');
    } finally {
      setIsDataLoading(false);
    }
  } else {
    console.log('No user logged in, cannot load data from Firebase');
    setIsDataLoading(false);
  }
};
```

## Steg 4: Lägg till en effekt för att kombinera alla laddningstillstånd

Lägg till följande useEffect för att kombinera alla laddningstillstånd:

```tsx
useEffect(() => {
  setIsPageLoading(isDataLoading || isOrgInfoLoading);
}, [isDataLoading, isOrgInfoLoading]);
```

## Steg 5: Uppdatera OrganizationHeader för att hantera laddningsstatus

Uppdatera OrganizationHeader-komponenten för att skicka laddningsstatus tillbaka till föräldrakomponenten:

```tsx
<OrganizationHeader onLoadingChange={setIsOrgInfoLoading} />
```

## Steg 6: Omslut innehållet med PageLoader

Omslut hela formulärinnehållet med PageLoader-komponenten:

```tsx
return (
  <PageLoader isLoading={isPageLoading} loadingText="Laddar formulär...">
    {/* Befintligt formulärinnehåll */}
  </PageLoader>
);
```

## Exempel på fullständig implementation

```tsx
const FormExample = forwardRef<FormExampleRef, FormExampleProps>(function FormExample(props, ref) {
  // Befintliga statevariabler...
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(true);
  
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
    setIsPageLoading(isDataLoading || isOrgInfoLoading);
  }, [isDataLoading, isOrgInfoLoading]);
  
  return (
    <PageLoader isLoading={isPageLoading} loadingText="Laddar formulär...">
      <div className="space-y-6">
        <div className="space-y-4">
          <OrganizationHeader onLoadingChange={setIsOrgInfoLoading} />
          
          {/* Resten av formulärinnehållet */}
        </div>
      </div>
    </PageLoader>
  );
});
```

Genom att följa denna guide kommer formulären att visas med en laddningsindikator tills all data är redo, vilket förhindrar att gränssnittet hoppar när data läses in. 