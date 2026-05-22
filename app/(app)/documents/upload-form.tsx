"use client";

import { useState, useTransition, useRef } from "react";
import { uploadDocumentAction } from "./actions";

export function UploadForm({
  checklistOptions,
}: {
  checklistOptions: Array<{ id: string; label: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadDocumentAction(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card card-pad space-y-3">
      <div>
        <label className="label" htmlFor="file">
          Upload a document
        </label>
        <input
          id="file"
          name="file"
          type="file"
          className="block w-full text-sm"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, HEIC, or PDF. Up to 10 MB. Files are stored privately and only you and your caseworker can see them.
        </p>
      </div>
      {checklistOptions.length > 0 && (
        <div>
          <label className="label" htmlFor="checklist_item_id">
            Map to checklist item (optional)
          </label>
          <select id="checklist_item_id" name="checklist_item_id" className="input">
            <option value="">—</option>
            {checklistOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">AI classification (if enabled) runs server-side after upload.</span>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Uploading…" : "Upload"}
        </button>
      </div>
    </form>
  );
}
