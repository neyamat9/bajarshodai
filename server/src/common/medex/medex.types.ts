export interface MedExSearchResult {
  medexId: number;
  name: string;
  dosageForm: string;
  strength: string;
  url: string;
}

export interface MedExMedicineDetail {
  medexId: number;
  medexUrl: string;
  name: string;
  dosageForm: string;
  strength: string;
  genericName: string;
  genericSlug: string;
  companyName: string;
  manufacturer?: string;
  unitPrice: number | null;
  stripPrice: number | null;
  boxPrice: number | null;
  packSizeInfo: string | null;
}
