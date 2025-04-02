import { Info } from 'lucide-react';

type InfoLabelProps = {
  text: string;
}

export const InfoLabel = ({ text }: InfoLabelProps) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Info className="w-3 h-3" />
    <span>{text}</span>
  </div>
);
