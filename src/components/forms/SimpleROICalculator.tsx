import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateSimpleROIPDF } from '@/utils/pdfGenerator';
import { PDFPreviewDialog } from '@/components/ui/pdf-preview-dialog';
import { Input } from '@/components/ui/input';

interface SimpleROIData {
  num_employees: number | undefined;
  avg_monthly_salary: number | undefined;
  social_fees: number | undefined;
  personnel_costs: number | undefined;
  stress_level: number | undefined;
  production_loss: number | undefined;
  workdays_per_year: number | undefined;
  short_term_absence: number | undefined;
  long_term_absence: number | undefined;
  intervention_cost: number | undefined;
  expected_reduction: number | undefined;
}

interface SimpleROIResults {
  annual_salary_cost: number;
  social_fees_cost: number;
  personnel_overhead: number;
  total_personnel_cost: number;
  short_term_days: number;
  long_term_days: number;
  short_term_mental_health_cost: number;
  long_term_mental_health_cost: number;
  total_mental_health_cost: number;
  total_production_loss: number;
  total_sick_leave_cost: number;
  intervention_cost: number;
  economic_benefit: number;
  economic_surplus: number;
  roi_percentage: number;
  break_even_effect: number;
}

// Definiera en typ för vad som ska exponeras via ref
export interface SimpleROICalculatorRef {
  handleSave: () => Promise<void>;
}

// InfoLabel-komponent för att ge användaren information
const InfoLabel = ({ text }: { text: string }) => (
  <div className="relative group">
    <div className="mt-1 text-blue-600 dark:text-blue-400 inline-flex items-center">
      <Info className="w-4 h-4 cursor-help" />
    </div>
    <div className="absolute left-6 top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-80 p-2 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded-md border border-blue-100 dark:border-blue-900 shadow-lg">
      <div className="text-sm">{text}</div>
      <div className="absolute top-[6px] left-[-6px] transform rotate-45 w-3 h-3 bg-blue-50 dark:bg-blue-950 border-l border-t border-blue-100 dark:border-blue-900"></div>
    </div>
  </div>
);

// SectionHeader för tydligare struktur
const SectionHeader = ({ 
  title, 
  icon 
}: { 
  title: string; 
  icon: React.ReactNode 
}) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="bg-primary/10 p-2 rounded-full">
      {icon}
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
  </div>
);

// Definiera en typ för komponentens props
type SimpleROICalculatorProps = React.ComponentProps<'div'>;

// Formattera nummer med vald valuta
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(value);
};

// Formattera procent
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Formattera heltal
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('sv-SE').format(value);
};

