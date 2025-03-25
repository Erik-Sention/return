import { CheckCircle2, Circle } from 'lucide-react';

interface FormTimelineProps {
  currentForm: string;
  completedForms: string[];
  onFormChange?: (form: string) => void;
}

const formInfos: { id: string; title: string; description: string }[] = [
  { 
    id: 'A', 
    title: 'Formulär A', 
    description: 'Verksamhetsanalys' 
  },
  { 
    id: 'B', 
    title: 'Formulär B', 
    description: 'Insatsanalys' 
  },
  { 
    id: 'C', 
    title: 'Formulär C', 
    description: 'Ekonomiska konsekvenser' 
  },
  { 
    id: 'D', 
    title: 'Formulär D', 
    description: 'Kostnadsberäkning' 
  },
  { 
    id: 'E', 
    title: 'Formulär E', 
    description: 'Kort sjukfrånvaro' 
  },
  { 
    id: 'F', 
    title: 'Formulär F', 
    description: 'Lång sjukfrånvaro' 
  },
  { 
    id: 'G', 
    title: 'Formulär G', 
    description: 'Beräkningsmodell insatser' 
  },
  { 
    id: 'H', 
    title: 'Formulär H', 
    description: 'Kostnadsberäkning insatser' 
  },
  { 
    id: 'I', 
    title: 'Formulär I', 
    description: 'Vinstberäkning' 
  },
  { 
    id: 'J', 
    title: 'Formulär J', 
    description: 'Sammanställning' 
  }
];


export default function FormTimeline({ currentForm, completedForms, onFormChange }: FormTimelineProps) {
  return (
    <div className="w-full pb-8">
      <h3 className="text-lg font-medium mb-4">Förlopp för ROI-beräkning</h3>
      <div className="flex items-center justify-between">
        {formInfos.map((form, index) => (
          <div 
            key={form.id} 
            className="flex flex-col items-center cursor-pointer group relative" 
            onClick={() => onFormChange && onFormChange(form.id)}
          >
            <div className="relative">
              {/* Line connector */}
              {index < formInfos.length - 1 && (
                <div 
                  className={`absolute top-1/2 left-6 w-[calc(100%+1.5rem)] h-0.5 -translate-y-1/2 ${
                    completedForms.includes(form.id) ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
              
              {/* Circle indicator */}
              {completedForms.includes(form.id) ? (
                <CheckCircle2 className="w-5 h-5 text-primary relative z-10" />
              ) : (
                <Circle 
                  className={`w-5 h-5 ${
                    currentForm === form.id 
                      ? 'text-primary fill-primary/20' 
                      : 'text-muted-foreground'
                  } relative z-10`} 
                />
              )}
            </div>
            <span className={`mt-2 text-sm font-medium ${
              currentForm === form.id 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}>
              {form.id}
            </span>
            
            {/* Tooltip för att visa mer information - nu under istället för över */}
            <div className="absolute top-full mt-1 w-36 bg-popover text-popover-foreground rounded-md p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2 text-center z-20">
              <p className="text-xs font-medium"></p>
              <p className="text-xs">{form.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 