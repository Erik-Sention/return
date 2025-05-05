import { CheckCircle2, Circle } from 'lucide-react';

interface FormTimelineProps {
  currentForm: string;
  completedForms: string[];
  onFormChange?: (form: string) => void;
}

const formInfos: { id: string; displayId: string; title: string; description: string }[] = [
  { 
    id: 'D', 
    displayId: '1',
    title: 'Formulär D', 
    description: 'Personalkostnader & sjukfrånvaro' 
  },
  { 
    id: 'C', 
    displayId: '2',
    title: 'Formulär C', 
    description: 'Beräkning av psykosocial ohälsa' 
  },
  { 
    id: 'A', 
    displayId: '3',
    title: 'Formulär A', 
    description: 'Organisation' 
  },
  { 
    id: 'B', 
    displayId: '4',
    title: 'Formulär B', 
    description: 'Planering av insatser' 
  },
  { 
    id: 'G', 
    displayId: '5',
    title: 'Formulär G', 
    description: 'Totala Insatskostnader' 
  },
  { 
    id: 'J', 
    displayId: '6',
    title: 'Formulär J', 
    description: 'Return on investment' 
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
              {form.displayId}
            </span>
            
            {/* Tooltip för att visa mer information - nu under istället för över */}
            <div className="absolute top-full mt-1 w-36 bg-popover text-popover-foreground rounded-md p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2 text-center z-20">
              <p className="text-xs">{form.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 