const SimpleROICalculator = forwardRef<SimpleROICalculatorRef, SimpleROICalculatorProps>(function SimpleROICalculator(props, ref) {
  const { } = useAuth();
  const [formData, setFormData] = useState<SimpleROIData>({
    // Förfyllda standardvärden som matchar FormD
    num_employees: undefined,
    avg_monthly_salary: undefined,
    social_fees: 42, // 42% standardvärde för sociala avgifter
    personnel_costs: 30, // 30% standardvärde för personalkringkostnader
    stress_level: undefined,
    production_loss: 9, // 9% standardvärde för produktionsbortfall enligt Myndigheten för arbetsmiljökunskap
    workdays_per_year: 220, // 220 dagar standard
    short_term_absence: 2.5, // 2.5% standardvärde för kort sjukfrånvaro
    long_term_absence: 3, // 3% standardvärde för lång sjukfrånvaro
    intervention_cost: undefined,
    expected_reduction: undefined
  });
  
  const [calculationDone, setCalculationDone] = useState(false);
  const [results, setResults] = useState<SimpleROIResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('Företag AB');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Vi behöver inte längre sparfunktionalitet, men behåller ref för framtida behov
  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      console.log('Sparfunktionalitet är avaktiverad i förenklade ROI-kalkylatorn');
      return Promise.resolve();
    }
  }));

  const handleChange = (field: keyof SimpleROIData, value: number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Återställ beräkningen när indata ändras
    setCalculationDone(false);
  };

  const calculateROI = () => {
    // Kontrollera att alla värden finns
    if (Object.values(formData).some(val => val === undefined)) {
      setError('Alla fält måste fyllas i för att kunna beräkna ROI');
      return;
    }

    try {
      // Definiera saknade värden med standardvärden ifall något skulle vara undefined
      // Det borde inte hända efter vår kontroll, men TypeScript behöver det
      const num_employees = formData.num_employees ?? 0;
      const avg_monthly_salary = formData.avg_monthly_salary ?? 0;
      const social_fees = formData.social_fees ?? 0;
      const personnel_costs = formData.personnel_costs ?? 0;
      const stress_level = formData.stress_level ?? 0;
      const production_loss = formData.production_loss ?? 0;
      const workdays_per_year = formData.workdays_per_year ?? 0;
      const short_term_absence = formData.short_term_absence ?? 0;
      const long_term_absence = formData.long_term_absence ?? 0;
      const intervention_cost = formData.intervention_cost ?? 0;
      const expected_reduction = formData.expected_reduction ?? 0;

      // Beräkna total personalkostnad
      const annual_salary_cost = num_employees * avg_monthly_salary * 12;
      const social_fees_cost = annual_salary_cost * social_fees / 100;
      const personnel_overhead = (annual_salary_cost + social_fees_cost) * personnel_costs / 100;
      const total_personnel_cost = annual_salary_cost + social_fees_cost + personnel_overhead;

      // Beräkna produktionsbortfall
      const total_production_loss = total_personnel_cost * stress_level / 100 * production_loss / 100;

      // Beräkna sjukdagar
      const total_workdays = num_employees * workdays_per_year;
      const short_term_days = total_workdays * short_term_absence / 100;
      const long_term_days = total_workdays * long_term_absence / 100;

      // Beräkna kostnader för sjukfrånvaro
      const short_term_cost = short_term_days * (avg_monthly_salary * 0.10);  // 10% av månadslön per dag
      const long_term_cost = long_term_days * (avg_monthly_salary * 0.01);    // 1% av månadslön per dag

      // Andel som beror på psykisk ohälsa
      const short_term_mental_health_cost = short_term_cost * 0.06;  // 6%
      const long_term_mental_health_cost = long_term_cost * 0.40;    // 40%

      const total_sick_leave_cost = short_term_mental_health_cost + long_term_mental_health_cost;

      // Total kostnad för psykisk ohälsa
      const total_mental_health_cost = total_production_loss + total_sick_leave_cost;

      // Beräkna ROI - reducering av andelen med hög stressnivå
      // Beräkna den nya stressnivån efter interventionen
      const reduced_stress_level = stress_level * (1 - expected_reduction / 100);
      // Beräkna nytt produktionsbortfall med den reducerade stressnivån
      const reduced_production_loss = total_personnel_cost * reduced_stress_level / 100 * production_loss / 100;
      // Kostnadsminskning för produktionsbortfall
      const production_loss_benefit = total_production_loss - reduced_production_loss;
      
      // Anta att sjukfrånvaron också påverkas proportionellt med stressminskningen
      const sick_leave_benefit = total_sick_leave_cost * expected_reduction / 100;
      
      // Total ekonomisk nytta
      const economic_benefit = production_loss_benefit + sick_leave_benefit;
      const economic_surplus = economic_benefit - intervention_cost;
      const roi_percentage = (economic_surplus / intervention_cost) * 100;
      const break_even_effect = (intervention_cost / total_mental_health_cost) * 100;

      // Sätt resultatet
      setResults({
        annual_salary_cost,
        social_fees_cost,
        personnel_overhead,
        total_personnel_cost,
        short_term_days,
        long_term_days,
        short_term_mental_health_cost,
        long_term_mental_health_cost,
        total_mental_health_cost,
        total_production_loss,
        total_sick_leave_cost,
        intervention_cost,
        economic_benefit,
        economic_surplus,
        roi_percentage,
        break_even_effect
      });

      setCalculationDone(true);
      setError(null);
    } catch (error) {
      console.error('Error calculating ROI:', error);
      setError('Ett fel uppstod vid beräkning av ROI');
    }
  };

  const handleExportPDF = () => {
    if (!results) return;
    
    generateSimpleROIPDF(formData, results, companyName);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vänster kolumn - Formulär */}
          <div className="form-card p-6 space-y-6">
            <SectionHeader 
              title="Företagsinformation" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Företagsnamn
                <InfoLabel text="Ange namnet på företaget eller organisationen för rapporten." />
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ange företagsnamn"
              />
            </div>
            
            <SectionHeader 
              title="Personaldata" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Antal anställda
                  <InfoLabel text="Totalt antal anställda i organisationen. Ett svenskt medelstort företag har 50-250 anställda. Små företag har vanligtvis under 50 anställda och stora över 250." />
                </label>
                <FormattedNumberInput
                  value={formData.num_employees}
                  onChange={(value) => handleChange('num_employees', value)}
                  placeholder="Ange antal anställda"
                  allowDecimals={false}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Genomsnittlig månadslön (SEK)
                  <InfoLabel text="Genomsnittlig månadslön före skatt. Enligt SCB är medellönen i Sverige ca 38 000 kr, med variation mellan branscher: IT/Telekom (49 000 kr), Hälso/sjukvård (35 000 kr), Industri (37 000 kr), Handel (32 000 kr), Utbildning (36 000 kr)" />
                </label>
                <FormattedNumberInput
                  value={formData.avg_monthly_salary}
                  onChange={(value) => handleChange('avg_monthly_salary', value)}
                  placeholder="Ange genomsnittlig månadslön"
                  allowDecimals={false}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Sociala avgifter (%)
                  <InfoLabel text="Arbetsgivaravgifter, pensionsavsättningar, etc. Den lagstadgade arbetsgivaravgiften är 31,42% men den totala kostnaden med kollektivavtalade försäkringar och pensioner är ofta 40-45% beroende på bransch." />
                </label>
                <FormattedNumberInput
                  value={formData.social_fees}
                  onChange={(value) => handleChange('social_fees', value)}
                  placeholder="Ange sociala avgifter i procent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Personalkostnader (%)
                  <InfoLabel text="Övriga personalkostnader som lokaler, utrustning, etc. Dessa utgör oftast 15-25% av lönekostnaderna. Kontorsarbete tenderar ligga i det högre spannet, medan tillverkningsindustri ofta har lägre overheadkostnader per anställd." />
                </label>
                <FormattedNumberInput
                  value={formData.personnel_costs}
                  onChange={(value) => handleChange('personnel_costs', value)}
                  placeholder="Ange personalkostnader i procent"
                />
              </div>
            </div>
            
            <SectionHeader 
              title="Stressfaktorer" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                Andel av personalen med hög stressnivå (%)
                  <InfoLabel text="Uppskattad förekomst av stress på arbetsplatsen. Arbetsmiljöverket rapporterar 10-20% av arbetstagare höga stressnivåer. Inom sjukvård, socialtjänst och utbildning är siffrorna ofta 20-25%, medan tillverkningsindustri och IT oftast har 8-15%." />
                </label>
                <FormattedNumberInput
                  value={formData.stress_level}
                  onChange={(value) => handleChange('stress_level', value)}
                  placeholder="Ange stressnivå i procent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                Produktionsbortfall vid hög stressnivå (%)
                  <InfoLabel text="Enligt Myndigheten för arbetsmiljökunskap innebär stressrelaterad psykisk ohälsa i snitt ett produktionsbortfall på minst 9%. Detta är en låg uppskattning, vilket innebär att den faktiska kostnaden sannolikt är högre." />
                </label>
                <FormattedNumberInput
                  value={formData.production_loss}
                  onChange={(value) => handleChange('production_loss', value)}
                  placeholder="Ange produktionsbortfall i procent"
                />
              </div>
            </div>
            
            <SectionHeader 
              title="Sjukfrånvaro" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Arbetsdagar per år
                  <InfoLabel text="Genomsnittligt antal arbetsdagar per år. I Sverige är det vanligtvis 225-230 arbetsdagar per år efter avdrag för helgdagar, semesterdagar och röda dagar. Många tjänstemän har 5-6 veckors semester vilket kan sänka antalet till 220-225 dagar." />
                </label>
                <FormattedNumberInput
                  value={formData.workdays_per_year}
                  onChange={(value) => handleChange('workdays_per_year', value)}
                  placeholder="Ange antal arbetsdagar per år"
                  allowDecimals={false}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Kort sjukfrånvaro (%)
                  <InfoLabel text="Korttidsfrånvaro som procent av totala arbetsdagar. Genomsnittet i Sverige är 2-4% av arbetsdagarna. Inom sjukvård och utbildning kan siffran vara 4-5%, medan tjänsteföretag ofta har lägre korttidsfrånvaro på 1,5-3%." />
                </label>
                <FormattedNumberInput
                  value={formData.short_term_absence}
                  onChange={(value) => handleChange('short_term_absence', value)}
                  placeholder="Ange kort sjukfrånvaro i procent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Lång sjukfrånvaro (%)
                  <InfoLabel text="Långtidsfrånvaro som procent av totala arbetsdagar. Långtidssjukskrivning varierar stort mellan branscher, från 1-2% inom IT och konsultsektorn till 3-5% inom vård, omsorg och fysiskt krävande yrken." />
                </label>
                <FormattedNumberInput
                  value={formData.long_term_absence}
                  onChange={(value) => handleChange('long_term_absence', value)}
                  placeholder="Ange lång sjukfrånvaro i procent"
                />
              </div>
            </div>
            
            <SectionHeader 
              title="Interventioner" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Kostnad för insats (SEK)
                  <InfoLabel text="Total kostnad för den planerade insatsen. Typiska kostnader varierar beroende på insatstyp: stresshanteringskurser (100 000 - 300 000 kr), arbetsmiljöförbättringar (250 000 - 500 000 kr), ledarskapsutbildningar (200 000 - 400 000 kr), organisationsutveckling (300 000 - 1 000 000 kr)." />
                </label>
                <FormattedNumberInput
                  value={formData.intervention_cost}
                  onChange={(value) => handleChange('intervention_cost', value)}
                  placeholder="Ange kostnad för insatsen"
                  allowDecimals={false}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Förväntad minskning av hög stressnivå (%)
                  <InfoLabel text="Förväntad minskning av andelen personal med hög stressnivå. Studier visar att välplanerade insatser kan minska andelen personer med hög stress med 10-20%. Förebyggande insatser ger ofta 5-15%, medan mer omfattande program kan ge 15-30% vid korrekt implementering." />
                </label>
                <FormattedNumberInput
                  value={formData.expected_reduction}
                  onChange={(value) => handleChange('expected_reduction', value)}
                  placeholder="Ange förväntad reduktion i procent"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={calculateROI} 
                className="gap-2"
              >
                Beräkna ROI
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Höger kolumn - Resultat */}
          <div 
            ref={resultsRef}
            className={`form-card p-6 space-y-6 ${!calculationDone ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <SectionHeader 
              title="Resultat av ROI-beräkning" 
              icon={<Calculator className="h-5 w-5 text-primary" />}
            />
            
            {!results ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <Calculator className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-center text-muted-foreground">Fyll i formuläret och klicka på &quot;Beräkna ROI&quot; för att se resultatet</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">ROI för insatsen (Överskrott)</h4>
                    <div className="flex justify-between items-center">
                      <span className={`text-3xl font-bold ${
                        results.roi_percentage >= 100 ? 'text-green-600 dark:text-green-400' : 
                        results.roi_percentage >= 0 ? 'text-primary' : 
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {formatPercent(results.roi_percentage)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Avkastning på investering
                      </span>
                    </div>
                    <div className="mt-2 text-xs">
                      {results.roi_percentage >= 100 && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Utmärkt avkastning! Investeringen ger mycket god ekonomisk nytta.
                        </span>
                      )}
                      {results.roi_percentage >= 0 && results.roi_percentage < 100 && (
                        <span className="text-primary font-medium">
                          Positiv avkastning. Investeringen är lönsam.
                        </span>
                      )}
                      {results.roi_percentage < 0 && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Negativ avkastning. Investeringen är inte ekonomiskt lönsam på kort sikt.
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <h4 className="font-semibold mb-1 text-sm">Ekonomisk vinst</h4>
                    <span className={`text-xl font-bold ${
                      results.economic_surplus > 0 ? 'text-green-600 dark:text-green-400' : 
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(results.economic_surplus)}
                    </span>
                  </div>
                  
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <h4 className="font-semibold mb-1 text-sm">För att nå break-even</h4>
                    <span className="text-xl font-bold">
                      {formatPercent(results.break_even_effect)}
                    </span>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Effektivitet som krävs för att gå jämnt upp
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <SectionHeader 
                    title="Detaljerade kostnader" 
                    icon={<Calculator className="h-5 w-5 text-primary" />}
                  />
                  
                  <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm">Total personalkostnad</span>
                      <span className="font-medium">{formatCurrency(results.total_personnel_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total kostnad för psykisk ohälsa</span>
                      <span className="font-medium">{formatCurrency(results.total_mental_health_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Produktionsbortfall</span>
                      <span className="font-medium">{formatCurrency(results.total_production_loss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Kostnad för sjukfrånvaro</span>
                      <span className="font-medium">{formatCurrency(results.total_sick_leave_cost)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Sjukdagar (kort)</span>
                      <span className="font-medium">{formatNumber(results.short_term_days)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sjukdagar (lång)</span>
                      <span className="font-medium">{formatNumber(results.long_term_days)}</span>
                    </div>
                  </div>
                  
                  <SectionHeader 
                    title="Ekonomisk effekt av insatsen" 
                    icon={<Calculator className="h-5 w-5 text-primary" />}
                  />
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Kostnad för insats</span>
                      <span className="font-medium">{formatCurrency(results.intervention_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ekonomisk nytta</span>
                      <span className="font-medium">{formatCurrency(results.economic_benefit)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Ekonomiskt överskott</span>
                      <span className={
                        results.economic_surplus > 0 ? 'text-green-600 dark:text-green-400' : 
                        'text-red-600 dark:text-red-400'
                      }>{formatCurrency(results.economic_surplus)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded-md text-sm mt-4">
                    <p className="font-medium mb-1">Tolkning av resultaten:</p>
                    <p>ROI visar avkastningen på din investering i procent. Ett positivt värde innebär ekonomisk vinst, medan ett negativt värde betyder att kostnaden överstiger den ekonomiska nyttan på kort sikt.</p>
                    <p className="mt-2">Den ekonomiska nyttan beräknas genom den förväntade minskningen av andelen personal med hög stressnivå, vilket i sin tur minskar både produktionsbortfall och sjukfrånvaro.</p>
                    <p className="mt-2">Tänk på att många hälsofrämjande insatser har långsiktiga effekter som inte fångas i denna beräkning, som förbättrad arbetsmiljö, ökad trivsel och starkare arbetsgivarvarumärke.</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <PDFPreviewDialog
                    title={`ROI-kalkyl för ${companyName}`}
                    exportFunction={handleExportPDF}
                    exportLabel="Exportera som PDF"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SimpleROICalculator; 