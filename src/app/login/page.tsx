"use client";

import AuthForm from '@/components/ui/auth/AuthForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till start
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-center">
        <AuthForm />
      </div>
    </div>
  );
} 