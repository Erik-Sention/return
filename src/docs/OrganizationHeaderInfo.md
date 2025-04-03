# Organisation och Kontaktperson - Delad Information

Detta dokument beskriver hur organisationsnamn och kontaktperson delas mellan alla formulär i applikationen.

## Översikt

Organisationsnamn och kontaktperson anges i **Formulär D** och visas sedan automatiskt i alla andra formulär (A, B, C, G, H, I, J) genom en gemensam header-komponent.

## Komponentstruktur

### 1. Input i Formulär D

Formulär D innehåller inmatningsfält för organisationsnamn och kontaktperson som användaren fyller i. Dessa värden sparas i databasen tillsammans med övrig data från formuläret.

```tsx
// In FormD.tsx
<div className="form-card bg-primary/5 border border-primary/20">
  <SectionHeader 
    title="Organisationsinformation" 
    icon={<Info className="h-5 w-5 text-primary" />}
  />
  
  <div className="grid gap-6 md:grid-cols-2">
    <div className="space-y-2">
      <label className="text-sm font-medium">Organisationens namn</label>
      <InfoLabel text="Namnet på din organisation (visas i alla formulär)" />
      <Input
        value={formData.organizationName}
        onChange={(e) => handleChange('organizationName', e.target.value)}
        placeholder="Ange organisationens namn"
        className="bg-white dark:bg-slate-800 font-medium"
      />
    </div>
    
    <div className="space-y-2">
      <label className="text-sm font-medium">Kontaktperson</label>
      <InfoLabel text="Namn på kontaktperson (visas i alla formulär)" />
      <Input
        value={formData.contactPerson}
        onChange={(e) => handleChange('contactPerson', e.target.value)}
        placeholder="Ange kontaktperson"
        className="bg-white dark:bg-slate-800 font-medium"
      />
    </div>
  </div>
</div>
```

### 2. Hämtning av data

Funktionen `loadOrganizationInfoFromFormD` i `sharedFields.ts` ansvarar för att hämta organisationsinformation från formulär D:

```tsx
// src/lib/firebase/sharedFields.ts
export const loadOrganizationInfoFromFormD = async (userId: string): Promise<{ organizationName: string, contactPerson: string } | null> => {
  try {
    const dbRef = ref(database);
    const formDPath = `users/${userId}/forms/D`;
    
    const snapshot = await get(child(dbRef, formDPath));
    
    if (snapshot.exists()) {
      const formDData = snapshot.val();
      
      // Extrahera organisationsnamn och kontaktperson från Form D
      const organizationInfo = {
        organizationName: formDData.organizationName || '',
        contactPerson: formDData.contactPerson || ''
      };
      
      // Returnera bara om minst ett av fälten har data
      if (organizationInfo.organizationName || organizationInfo.contactPerson) {
        return organizationInfo;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading organization info from Form D:`, error);
    return null;
  }
};
```

### 3. Header-komponent

`OrganizationHeader`-komponenten används i alla andra formulär för att visa organisationsinformationen:

```tsx
// src/components/ui/organization-header.tsx
export const OrganizationHeader = ({ onLoadingChange }: OrganizationHeaderProps) => {
  const { currentUser } = useAuth();
  const [organizationInfo, setOrganizationInfo] = useState<{
    organizationName: string;
    contactPerson: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      if (currentUser?.uid) {
        try {
          setIsLoading(true);
          if (onLoadingChange) onLoadingChange(true);
          
          const info = await loadOrganizationInfoFromFormD(currentUser.uid);
          if (info) {
            setOrganizationInfo(info);
          }
        } catch (error) {
          console.error('Kunde inte hämta organisationsinformation:', error);
        } finally {
          setIsLoading(false);
          if (onLoadingChange) onLoadingChange(false);
        }
      }
    };
    
    fetchOrganizationInfo();
  }, [currentUser, onLoadingChange]);
  
  // Returnerar en header med organisationsnamn och kontaktperson
  return (
    <div className="bg-primary/5 border border-primary/20 p-3 rounded-md mb-4">
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="mb-2 sm:mb-0">
          <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
          <span className="ml-2 font-semibold">{organizationInfo.organizationName || "Ej angiven"}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">Kontaktperson:</span>
          <span className="ml-2 font-semibold">{organizationInfo.contactPerson || "Ej angiven"}</span>
        </div>
      </div>
    </div>
  );
};
```

### 4. Användning i formulär

I alla andra formulär (A, B, C, G, H, I, J) används `OrganizationHeader`-komponenten:

```tsx
// Exempel från FormC.tsx
return (
  <PageLoader isLoading={isPageLoading} loadingText="Laddar formulär...">
    <div className="space-y-6">
      <div className="space-y-4">
        <OrganizationHeader onLoadingChange={setIsOrgInfoLoading} />
        
        {/* Resten av formuläret */}
      </div>
    </div>
  </PageLoader>
);
```

## Dataflöde

1. Användaren fyller i organisationsnamn och kontaktperson i Formulär D
2. Data sparas i Firebase när formuläret sparas
3. När någon öppnar ett annat formulär (t.ex. Form C):
   - `OrganizationHeader`-komponenten anropas
   - Komponenten hämtar data från Formulär D via `loadOrganizationInfoFromFormD`
   - Informationen visas i en header högst upp i formuläret

## Fördelar

- **Single Source of Truth**: All organisationsinformation definieras på ett ställe
- **Konsekvent användargränssnitt**: Samma information visas på samma sätt i alla formulär
- **Användarvänligt**: Användaren behöver bara fylla i informationen en gång 