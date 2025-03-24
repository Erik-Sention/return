"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, Calculator } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  const { currentUser, signOut } = useAuth();

  return (
    <nav className="border-b">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="font-semibold">
          ROI-kalkylator
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {currentUser ? (
            <>
              <Link href="/roi">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  ROI-kalkylator
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                Logga ut
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Logga in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 