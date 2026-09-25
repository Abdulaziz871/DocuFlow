import Link from 'next/link';
import { FileStack, ChevronLeft } from 'lucide-react';
import StatusBadge from './Badge';
import type { DFDocument } from '@/types';

export default function DocumentsTable({ documents }: { documents: DFDocument[] }) {
  if (!documents.length) {
    return (
      <div className="table-shell flex flex-col items-center justify-center gap-2 py-14 text-center">
        <FileStack className="text-muted/50" size={28} />
        <p className="text-sm text-muted">لا توجد مستندات بعد.</p>
      </div>
    );
  }

  return (
    <div className="table-shell overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>اسم الملف</th>
            <th>النوع</th>
            <th>الحالة</th>
            <th>تاريخ الرفع</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc._id} className="group">
              <td className="font-medium">
                <Link href={`/dashboard/documents/${doc._id}`} className="hover:text-brand">
                  {doc.originalFileName}
                </Link>
              </td>
              <td className="text-muted">{doc.documentType || '—'}</td>
              <td>
                <StatusBadge status={doc.status} />
              </td>
              <td className="text-muted">{new Date(doc.createdAt).toLocaleString('ar-EG')}</td>
              <td>
                <Link
                  href={`/dashboard/documents/${doc._id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100"
                >
                  مراجعة <ChevronLeft size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
