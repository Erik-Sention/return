# [INAKTUELL] Formulär E – Beräkning av kostnader för kort sjukfrånvaro (dag 1–14)

> **OBS! Detta formulär är inaktuellt.**
> Funktionaliteten för beräkning av kort sjukfrånvaro har integrerats i Formulär D.
> Se avsnittet "Kort sjukfrånvaro" i dokumentationen för Formulär D för mer information.

--- 

## Tidigare översikt
Detta formulär var tidigare det femte i serien A-J.

## Tidigare fältbeskrivningar
- **E1**: Genomsnittlig månadslön
- **E2**: Kostnad för kort sjukfrånvaro per sjukdag % av månadslön
- **E3**: Kostnad för kort sjukfrånvaro per sjukdag, kr
- **E4**: Antal anställda (motsvarande heltidstjänster/FTE)
- **E5**: Antal schemalagda arbetsdagar per år, per anställd
- **E6**: Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid
- **E7**: Antal sjukdagar totalt (kort sjukfrånvaro)
- **E8**: Totala kostnader, kort sjukfrånvaro, överförs till C8

## Motsvarande fält i Formulär D
- **E1** → **D1**: Genomsnittlig månadslön
- **E2** → **D13**: Kostnad för kort sjukfrånvaro per sjukdag (% av månadslön)
- **E3** → **D14**: Kostnad för kort sjukfrånvaro per sjukdag, kr
- **E4** → **D4**: Antal anställda (FTE)
- **E5** → **D12**: Antal schemalagda arbetsdagar per år, per anställd
- **E6** → **D15**: Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid
- **E7** → **D16**: Antal sjukdagar totalt (kort sjukfrånvaro)
- **E8** → **D17**: Totala kostnader, kort sjukfrånvaro

## Beräkningar

#### **E1. Genomsnittlig månadslön**
Ange den genomsnittliga månadslönen per anställd.

**Exempelvärde i formuläret:** `30 000`

---

#### **E2. Kostnad för kort sjukfrånvaro per sjukdag % av månadslön**
Procentandel av månadslönen som utgör kostnaden per sjukdag.

**Exempelvärde i formuläret:** `10%`

---

#### **E3. Kostnad för kort sjukfrånvaro per sjukdag, kr**
Beräkning:
```plaintext
E1 * E2 = E3
30 000 * 0.10 = 3 000
```

---

#### **E4. Antal anställda (FTE)**
Antal heltidsanställda som beräkningen gäller för.

**Exempelvärde:** `1 500`

---

#### **E5. Antal schemalagda arbetsdagar per år, per anställd**
Standard är ofta `220 dagar`.

---

#### **E6. Sjukfrånvaro, kort (dag 1–14) i % av schemalagd arbetstid**
Procentandel av schemalagd arbetstid som utgörs av kort sjukfrånvaro.

**Exempelvärde:** `2,50%`

---

#### **E7. Antal sjukdagar totalt (kort sjukfrånvaro)**
Beräkning:
```plaintext
E4 * E5 * E6 = E7
1 500 * 220 * 0.025 = 8 250
```

---

#### **E8. Totala kostnader, kort sjukfrånvaro**
Beräkning:
```plaintext
E3 * E7 = E8
3 000 * 8 250 = 24 750 000
```

---

## Kopplingar till andra formulär
- **E8** förs över till C8

## Referensbild
![Form E](../Pics/Form%20E.png)

## Valideringsregler
*Här kommer vi att specificera eventuella valideringsregler för fälten*

## Anteckningar
*Här kan vi lägga till ytterligare information eller speciella instruktioner* 

## Beräkningar

### 📌 Sammanfattning i kod-logik (pseudokod):
```python
E1 = 30000
E2 = 0.10
E3 = E1 * E2              # 3 000 kr per sjukdag
E4 = 1500
E5 = 220
E6 = 0.025
E7 = E4 * E5 * E6         # 8 250 sjukdagar
E8 = E7 * E3              # 24 750 000 kr
```