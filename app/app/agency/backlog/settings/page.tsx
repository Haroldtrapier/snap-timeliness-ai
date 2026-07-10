"use client";
import { useState } from "react";
import { useBacklog } from "@/lib/backlog/store";
import { DEFAULT_PRESCREEN_CONFIG, DISCLAIMERS } from "@/lib/backlog/config";
import { Disclaimer } from "@/components/backlog/badges";
import type { PrescreenConfig } from "@/lib/backlog/types";

export default function SettingsPage() {
  const { state, updatePrescreenConfig } = useBacklog();
  const [cfg, setCfg] = useState<PrescreenConfig>(state.prescreenConfig);
  const [saved, setSaved] = useState(false);

  const setGross = (size: number, val: number) => setCfg((c) => ({ ...c, grossMonthlyIncomeLimit: { ...c.grossMonthlyIncomeLimit, [size]: val } }));
  const setNet = (size: number, val: number) => setCfg((c) => ({ ...c, netMonthlyIncomeLimit: { ...c.netMonthlyIncomeLimit, [size]: val } }));
  const save = () => { updatePrescreenConfig(cfg); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const reset = () => { setCfg(DEFAULT_PRESCREEN_CONFIG); updatePrescreenConfig(DEFAULT_PRESCREEN_CONFIG); };

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">Settings</h1>
          <p className="bk-sub">Configure pre-screen thresholds and timeliness standards. Rules are configurable so SNAP thresholds and state-specific policy can be updated later.</p>
        </div>
        <div className="bk-row">
          <button className="bk-btn subtle" onClick={reset}>Restore defaults</button>
          <button className="bk-btn" onClick={save}>Save configuration</button>
        </div>
      </div>

      {saved && <div className="bk-disclaimer" style={{ background: "#dcfce7", borderColor: "#86efac", color: "#166534" }}><span className="bk-ic">✓</span><span>Configuration saved. Pre-screen and priority scoring now use these thresholds.</span></div>}

      <Disclaimer text="These illustrative thresholds are for the demo only. Confirm current federal/state SNAP limits before pilot use. SNAP AI does not make final eligibility decisions." />

      <div className="bk-two">
        <div className="bk-panel">
          <h2>Income thresholds by household size (monthly)</h2>
          <div className="bk-table-wrap"><table className="bk-table" style={{ minWidth: "auto" }}>
            <thead><tr><th>Household size</th><th>Gross limit (~130% FPL)</th><th>Net limit (~100% FPL)</th></tr></thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td><input className="bk-input" type="number" value={cfg.grossMonthlyIncomeLimit[s]} onChange={(e) => setGross(s, Number(e.target.value))} /></td>
                  <td><input className="bk-input" type="number" value={cfg.netMonthlyIncomeLimit[s]} onChange={(e) => setNet(s, Number(e.target.value))} /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p className="bk-note" style={{ marginTop: 8 }}>Each additional member adds ${cfg.additionalMemberGross} gross / ${cfg.additionalMemberNet} net.</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="bk-panel">
            <h2>Timeliness standards</h2>
            <label className="bk-label" style={{ marginBottom: 12 }}>Expedited SLA (days)
              <input className="bk-input" type="number" value={cfg.expeditedSlaDays} onChange={(e) => setCfg((c) => ({ ...c, expeditedSlaDays: Number(e.target.value) }))} />
            </label>
            <label className="bk-label" style={{ marginBottom: 12 }}>Standard SLA (days)
              <input className="bk-input" type="number" value={cfg.standardSlaDays} onChange={(e) => setCfg((c) => ({ ...c, standardSlaDays: Number(e.target.value) }))} />
            </label>
            <label className="bk-label">Near-deadline window (days)
              <input className="bk-input" type="number" value={cfg.nearDeadlineDays} onChange={(e) => setCfg((c) => ({ ...c, nearDeadlineDays: Number(e.target.value) }))} />
            </label>
          </div>
          <div className="bk-panel">
            <h2>Integration</h2>
            <p className="bk-note" style={{ color: "#334155" }}>{DISCLAIMERS.integration}</p>
            <div className="bk-tags"><span className="bk-badge bk-b-gray">NC FAST-compatible intake (mocked)</span><span className="bk-badge bk-b-gray">CSV import (live)</span><span className="bk-badge bk-b-gray">Local demo storage</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
