import { useState, forwardRef, useImperativeHandle } from 'react';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight, Info, Plus, Trash2, BarChart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Intervention {
  id: string;
  name: string;
  cost: number | undefined;
  expected_reduction: number | undefined;
}

interface ComparativeROIData {
  num_employees: number | undefined;
  avg_monthly_salary: number | undefined;
  social_fees: number | undefined;
  personnel_costs: number | undefined;
  stress_level: number | undefined;
  production_loss: number | undefined;
  workdays_per_year: number | undefined;
  short_term_absence: number | undefined;
  long_term_absence: number | undefined;
  interventions: Intervention[];
}

interface InterventionResult {
  id: string;
  name: string;
  cost: number;
  economic_benefit: number;
  economic_surplus: number;
  roi_percentage: number;
  break_even_effect: number;
}

interface ComparativeROIResults {
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
  intervention_results: InterventionResult[];
}

// Definiera en typ för vad som ska exponeras via ref
export interface ComparativeROICalculatorRef {
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
type ComparativeROICalculatorProps = React.ComponentProps<'div'>;

// Formattera nummer med vald valuta
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(value);
};

// Formattera procent
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Generera unikt ID för interventioner
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Komponent för att jämföra olika interventioner
const ComparativeROICalculator = forwardRef<ComparativeROICalculatorRef, ComparativeROICalculatorProps>(
  function ComparativeROICalculator(props, ref) {
    const { } = useAuth();
    const [formData, setFormData] = useState<ComparativeROIData>({
      // Inga förfyllda värden
      num_employees: undefined,
      avg_monthly_salary: undefined,
      social_fees: undefined,
      personnel_costs: undefined,
      stress_level: undefined,
      production_loss: undefined,
      workdays_per_year: undefined,
      short_term_absence: undefined,
      long_term_absence: undefined,
      interventions: [
        // Börja med en tom intervention
        {
          id: generateId(),
          name: "Insats 1",
          cost: undefined,
          expected_reduction: undefined,
        }
      ]
    });
    
    const [calculationDone, setCalculationDone] = useState(false);
    const [results, setResults] = useState<ComparativeROIResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Behåll ref för framtida behov
    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        console.log('Sparfunktionalitet är avaktiverad i jämförande ROI-kalkylatorn');
        return Promise.resolve();
      }
    }));
    
    // Hantera ändring av basdata
    const handleChange = (field: keyof Omit<ComparativeROIData, 'interventions'>, value: number | undefined) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Återställ beräkningen när indata ändras
      setCalculationDone(false);
    };
    
    // Hantera ändringar i en intervention
    const handleInterventionChange = (id: string, field: keyof Omit<Intervention, 'id'>, value: string | number | undefined) => {
      setFormData(prev => ({
        ...prev,
        interventions: prev.interventions.map(intervention => 
          intervention.id === id ? { ...intervention, [field]: value } : intervention
        )
      }));
      setCalculationDone(false);
    };
    
    // Lägg till en ny intervention
    const addIntervention = () => {
      const newId = generateId();
      setFormData(prev => ({
        ...prev,
        interventions: [
          ...prev.interventions, 
          {
            id: newId,
            name: `Insats ${prev.interventions.length + 1}`,
            cost: undefined,
            expected_reduction: undefined
          }
        ]
      }));
      setCalculationDone(false);
    };
    
    // Ta bort en intervention
    const removeIntervention = (id: string) => {
      setFormData(prev => ({
        ...prev,
        interventions: prev.interventions.filter(intervention => intervention.id !== id)
      }));
      setCalculationDone(false);
    };
    
    // Beräkna ROI för alla interventioner
    const calculateROI = () => {
      // Kontrollera att basdata finns
      const baseDataKeys: Array<keyof Omit<ComparativeROIData, 'interventions'>> = [
        'num_employees', 'avg_monthly_salary', 'social_fees', 'personnel_costs', 
        'stress_level', 'production_loss', 'workdays_per_year', 
        'short_term_absence', 'long_term_absence'
      ];
      
      if (baseDataKeys.some(key => formData[key] === undefined)) {
        setError('Alla basfält måste fyllas i för att kunna beräkna ROI');
        return;
      }
      
      // Kontrollera att interventioner har all data
      if (formData.interventions.length === 0) {
        setError('Du måste ange minst en insats');
        return;
      }
      
      if (formData.interventions.some(intervention => 
        intervention.cost === undefined || intervention.expected_reduction === undefined
      )) {
        setError('Alla insatser måste ha kostnad och förväntad reduktion');
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

        // Beräkna ROI för varje intervention
        const intervention_results: InterventionResult[] = formData.interventions.map(intervention => {
          const cost = intervention.cost ?? 0;
          const expected_reduction = intervention.expected_reduction ?? 0;
          
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
          const economic_surplus = economic_benefit - cost;
          const roi_percentage = (economic_surplus / cost) * 100;
          const break_even_effect = (cost / total_mental_health_cost) * 100;
          
          return {
            id: intervention.id,
            name: intervention.name,
            cost,
            economic_benefit,
            economic_surplus,
            roi_percentage,
            break_even_effect
          };
        });
        
        // Sortera resultatet efter ROI, högst först
        intervention_results.sort((a, b) => b.roi_percentage - a.roi_percentage);

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
          intervention_results
        });

        setCalculationDone(true);
        setError(null);
      } catch (error) {
        console.error('Error calculating ROI:', error);
        setError('Ett fel uppstod vid beräkning av ROI');
      }
    };
    
    return (
      <div className="space-y-8">
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded-md text-sm">
            <p className="font-medium mb-1">Jämförande ROI-kalkylator</p>
            <p>Använd denna kalkylator för att jämföra avkastningen (ROI) för olika insatser mot stress och psykisk ohälsa på arbetsplatsen. Fyll i organisationens basdata och lägg sedan till de insatser du vill jämföra.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vänster kolumn - Formulär */}
            <div className="form-card p-6 space-y-6">
              <SectionHeader 
                title="Organisationens basdata" 
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
                title="Insatser att jämföra" 
                icon={<BarChart className="h-5 w-5 text-primary" />}
              />
              
              <div className="space-y-4">
                {formData.interventions.map((intervention, index) => (
                  <div 
                    key={intervention.id} 
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Insats {index + 1}</h4>
                      {formData.interventions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIntervention(intervention.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Namn på insatsen
                      </label>
                      <input
                        type="text"
                        value={intervention.name}
                        onChange={(e) => handleInterventionChange(intervention.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background"
                        placeholder="t.ex. Stresshanteringskurs"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        Kostnad för insats (SEK)
                        <InfoLabel text="Total kostnad för den planerade insatsen inklusive eventuella interna kostnader. Typiska kostnader varierar beroende på insatstyp: stresshanteringskurser (100 000 - 300 000 kr), arbetsmiljöförbättringar (250 000 - 500 000 kr), ledarskapsutbildningar (200 000 - 400 000 kr), organisationsutveckling (300 000 - 1 000 000 kr)." />
                      </label>
                      <FormattedNumberInput
                        value={intervention.cost}
                        onChange={(value) => handleInterventionChange(intervention.id, 'cost', value)}
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
                        value={intervention.expected_reduction}
                        onChange={(value) => handleInterventionChange(intervention.id, 'expected_reduction', value)}
                        placeholder="Ange förväntad reduktion i procent"
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addIntervention}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Lägg till insats
                </Button>
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
            <div className={`form-card p-6 space-y-6 ${!calculationDone ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader 
                title="Jämförelse av insatser" 
                icon={<BarChart className="h-5 w-5 text-primary" />}
              />
              
              {!results ? (
                <div className="flex flex-col items-center justify-center h-full py-12 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <Calculator className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-center text-muted-foreground">Fyll i formuläret och klicka på &quot;Beräkna ROI&quot; för att se jämförelsen</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Kostnad för psykisk ohälsa */}
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">Total kostnad för psykisk ohälsa</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(results.total_mental_health_cost)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        per år
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Produktionsbortfall:</span>
                        <span className="font-medium ml-1">{formatCurrency(results.total_production_loss)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sjukfrånvaro:</span>
                        <span className="font-medium ml-1">{formatCurrency(results.total_sick_leave_cost)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Jämförelse av insatser */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Rangordning av insatser efter ROI</h4>
                    
                    {results.intervention_results.map((result, index) => {
                      // Skapa olika färgstilar baserat på resultat
                      const bgColorClass = index === 0 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-900/50';
                      const borderClass = index === 0 
                        ? 'border-green-200 dark:border-green-800' 
                        : 'border-gray-200 dark:border-gray-700';
                      
                      return (
                        <div 
                          key={result.id} 
                          className={`p-4 rounded-lg border ${bgColorClass} ${borderClass}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 text-primary w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <h5 className="font-semibold">{result.name}</h5>
                            </div>
                            <div className={`text-xl font-bold ${
                              result.roi_percentage >= 100 ? 'text-green-600 dark:text-green-400' : 
                              result.roi_percentage >= 0 ? 'text-primary' : 
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {formatPercent(result.roi_percentage)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Kostnad:</span>
                              <span className="font-medium ml-1">{formatCurrency(result.cost)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ekonomisk nytta:</span>
                              <span className="font-medium ml-1">{formatCurrency(result.economic_benefit)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Break-even effekt:</span>
                              <span className="font-medium ml-1">{formatPercent(result.break_even_effect)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ekonomiskt överskott:</span>
                              <span className={`font-medium ml-1 ${
                                result.economic_surplus > 0 ? 'text-green-600 dark:text-green-400' : 
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(result.economic_surplus)}
                              </span>
                            </div>
                          </div>
                          
                          {index === 0 && (
                            <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                              ★ Rekommenderad insats baserat på högst avkastning
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Visuell jämförelse */}
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-4">Visuell jämförelse av insatser</h4>
                    
                    <div className="space-y-4">
                      {/* ROI-jämförelse */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">ROI i procent</h5>
                        <div className="space-y-2">
                          {results.intervention_results.map((result) => {
                            // Beräkna relativ bredd för balken, max 100%
                            const barWidthPercent = Math.min(Math.max(result.roi_percentage, 0), 1000) / 10;
                            const barClass = 
                              result.roi_percentage >= 100 ? 'bg-green-500 dark:bg-green-600' : 
                              result.roi_percentage >= 0 ? 'bg-blue-500 dark:bg-blue-600' : 
                              'bg-red-500 dark:bg-red-600';
                              
                            return (
                              <div key={`roi-${result.id}`} className="space-y-1">
                                <div className="text-xs flex justify-between">
                                  <span>{result.name}</span>
                                  <span className="font-medium">{formatPercent(result.roi_percentage)}</span>
                                </div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${barClass} rounded-full`} 
                                    style={{ width: `${barWidthPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Kostnads-/nyttojämförelse */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">Ekonomisk nytta vs kostnad</h5>
                        <div className="space-y-3">
                          {results.intervention_results.map((result) => {
                            return (
                              <div key={`cost-benefit-${result.id}`} className="space-y-1">
                                <div className="text-xs">{result.name}</div>
                                <div className="flex gap-2 items-center">
                                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-l-md overflow-hidden relative">
                                    <div 
                                      className="h-full bg-red-400 dark:bg-red-600 absolute right-0 top-0" 
                                      style={{ width: '100%' }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-end px-2 text-xs text-white font-medium">
                                      {formatCurrency(result.cost)}
                                    </div>
                                  </div>
                                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-r-md overflow-hidden relative">
                                    <div 
                                      className="h-full bg-green-400 dark:bg-green-600" 
                                      style={{ width: '100%' }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                                      {formatCurrency(result.economic_benefit)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Kostnad för insats</span>
                            <span>Ekonomisk nytta</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded-md text-sm mt-4">
                    <p className="font-medium mb-1">Tolkning av resultaten:</p>
                    <p>Insatserna är rangordnade efter deras avkastning på investering (ROI). Insatsen med högst ROI ger mest ekonomisk nytta i förhållande till kostnaden.</p>
                    <p className="mt-2">Den ekonomiska nyttan beräknas genom den förväntade minskningen av andelen personal med hög stressnivå, vilket i sin tur minskar både produktionsbortfall och sjukfrånvaro.</p>
                    <p className="mt-2">Tänk på att utöver ekonomisk nytta kan andra faktorer som genomförbarhet, tidsperspektiv och anpassning till organisationens behov vara viktiga i valet av insats.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ComparativeROICalculator; 