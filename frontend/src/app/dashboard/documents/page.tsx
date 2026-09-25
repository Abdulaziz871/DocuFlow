'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/apiClient';
import DocumentsTable from '@/components/DocumentsTable';
import UploadDropzone from '@/components/UploadDropzone';
import type { DFDocument } from '@/types';

const IN_PROGRESS_STATUSES = ['received', 'ocr_processing', 'ai_extracting', 'rules_processing'];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DFDocument[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    const res = await apiClient.get('/documents');
    const docs: DFDocument[] = res.data.data;
    setDocuments(docs);

    // Keep polling in the background while anything is still mid-pipeline, so status
    // badges (received → ... → completed/failed) update without a manual refresh.
    clearTimeout(timerRef.current);
    if (docs.some((d) => IN_PROGRESS_STATUSES.includes(d.status))) {
      timerRef.current = setTimeout(load, 3000);
    }
  }, []);

  useEffect(() => {
    load();
    return () => clearTimeout(timerRef.current);
  }, [load]);

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={load} />
      <DocumentsTable documents={documents} />
    </div>
  );
}
