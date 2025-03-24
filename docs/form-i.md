# Formulär I - Interna kostnader för insats

## Översikt
Detta formulär är det nionde i serien A-J och används för att beräkna interna kostnader relaterade till insatser, uppdelat i tre huvudkategorier: personal, chefer och administration.

## Steg för Steg Process
1. **Organisationsuppgifter (I1-I3)**
   - Fyll i organisationens namn
   - Ange kontaktperson
   - Specificera delinsats

2. **Beräkning av arbetsvärde för närvarande personal (I4-I10)**
   - Ange tidsåtgång i minuter
   - Konvertera till timmar
   - Ange antal anställda medverkande
   - Beräkna total tidsåtgång
   - Ange genomsnittlig personalkostnad
   - Beräkna summa insats

3. **Beräkning av arbetsvärde för chefer (I11-I17)**
   - Upprepa samma process för chefer
   - Använd chefspecifik timkostnad

4. **Beräkning av arbetsvärde för administration (I18-I24)**
   - Upprepa samma process för administration
   - Använd administrationsspecifik timkostnad

5. **Total summering (I25-I26)**
   - Summera total tidsåtgång
   - Beräkna total arbetskostnad

## Kopplingar till andra formulär
- **I1 – Organisationens namn**: Kopplad till formulär A för organisationsdetaljer
- **I2 – Kontaktperson**: Kopplad till formulär B för kontaktinformation
- **I3 – Delinsats**: Kopplad till formulär C för insatsdetaljer

## Fältbeskrivningar
- **I1 – Organisationens namn**: *Exempel: Demo Alltjänst AB*
- **I2 – Kontaktperson**: *Exempel: Anna Andersson*
- **I3 – Delinsats**: *Exempel: Screening, utförande*

### Personal
- **I4 – Tidsåtgång insats i minuter**: *Exempel: 15*
- **I5 – Divisor för konvertering**: *Fast värde: 60*
- **I6 – Tidsåtgång i timmar**: *Exempel: 0,25*
- **I7 – Antal anställda medverkande**: *Exempel: 1 500*
- **I8 – Total tidsåtgång i timmar**: *Exempel: 375*
- **I9 – Genomsnittlig personalkostnad**: *Exempel: 378 kr/timme*
- **I10 – Summa insats, värde av arbete**: *Exempel: 141 597 kr*

### Chefer
- **I11 – Tidsåtgång insats i minuter**: *Exempel: 120*
- **I12 – Divisor för konvertering**: *Fast värde: 60*
- **I13 – Tidsåtgång i timmar**: *Exempel: 2,00*
- **I14 – Antal anställda medverkande**: *Exempel: 75*
- **I15 – Total tidsåtgång i timmar**: *Exempel: 150,00*
- **I16 – Genomsnittlig personalkostnad chefer**: *Exempel: 378 kr/timme*
- **I17 – Summa insats, värde av arbete**: *Exempel: 56 700 kr*

### Administration
- **I18 – Tidsåtgång insats i minuter**: *Exempel: 2 400*
- **I19 – Divisor för konvertering**: *Fast värde: 60*
- **I20 – Tidsåtgång i timmar**: *Exempel: 40,00*
- **I21 – Antal anställda medverkande**: *Exempel: 2*
- **I22 – Total tidsåtgång i timmar**: *Exempel: 80,00*
- **I23 – Genomsnittlig personalkostnad**: *Exempel: 453 kr/timme*
- **I24 – Summa insats, värde av arbete**: *Exempel: 36 249 kr*

### Totaler
- **I25 – Total tidsåtgång insats**: *Exempel: 605 timmar*
- **I26 – Total arbetskostnad insats**: *Exempel: 234 545 kr*

## Beräkningar
### Personal
- **Tidsåtgång i timmar (I6)** = I4 ÷ I5
- **Total tidsåtgång (I8)** = I6 × I7
- **Summa insats (I10)** = I8 × I9

### Chefer
- **Tidsåtgång i timmar (I13)** = I11 ÷ I12
- **Total tidsåtgång (I15)** = I13 × I14
- **Summa insats (I17)** = I15 × I16

### Administration
- **Tidsåtgång i timmar (I20)** = I18 ÷ I19
- **Total tidsåtgång (I22)** = I20 × I21
- **Summa insats (I24)** = I22 × I23

### Totalsummor
- **Total tidsåtgång (I25)** = I8 + I15 + I22
- **Total arbetskostnad (I26)** = I10 + I17 + I24

## Referensbild
![Form I](../Pics/Form%20I.png)

## Valideringsregler
- Alla tidsfält måste innehålla positiva numeriska värden
- Alla personantal måste vara heltal större än 0
- Timkostnader måste vara positiva tal
- Divisorer (I5, I12, I19) ska alltid vara 60
- Beräknade summor måste stämma överens med formlerna
- Alla obligatoriska fält (I1-I3) måste fyllas i
- Total arbetskostnad måste vara summan av alla delkostnader

## Anteckningar
- Kontrollera att alla kopplingar till andra formulär är korrekta
- Verifiera att alla beräkningar stämmer innan formuläret sparas
- Se till att personalkostnader är uppdaterade och korrekta
- Dokumentera eventuella avvikelser från standardkostnader
- Spara underlag för antal medverkande personer 