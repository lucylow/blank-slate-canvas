/**
 * Mock API for storing annotations in localStorage
 * In production, this would be replaced with a real backend API
 */

const KEY = 'pitwall_mock_annotations_v1';

export interface AnnotationRecord {
  eventId: string;
  annotations: string[];
  note?: string;
  tags?: string[];
  severity?: string;
  validated?: boolean;
  validation_note?: string;
  updatedAt?: string;
  audit?: AuditEntry[];
}

export interface AuditEntry {
  ts: string;
  action: string;
  by: string;
}

export function loadAnnotations(): Record<string, AnnotationRecord> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to load annotations from localStorage:', e);
    return {};
  }
}

export function saveAnnotation(eventId: string, patch: Partial<AnnotationRecord>): AnnotationRecord {
  const all = loadAnnotations();
  const forEvent = all[eventId] || { 
    eventId, 
    annotations: [], 
    validated: false, 
    audit: [],
    tags: [],
    severity: 'info'
  };
  
  const newRec: AnnotationRecord = { 
    ...forEvent, 
    ...patch, 
    updatedAt: new Date().toISOString() 
  };
  
  // Add audit entry
  const audit = newRec.audit || [];
  audit.push({ 
    ts: new Date().toISOString(), 
    action: (patch as any).action || 'update', 
    by: 'local' 
  });
  newRec.audit = audit;
  
  all[eventId] = newRec;
  
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Failed to save annotations to localStorage:', e);
  }
  
  return newRec;
}

export function deleteAnnotation(eventId: string): void {
  const all = loadAnnotations();
  delete all[eventId];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Failed to delete annotation from localStorage:', e);
  }
}

