import type { SnapCase, EligibilityStatus } from '../types';

// Approximate 130% FPL monthly gross income thresholds (mock values for demo only).
const FPL_130_MONTHLY: Record<number, number> = {
  1: 1632,
  2: 2215,
  3: 2798,
  4: 3380,
  5: 3963,
  6: 4546,
  7: 5129,
  8: 5712,
};

export function evaluateEligibility(c: SnapCase): EligibilityStatus {
  const missingRequired = c.documents.some((d) => d.required && d.status === 'missing');
  const highRiskFlag = c.riskFlags.some((f) => f.severity === 'high');

  if (c.emergencyNeed || c.income === 0) {
    return 'expedited review recommended';
  }
  if (missingRequired || highRiskFlag) {
    return 'needs more information';
  }

  const cap = FPL_130_MONTHLY[c.householdSize] ?? FPL_130_MONTHLY[8] + (c.householdSize - 8) * 583;
  if (c.income <= cap) return 'likely eligible';
  return 'likely ineligible';
}

export const ELIGIBILITY_DISCLAIMER =
  'SNAP AI provides decision support only. Final eligibility decisions remain with authorized agency staff.';
