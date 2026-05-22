"use client";
import { useState, useMemo } from "react";
import { Disclaimer } from "@/components/Disclaimer";

export default function BenefitPlannerPage() {
  const [benefit, setBenefit] = useState(540);
  const [weeks, setWeeks] = useState(4);
  const [allocation, setAllocation] = useState({
    proteins: 30,
    produce: 25,
    grains: 15,
    dairy: 10,
    pantry: 10,
    frozen: 10,
  });

  const total = Object.values(allocation).reduce((a, b) => a + b, 0);
  const perWeek = useMemo(() => benefit / weeks, [benefit, weeks]);
  const dollarSplit = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(allocation)) {
      out[k] = Math.round((benefit * v) / 100);
    }
    return out;
  }, [benefit, allocation]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Benefit budget planner</h1>
        <p className="text-sm text-gray-600">Plan your monthly EBT around the food categories your household needs most.</p>
      </header>
      <Disclaimer variant="compact" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Your monthly EBT</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monthly benefit (USD)</label>
              <input type="number" className="input" min={0} value={benefit}
                onChange={(e) => setBenefit(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Weeks to stretch across</label>
              <input type="number" className="input" min={1} max={6} value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-4 text-sm">
            Weekly target: <span className="font-semibold">${perWeek.toFixed(2)}</span>
          </div>
        </div>

        <div className="card card-pad">
          <h2 className="font-semibold">Category mix ({total}%)</h2>
          {total !== 100 && <p className="mt-1 text-xs text-red-700">Allocations should add up to 100%.</p>}
          <div className="mt-3 space-y-2">
            {Object.entries(allocation).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <div className="w-24 capitalize">{k}</div>
                <input type="range" min={0} max={60} value={v}
                  onChange={(e) => setAllocation({ ...allocation, [k]: Number(e.target.value) })}
                  className="flex-1" />
                <div className="w-12 text-right">{v}%</div>
                <div className="w-16 text-right text-gray-600">${dollarSplit[k]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h2 className="font-semibold">Tips for stretching SNAP</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Buy proteins in family packs and freeze portions for the week.</li>
          <li>Frozen produce is SNAP-eligible and usually cheaper than fresh out of season.</li>
          <li>Pantry staples (rice, beans, oats) stretch the longest.</li>
          <li>Watch for store loyalty discounts — they stack with SNAP.</li>
          <li>Farmers' markets in many states double SNAP for fresh produce.</li>
        </ul>
      </div>
    </div>
  );
}
