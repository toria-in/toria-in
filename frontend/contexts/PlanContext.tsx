import React, { createContext, useContext, useState } from 'react';

// Generic shape for items added from the Discover tab.
export interface PendingItem {
  id: string;
  title: string;
  location: string;
  type: string; // 'Food' or 'Place'
  raw: any; // Store the full reel data
}

interface PlanContextType {
  pendingItems: PendingItem[];
  addPendingItem: (item: PendingItem) => void;
  clearPendingItems: () => void;
  removePendingItem: (id: string) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const addPendingItem = (item: PendingItem) => {
    setPendingItems(prev => {
      const exists = prev.some(p => p.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removePendingItem = (id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
  };

  const clearPendingItems = () => setPendingItems([]);

  return (
    <PlanContext.Provider value={{ 
      pendingItems, 
      addPendingItem, 
      clearPendingItems, 
      removePendingItem 
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return ctx;
};