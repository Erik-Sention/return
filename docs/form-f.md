# Formulär F – Beräkning av kostnader för lång sjukfrånvaro (dag 15–)

## Översikt
Detta formulär är det sjätte i serien A-J.

## Fältbeskrivningar
- **F1**: Genomsnittlig månadslön
- **F2**: Kostnad för lång sjukfrånvaro per sjukdag i % av månadslön
- **F3**: Kostnad för lång sjukfrånvaro per sjukdag, kr
- **F4**: Antal anställda (motsvarande heltidstjänster/FTE)
- **F5**: Antal schemalagda arbetsdagar per år, per anställd
- **F6**: Sjukfrånvaro, lång (dag 15–) i % av schemalagd arbetstid
- **F7**: Antal sjukdagar totalt (lång sjukfrånvaro)
- **F8**: Totala kostnader, lång sjukfrånvaro, överförs till C11

## Beräkningar

#### **F1. Genomsnittlig månadslön**
Ange den genomsnittliga månadslönen per anställd.

**Exempelvärde i formuläret:** `30 000`

---

#### **F2. Kostnad för lång sjukfrånvaro per sjukdag i % av månadslön**
Procentandel av månadslönen som utgör kostnaden per sjukdag.

**Exempelvärde i formuläret:** `1%`

---

#### **F3. Kostnad för lång sjukfrånvaro per sjukdag, kr**
Beräkning:
```plaintext
F1 * F2 = F3
30 000 * 0.01 = 300
```

---

#### **F4. Antal anställda (FTE)**
Antal heltidsanställda som beräkningen gäller för.

**Exempelvärde:** `1 500`

---

#### **F5. Antal schemalagda arbetsdagar per år, per anställd**
Standard är ofta `220 dagar`.

---

#### **F6. Sjukfrånvaro, lång (dag 15–) i % av schemalagd arbetstid**
Procentandel av schemalagd arbetstid som utgörs av lång sjukfrånvaro.

**Exempelvärde:** `2,00%`

---

#### **F7. Antal sjukdagar totalt (lång sjukfrånvaro)**
Beräkning:
```plaintext
F4 * F5 * F6 = F7
1 500 * 220 * 0.02 = 6 600
```

---

#### **F8. Totala kostnader, lång sjukfrånvaro**
Beräkning:
```plaintext
F3 * F7 = F8
300 * 6 600 = 1 980 000
```

---

### 📌 Sammanfattning i kod-logik (pseudokod):
```python
F1 = 30000
F2 = 0.01
F3 = F1 * F2              # 300 kr per sjukdag
F4 = 1500
F5 = 220
F6 = 0.02
F7 = F4 * F5 * F6         # 6 600 sjukdagar
F8 = F7 * F3              # 1 980 000 kr
```

## Kopplingar till andra formulär
- **F8** förs över till C11

## Referensbild
![Form F](../Pics/Form%20F.png)

## Valideringsregler
*Här kommer vi att specificera eventuella valideringsregler för fälten*

## Anteckningar
*Här kan vi lägga till ytterligare information eller speciella instruktioner* 