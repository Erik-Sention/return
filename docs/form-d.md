# Formulär D – Beräkning av personalkostnader

## Översikt
Detta formulär är det fjärde i serien A-J.

## Fältbeskrivningar
- **D1**: Genomsnittlig månadslön
- **D2**: Sociala avgifter inkl arbetsgivaravgift, tjänstepension och försäkringar (%)
- **D3**: Genomsnittliga sociala avgifter per månad
- **D4**: Antal anställda (motsvarande heltidstjänster/FTE)
- **D5**: Antal månader som beräkningen avser
- **D6**: Totala lönekostnader, kr
- **D7**: Personalkringkostnader i % av lönekostnader
- **D8**: Totala personalkringkostnader, kr
- **D9**: Totala personalkostnader, kr. Överförs till C4
- **D10**: Schemalagd arbetstid (timmar) per år
- **D11**: Personalkostnad kr: per arbetad timme

## Kopplingar till andra formulär
- **D9** förs över till C4

## Referensbild
![Form D](../Pics/Form%20D.png)

## Valideringsregler
*Här kommer vi att specificera eventuella valideringsregler för fälten*

## Anteckningar
*Här kan vi lägga till ytterligare information eller speciella instruktioner*

## Beräkningar

#### **D1. Genomsnittlig månadslön**
Ange den genomsnittliga månadslönen per anställd.

**Exempelvärde i formuläret:** `30 000`

---

#### **D2. Sociala avgifter (%)**
Den procentandel som sociala avgifter (t.ex. arbetsgivaravgift, pension, försäkringar) utgör av lönen.

**Exempelvärde i formuläret:** `42%`

---

#### **D3. Genomsnittliga sociala avgifter per månad**
Beräkning:
```plaintext
D1 * D2 = D3
30 000 * 0.42 = 12 600
```

---

#### **D4. Antal anställda (FTE)**
Antal heltidsanställda som beräkningen gäller för.

**Exempelvärde:** `1 500`

---

#### **D5. Antal månader som beräkningen avser**
Vanligtvis `12` månader (ett år).

---

#### **D6. Totala lönekostnader (kr)**
Beräkning:
```plaintext
(D1 + D3) * D4 * D5
(30 000 + 12 600) * 1 500 * 12 = 766 800 000
```

---

#### **D7. Personalkringkostnader i % av lönekostnader**
Övriga kostnader relaterade till personal (utbildning, utrustning, etc.).

**Exempelvärde:** `30%`

---

#### **D8. Totala personalkringkostnader**
Beräkning:
```plaintext
D6 * D7
766 800 000 * 0.30 = 230 040 000
```

---

#### **D9. Totala personalkostnader**
Beräkning:
```plaintext
D6 + D8
766 800 000 + 230 040 000 = 996 840 000
```

---

#### **D10. Schemalagd arbetstid (timmar per år)**
Antal arbetstimmar per heltidsanställd per år. Standard i Sverige är ofta `1 760 timmar`.

---

#### **D11. Personalkostnad per arbetad timme**
Beräkning:
```plaintext
D9 / D4 / D10
996 840 000 / 1 500 / 1 760 = 378 kr
``` 

    D1 = 30000  # Genomsnittlig månadslön
    D2 = 0.42   # Sociala avgifter (%)
    D3 = D1 * D2  # Genomsnittliga sociala avgifter per månad
    D4 = 1500  # Antal anställda (FTE)
    D5 = 12    # Antal månader
    D6 = (D1 + D3) * D4 * D5  # Totala lönekostnader
    D7 = 0.30  # Personalkringkostnader i % av lönekostnader
    D8 = D6 * D7  # Totala personalkringkostnader
    D9 = D6 + D8  # Totala personalkostnader
    D10 = 1760  # Schemalagd arbetstid (timmar per år)
    D11 = D9 / D4 / D10  # Personalkostnad per arbetad timme