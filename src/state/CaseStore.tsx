import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { SnapCase, QueueStatus } from '../types';
import { mockCases } from '../data/mockCases';

interface CaseStoreValue {
  cases: SnapCase[];
  addCase: (c: SnapCase) => void;
  updateCase: (id: string, patch: Partial<SnapCase>) => void;
  setQueueStatus: (id: string, status: QueueStatus) => void;
  assignReviewer: (id: string, reviewer: string) => void;
}

const CaseStoreContext = createContext<CaseStoreValue | null>(null);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<SnapCase[]>(mockCases);

  const addCase = useCallback((c: SnapCase) => {
    setCases((prev) => [c, ...prev]);
  }, []);

  const updateCase = useCallback((id: string, patch: Partial<SnapCase>) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const setQueueStatus = useCallback((id: string, status: QueueStatus) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, queueStatus: status } : c)));
  }, []);

  const assignReviewer = useCallback((id: string, reviewer: string) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, assignedReviewer: reviewer } : c)));
  }, []);

  const value = useMemo<CaseStoreValue>(
    () => ({ cases, addCase, updateCase, setQueueStatus, assignReviewer }),
    [cases, addCase, updateCase, setQueueStatus, assignReviewer],
  );

  return <CaseStoreContext.Provider value={value}>{children}</CaseStoreContext.Provider>;
}

export function useCases(): CaseStoreValue {
  const ctx = useContext(CaseStoreContext);
  if (!ctx) throw new Error('useCases must be used inside CaseProvider');
  return ctx;
}
