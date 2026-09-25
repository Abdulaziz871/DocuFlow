export type UserRole = 'system_admin' | 'operations_manager' | 'developer';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  isActive: boolean;
}

export type DocumentStatus =
  | 'received'
  | 'ocr_processing'
  | 'ai_extracting'
  | 'rules_processing'
  | 'completed'
  | 'failed'
  | 'needs_review';

export interface DFDocument {
  _id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  documentType: string | null;
  extractedData: Record<string, any> | null;
  rawText?: string | null;
  errorMessage: string | null;
  matchedRules?: { rule: { _id: string; name: string } | string; actionsTaken: string[] }[];
  reviewedBy?: { _id: string; name: string } | string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Rule {
  _id: string;
  name: string;
  description: string;
  documentType: string;
  isActive: boolean;
  conditions: { field: string; operator: string; value: unknown }[];
  actions: { type: string; params?: Record<string, unknown> }[];
  createdAt: string;
}

export interface ApiKeyRecord {
  _id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface Company {
  _id: string;
  name: string;
  webhookUrl: string | null;
  alertEmail: string | null;
  plan: string;
  usage: { documentsProcessed: number; apiCallsThisMonth: number };
}

export interface WebhookLogEntry {
  _id: string;
  url: string;
  statusCode: number | null;
  success: boolean;
  responseSnippet: string | null;
  createdAt: string;
}

export interface DashboardOverview {
  stats: {
    total: number;
    completed: number;
    needsReview: number;
    failed: number;
    activeRules: number;
    activeKeys: number;
  };
  recentDocuments: Pick<DFDocument, '_id' | 'originalFileName' | 'status' | 'documentType' | 'createdAt'>[];
}
