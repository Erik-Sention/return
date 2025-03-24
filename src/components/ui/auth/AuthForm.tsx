"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';

type FormMode = 'login' | 'register';

export default function AuthForm() {
  const [mode, setMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithGoogle, signInWithEmail, registerWithEmail, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } else {
      await registerWithEmail(email, password);
      router.push('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg shadow-md w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">
          {mode === 'login' ? 'Logga in' : 'Registrera dig'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'login' 
            ? 'Logga in för att komma åt ROI-kalkylatorn' 
            : 'Skapa ett konto för att använda ROI-kalkylatorn'}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            E-postadress
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@epost.se"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Lösenord
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          {mode === 'login' ? 'Logga in' : 'Registrera dig'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            eller
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full flex items-center gap-2 justify-center" 
        onClick={handleGoogleSignIn}
      >
        <FcGoogle className="h-5 w-5" />
        Fortsätt med Google
      </Button>

      <div className="text-center text-sm">
        {mode === 'login' ? (
          <p>
            Har du inget konto?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="text-primary hover:underline"
            >
              Registrera dig
            </button>
          </p>
        ) : (
          <p>
            Har du redan ett konto?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-primary hover:underline"
            >
              Logga in
            </button>
          </p>
        )}
      </div>
    </div>
  );
} 