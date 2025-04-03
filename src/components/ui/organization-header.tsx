"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadOrganizationInfoFromFormD } from '@/lib/firebase/sharedFields';

interface OrganizationHeaderProps {
  forceRefresh?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  onDataLoaded?: (data: { organizationName: string, contactPerson: string } | null) => void;
}

export const OrganizationHeader = ({ 
  forceRefresh = false, 
  onLoadingChange,
  onDataLoaded
}: OrganizationHeaderProps) => {
  const { currentUser } = useAuth();
  const [organizationInfo, setOrganizationInfo] = useState<{
    organizationName: string;
    contactPerson: string;
  } | null>(null);
  
  // Referens för att spåra om vi redan har anropat callbacks
  const callbacksCalledRef = useRef({
    loadingChangeSet: false,
    dataLoaded: false
  });
  
  // Spara callbacks i ref för att undvika att de orsakar oändliga loopningar
  const callbacksRef = useRef({
    onLoadingChange,
    onDataLoaded
  });
  
  // Uppdatera callback-referenserna när props ändras, men undvik att orsaka omrendering
  useEffect(() => {
    callbacksRef.current = {
      onLoadingChange,
      onDataLoaded
    };
  }, [onLoadingChange, onDataLoaded]);
  
  // Ladda organisationsinformation från formulär D en gång
  useEffect(() => {
    // Återställ callbacks-status om forceRefresh är true
    if (forceRefresh) {
      callbacksCalledRef.current = {
        loadingChangeSet: false,
        dataLoaded: false
      };
    }
    
    const fetchOrganizationInfo = async () => {
      if (currentUser?.uid) {
        try {
          // Anropa bara onLoadingChange en gång per rendering-cykel
          if (!callbacksCalledRef.current.loadingChangeSet && callbacksRef.current.onLoadingChange) {
            callbacksRef.current.onLoadingChange(true);
            callbacksCalledRef.current.loadingChangeSet = true;
          }
          
          const info = await loadOrganizationInfoFromFormD(currentUser.uid);
          
          // Uppdatera tillståndsvariabeln
          setOrganizationInfo(info);
          
          // Anropa bara onDataLoaded en gång per rendering-cykel
          if (!callbacksCalledRef.current.dataLoaded && callbacksRef.current.onDataLoaded) {
            callbacksRef.current.onDataLoaded(info);
            callbacksCalledRef.current.dataLoaded = true;
          }
        } catch (error) {
          console.error('Kunde inte hämta organisationsinformation:', error);
          
          // Anropa bara onDataLoaded en gång per rendering-cykel
          if (!callbacksCalledRef.current.dataLoaded && callbacksRef.current.onDataLoaded) {
            callbacksRef.current.onDataLoaded(null);
            callbacksCalledRef.current.dataLoaded = true;
          }
        } finally {
          // Anropa bara onLoadingChange en gång per rendering-cykel
          if (callbacksRef.current.onLoadingChange) {
            callbacksRef.current.onLoadingChange(false);
          }
        }
      } else {
        // Anropa bara callbacks en gång per rendering-cykel
        if (callbacksRef.current.onLoadingChange) {
          callbacksRef.current.onLoadingChange(false);
        }
        
        if (!callbacksCalledRef.current.dataLoaded && callbacksRef.current.onDataLoaded) {
          callbacksRef.current.onDataLoaded(null);
          callbacksCalledRef.current.dataLoaded = true;
        }
      }
    };
    
    fetchOrganizationInfo();
    // Ta bort onLoadingChange och onDataLoaded från dependencies för att undvika oändliga uppdateringar
  }, [currentUser, forceRefresh]);
  
  // Visa inte header om information saknas
  if (!organizationInfo || (!organizationInfo.organizationName && !organizationInfo.contactPerson)) {
    return null;
  }
  
  return (
    <div className="bg-primary/5 border border-primary/20 p-3 rounded-md mb-4">
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="mb-2 sm:mb-0">
          <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
          <span className="ml-2 font-semibold">{organizationInfo.organizationName || "Ej angiven"}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">Kontaktperson:</span>
          <span className="ml-2 font-semibold">{organizationInfo.contactPerson || "Ej angiven"}</span>
        </div>
      </div>
    </div>
  );
}; 