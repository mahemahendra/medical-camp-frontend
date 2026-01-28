// Type definitions for CampForm
export interface CampFormData {
  // Hospital details
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;

  // Camp details
  name: string;
  description?: string;
  venue: string;
  startTime: string;
  endTime: string;
  contactInfo?: string;

  // Camp Head
  campHeadName: string;
  campHeadEmail: string;
  campHeadPhone: string;

  // Files (optional for edit mode)
  logo?: File | null;
  backgroundImage?: File | null;

  // Current URLs (for edit mode)
  logoUrl?: string;
  backgroundImageUrl?: string;

  // Doctors
  doctors: Doctor[];

  // Password settings (only for create mode)
  passwordSettings?: {
    mode: 'auto' | 'manual';
    campHeadPassword: string;
    doctorPasswords: Record<string, string>;
  };
}

export interface Doctor {
  name: string;
  email: string;
  specialty: string;
  phone?: string;
}

export interface CampFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<CampFormData>;
  onSubmit: (data: CampFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}
