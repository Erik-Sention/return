import { CheckCircle2, Circle } from 'lucide-react';

interface FormTimelineProps {
  currentForm: string;
  completedForms: string[];
}

const forms = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function FormTimeline({ currentForm, completedForms }: FormTimelineProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {forms.map((form, index) => (
          <div key={form} className="flex flex-col items-center">
            <div className="relative">
              {/* Line connector */}
              {index < forms.length - 1 && (
                <div 
                  className={`absolute top-1/2 left-6 w-[calc(100%+1.5rem)] h-0.5 -translate-y-1/2 ${
                    completedForms.includes(form) ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
              
              {/* Circle indicator */}
              {completedForms.includes(form) ? (
                <CheckCircle2 className="w-5 h-5 text-primary relative z-10" />
              ) : (
                <Circle 
                  className={`w-5 h-5 ${
                    currentForm === form 
                      ? 'text-primary fill-primary/20' 
                      : 'text-muted-foreground'
                  } relative z-10`} 
                />
              )}
            </div>
            <span className={`mt-2 text-sm ${
              currentForm === form 
                ? 'font-medium text-primary' 
                : 'text-muted-foreground'
            }`}>
              Form {form}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 