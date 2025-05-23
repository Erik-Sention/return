"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, LayoutDashboard, Folder, Calculator, BarChart } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  const { currentUser, signOut } = useAuth();

  return (
    <nav className="border-b">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link href="/dashboard" className="font-semibold pl-3">
          SENTION
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {currentUser ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/roi-projects">
                <Button variant="outline" size="sm" className="gap-2">
                  <Folder className="h-4 w-4" />
                  ROI-projekt
                </Button>
              </Link>
              <Link href="/roi/simple">
                <Button variant="outline" size="sm" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Förenklad ROI-kalkylator
                </Button>
              </Link>
              <Link href="/roi/comparative">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Jämförande ROI-kalkylator
                </Button>
              </Link>
              <Button 
                variant="outline" 
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
              <Button variant="outline" size="sm" className="gap-2">
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