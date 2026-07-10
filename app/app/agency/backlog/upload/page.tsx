"use client";
import { useMemo, useRef, useState } from "react";
import { useBacklog } from "@/lib/backlog/store";
import { buildPreview, SAMPLE_CSV, downloadText, REQUIRED_COLUMNS, OPTIONAL_COLUMNS, type ImportPreview } from "@/lib/backlog/csv";
import { Disclaimer } from "@/components/backlog/badges";

export default function UploadPage() {
  const { state, importCases } = useBacklog();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [imported, setImported] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const existingIds = useMemo(() => new Set(state.cases.map((c) => c.id)), [state.cases]);
  const preview: ImportPreview | null = useMemo(() => (text.trim() ? buildPreview(text, existingIds) : null), [text, existingIds]);

  const onFile = (f: File) => {
    setFileName(f.name);
    setImported(null);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(f);
  };

  const canImport = preview && preview.missingColumns.length === 0 && preview.validCount > 0;
  const doImport = () => {
    if (!preview) return;
    const good = preview.rows.filter((r) => r.errors.length === 0);
    const n = importCases(good);
    setImported(n);
    setText("");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <div className="bk-pagehead">
        <div>
          <h1 className="bk-h1">Upload SNAP Case Data</h1>
          <p className="bk-sub">Import your backlog as CSV. SNAP AI validates columns, previews the import, flags errors and duplicates, then stores cases for review.</p>
        </div>
        <button className="bk-btn ghost" onClick={() => downloadText("snap-ai-sample-template.csv", SAMPLE_CSV)}>Download sample CSV</button>
      </div>

      <Disclaimer text="NC FAST-compatible intake layer (integration-ready architecture). This demo imports CSV locally; live NC FAST integration is not enabled." />

      <div className="bk-two">
        <div className="bk-panel">
          <h2>1 · Choose a CSV file</h2>
          <input ref={fileRef} className="bk-input" type="file" accept=".csv,text/csv" onChange={(e) => e.target.files && e.target.files[0] && onFile(e.target.files[0])} />
          <div className="bk-note" style={{ margin: "10px 0" }}>…or paste CSV text:</div>
          <textarea className="bk-textarea" placeholder="case_id,county,application_date,household_size,monthly_income,…" value={text} onChange={(e) => { setText(e.target.value); setImported(null); }} />
          {fileName && <div className="bk-note" style={{ marginTop: 8 }}>Loaded: {fileName}</div>}
          <div className="bk-row" style={{ marginTop: 12 }}>
            <button className="bk-btn subtle" onClick={() => setText(SAMPLE_CSV)}>Load sample data</button>
            <button className="bk-btn subtle" onClick={() => { setText(""); setFileName(""); setImported(null); }}>Clear</button>
          </div>
        </div>

        <div className="bk-panel">
          <h2>Required columns</h2>
          <p className="bk-note">Your CSV header must include these columns:</p>
          <div className="bk-tags" style={{ marginBottom: 10 }}>
            {REQUIRED_COLUMNS.map((c) => <span key={c} className="bk-badge bk-b-blue">{c}</span>)}
          </div>
          <p className="bk-note">Optional columns:</p>
          <div className="bk-tags">
            {OPTIONAL_COLUMNS.map((c) => <span key={c} className="bk-badge bk-b-gray">{c}</span>)}
          </div>
        </div>
      </div>

      {imported !== null && (
        <div className="bk-disclaimer" style={{ background: "#dcfce7", borderColor: "#86efac", color: "#166534" }}>
          <span className="bk-ic">✓</span>
          <span>Imported {imported} case(s). They are now in the Cases table and Priority Queue. Every import is recorded in the audit log.</span>
        </div>
      )}

      {preview && (
        <div className="bk-panel">
          <div className="bk-between">
            <h2 style={{ margin: 0 }}>2 · Import preview</h2>
            <div className="bk-row">
              <span className="bk-badge bk-b-green">{preview.validCount} valid</span>
              <span className="bk-badge bk-b-red">{preview.errorCount} errors</span>
              <span className="bk-badge bk-b-amber">{preview.duplicateCount} duplicates</span>
            </div>
          </div>

          {preview.missingColumns.length > 0 && (
            <div className="bk-disclaimer" style={{ background: "#fee2e2", borderColor: "#fecaca", color: "#991b1b", marginTop: 12 }}>
              <span className="bk-ic">!</span>
              <span>Missing required column(s): {preview.missingColumns.join(", ")}. Fix the header and re-upload.</span>
            </div>
          )}

          <div className="bk-table-wrap" style={{ marginTop: 12 }}>
            <table className="bk-table">
              <thead><tr><th>Row</th><th>Case ID</th><th>County</th><th>Applied</th><th>Household</th><th>Income</th><th>Status</th><th>Result</th></tr></thead>
              <tbody>
                {preview.rows.slice(0, 100).map((r) => (
                  <tr key={r.rowNumber} style={r.errors.length ? { background: r.duplicate ? "#fffbeb" : "#fef2f2" } : undefined}>
                    <td className="num">{r.rowNumber}</td>
                    <td>{r.caseId || <span className="bk-note">—</span>}</td>
                    <td>{r.raw["county"]}</td>
                    <td>{r.raw["application_date"]}</td>
                    <td className="num">{r.raw["household_size"]}</td>
                    <td className="num">{r.raw["monthly_income"]}</td>
                    <td>{r.raw["status"] || "New"}</td>
                    <td>{r.errors.length === 0 ? <span className="bk-badge bk-b-green">OK</span> : <span className="bk-note" style={{ color: r.duplicate ? "#92400e" : "#991b1b" }}>{r.errors.join("; ")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bk-row" style={{ marginTop: 14 }}>
            <button className="bk-btn" disabled={!canImport} onClick={doImport}>Import {preview.validCount} valid case(s)</button>
            <span className="bk-note">Rows with errors or duplicate Case IDs are skipped automatically.</span>
          </div>
        </div>
      )}
    </>
  );
}
