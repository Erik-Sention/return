# Formulär D – Beräkning av personalkostnader och sjukfrånvaro

## Översikt
Detta formulär är det fjärde i serien A-J. Det hanterar beräkningar av personalkostnader samt både kort och lång sjukfrånvaro.

## Fältbeskrivningar
### Grundläggande information:
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

### Arbetstid och sjukfrånvaro:
- **D12**: Antal schemalagda arbetsdagar per år, per anställd

### Kort sjukfrånvaro:
- **D13**: Kostnad för kort sjukfrånvaro per sjukdag (% av månadslön)
- **D14**: Kostnad för kort sjukfrånvaro per sjukdag, kr
- **D15**: Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid
- **D16**: Antal sjukdagar totalt (kort sjukfrånvaro)
- **D17**: Totala kostnader, kort sjukfrånvaro. Överförs till C11

### Lång sjukfrånvaro:
- **D18**: Kostnad för lång sjukfrånvaro per sjukdag (% av månadslön)
- **D19**: Kostnad för lång sjukfrånvaro per sjukdag, kr
- **D20**: Sjukfrånvaro, lång (dag 15–) i % av schemalagd arbetstid
- **D21**: Antal sjukdagar totalt (lång sjukfrånvaro)
- **D22**: Totala kostnader, lång sjukfrånvaro. Överförs till C14

## Kopplingar till andra formulär
- **D9** förs över till C4
- **D17** förs över till C11
- **D22** förs över till C14

## Referensbild
![Form D](../Pics/Form%20D.png)

## Valideringsregler
*Här kommer vi att specificera eventuella valideringsregler för fälten*

## Anteckningar
Sjukfrånvarofunktionaliteten (både kort och lång) var tidigare uppdelad i separata formulär (E och F), men har nu integrerats i formulär D för att göra det enklare att fylla i alla fält som relaterar till personalkostnader och sjukfrånvaro på ett ställe.

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

---

#### **D12. Antal schemalagda arbetsdagar per år, per anställd**
Standard är ofta `220 dagar`.

---

#### **D13. Kostnad för kort sjukfrånvaro per sjukdag (% av månadslön)**
Standardvärde är 10% för de flesta branscher. Detta varierar mellan branscher: Vård & Omsorg (12-15% pga ersättningskostnader), IT (8-10%), Finans (8-10%), Handel (10-12%).

---

#### **D14. Kostnad för kort sjukfrånvaro per sjukdag**
Beräkning:
```plaintext
D1 * D13
30 000 * 0.10 = 3 000
```

---

#### **D15. Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid**
Standardvärde är 2.5% för de flesta branscher. Detta varierar mellan branscher: Vård & Omsorg (3-4% pga högre risk för smitta), IT (2-2.5%), Finans (2-2.5%), Handel (2.5-3% pga kundkontakt).

---

#### **D16. Antal sjukdagar totalt (kort sjukfrånvaro)**
Beräkning:
```plaintext
D4 * D12 * D15
1 500 * 220 * 0.025 = 8 250
```

---

#### **D17. Totala kostnader, kort sjukfrånvaro**
Beräkning:
```plaintext
D14 * D16
3 000 * 8 250 = 24 750 000
```

---

#### **D18. Kostnad för lång sjukfrånvaro per sjukdag (% av månadslön)**
Procentandel av månadslönen som utgör kostnaden per sjukdag. Standardvärde är ofta 1%.

---

#### **D19. Kostnad för lång sjukfrånvaro per sjukdag**
Beräkning:
```plaintext
D1 * D18
30 000 * 0.01 = 300
```

---

#### **D20. Sjukfrånvaro, lång (dag 15–) i % av schemalagd arbetstid**
Ange den procentandel av den schemalagda arbetstiden som utgörs av lång sjukfrånvaro (dag 15 och framåt).

**Exempelvärde:** `2,00%`

---

#### **D21. Antal sjukdagar totalt (lång sjukfrånvaro)**
Beräkning:
```plaintext
D4 * D12 * D20
1 500 * 220 * 0.02 = 6 600
```

---

#### **D22. Totala kostnader, lång sjukfrånvaro**
Beräkning:
```plaintext
D19 * D21
300 * 6 600 = 1 980 000
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
    D12 = 220  # Antal schemalagda arbetsdagar per år, per anställd
    D13 = 0.10  # Kostnad för kort sjukfrånvaro per sjukdag (% av månadslön)
    D14 = D1 * D13  # Kostnad för kort sjukfrånvaro per sjukdag
    D15 = 0.025  # Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid
    D16 = D4 * D12 * D15  # Antal sjukdagar totalt (kort sjukfrånvaro)
    D17 = D14 * D16  # Totala kostnader, kort sjukfrånvaro
    D18 = 0.01  # Kostnad för lång sjukfrånvaro per sjukdag (% av månadslön)
    D19 = D1 * D18  # Kostnad för lång sjukfrånvaro per sjukdag
    D20 = 0.02  # Sjukfrånvaro, lång (dag 15–) i % av schemalagd arbetstid
    D21 = D4 * D12 * D20  # Antal sjukdagar totalt (lång sjukfrånvaro)
    D22 = D19 * D21  # Totala kostnader, lång sjukfrånvaro