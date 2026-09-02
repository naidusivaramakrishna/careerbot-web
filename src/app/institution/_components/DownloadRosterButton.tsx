'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { downloadRosterCsv } from '@/api/institutionApi';
import { Caption } from './Typography';

/**
 * Export the roster report to a file the officer can open in Excel.
 *
 * FETCH-THEN-SAVE, not an anchor. The route needs the college session token,
 * which a plain <a href> cannot carry: the request would arrive
 * unauthenticated and the browser would happily save the 403 page as
 * roster.csv. A download that looks like it worked and contains an error is
 * worse than one that fails visibly.
 *
 * THE OBJECT URL IS REVOKED. Without it every export holds its blob in memory
 * for the life of the tab, and an officer exporting through a morning
 * accumulates all of them.
 */
export function DownloadRosterButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await downloadRosterCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not build the export. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={run} disabled={busy} variant="secondary">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
        <span className="ml-2">{busy ? 'Building…' : 'Export CSV'}</span>
      </Button>
      {error ? (
        <Caption className="text-red-600">{error}</Caption>
      ) : null}
    </div>
  );
}
