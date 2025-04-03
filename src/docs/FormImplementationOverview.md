# Formulärimplementation - Översikt

Detta dokument ger en övergripande beskrivning av formulärimplementationen i ROI-kalkylatorn, med fokus på hur organisationsinformation delas mellan formulär och hur innehåll tonas in för att ge en bättre användarupplevelse.

## Arkitektur

Applikationen innehåller flera formulär (A-J) där varje formulär hanterar specifik information:

- **Formulär A**: Nulägesbeskrivning och bakgrundsanalys
- **Formulär B**: Planering av insatser
- **Formulär C**: Beräkning av psykosocial ohälsa
- **Formulär D**: Beräkning av personalkostnader (och organisationsinformation)
- **Formulär G**: Externa kostnader för insatser
- **Formulär H**: Mått och mätmetoder
- **Formulär I**: Interna kostnader för arbetstid
- **Formulär J**: ROI-beräkning

## Delad information

För att skapa en sammanhängande användarupplevelse delas viss information mellan formulären:

1. **Organisationsinformation**: Definieras i Formulär D och visas i alla andra formulär.
2. **Beräknade värden**: Vissa beräknade värden överförs mellan formulär för att användas i andra beräkningar.

### Flöde för organisationsinformation

1. Användaren anger organisationsnamn och kontaktperson i Formulär D
2. Dessa värden sparas i Firebase Realtime Database
3. Övriga formulär hämtar denna information via `loadOrganizationInfoFromFormD()`
4. Information visas i toppen av varje formulär

## Mjuk infadning av innehåll

För att ge en mjuk och sömlös användarupplevelse utan att UI "hoppar" när innehåll laddas in:

1. En `FadeIn`-komponent gör att innehåll tonas in när data är redo
2. Laddningsstatus från olika källor kombineras (API-anrop, organisationsdata)
3. Innehållet visas med en mjuk övergång när all data är redo

### Laddningssekvens i detalj

1. När en användare öppnar ett formulär börjar två parallella processer:
   - Formulärdata hämtas från Firebase (`loadFormData()`)
   - Organisationsinformation hämtas från Formulär D (`loadOrganizationInfoFromFormD()`)
   
2. Båda processer uppdaterar egna laddningsflaggor (`isDataLoading`, `isOrgInfoLoading`)

3. När all data är redo, aktiveras `isContentReady` flaggan

4. `FadeIn`-komponenten tonar in innehållet baserat på `isContentReady`

## Komponenter för UI-konsistens

Flera återanvändbara komponenter säkerställer enhetlig presentation:

- `OrganizationHeader`: Hämtar organisationens namn och kontaktperson
- `FadeIn`: Skapar en mjuk övergång när innehåll visas
- `SectionHeader`: Enhetlig stilisering av sektionsrubriker

## Implementationsguider

För detaljerade implementationsanvisningar, se:

- [Organisation och Kontaktperson - Delad Information](./OrganizationHeaderInfo.md)
- [Guide: Implementera FadeIn i formulär](./FadeInImplementation.md)

## Överväganden för framtiden

- **Caching**: Möjlighet att cacha delad information för att minska antalet databassökningar
- **Optimistisk rendering**: Visa UI direkt baserat på tidigare laddad data medan uppdateringar sker i bakgrunden
- **Formulärstatus**: Indikera när ett formulär är komplett/ofullständigt i navigationsmenyn
- **Transitions API**: När webbläsarstödet förbättras, överväg att använda View Transitions API för ännu smidigare övergångar 