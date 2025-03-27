declare module '@/components/ui/tabs' {
  import * as React from 'react';

  export const Tabs: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }>;

  export const TabsList: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'>>;
  
  export const TabsTrigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & {
    value: string;
  }>;
  
  export const TabsContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & {
    value: string;
  }>;
} 