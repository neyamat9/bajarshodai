export type PrescriptionStatus = 'PENDING' | 'REVIEWED' | 'ORDER_CREATED' | 'REJECTED';

export interface MedicineMetaData {
  id?: string;
  genericName: string;
  genericSlug?: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string;
  indications?: string;
  sideEffects?: string;
  precautions?: string;
  isPrescriptionRequired?: boolean;
}

export interface PrescriptionRecord {
  id: string;
  userId?: string | null;
  phone: string;
  imageUrl: string;
  notes?: string | null;
  status: PrescriptionStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadPrescriptionPayload {
  fileUri: string;
  fileName?: string;
  mimeType?: string;
  phone: string;
  notes?: string;
  onProgress?: (percent: number) => void;
}
