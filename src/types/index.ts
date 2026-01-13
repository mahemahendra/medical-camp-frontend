/**
 * Type definitions for the Medical Camp Manager application
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  CAMP_HEAD = 'CAMP_HEAD',
  DOCTOR = 'DOCTOR'
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  campId?: string;
  isActive: boolean;
}

export interface Camp {
  id: string;
  uniqueSlug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  venue: string;
  startTime: Date;
  endTime: Date;
  contactInfo?: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
}

export interface Visitor {
  id: string;
  campId: string;
  patientIdPerCamp: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  address?: string;
  city?: string;
  district?: string;
  symptoms?: string;
  existingConditions?: string;
  allergies?: string;
  qrCode?: string;
  createdAt: Date;
}

export enum VisitStatus {
  REGISTERED = 'REGISTERED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Visit {
  id: string;
  campId: string;
  visitorId: string;
  doctorId?: string;
  status: VisitStatus;
  consultationTime?: Date;
  visitor?: Visitor;
  doctor?: User;
  consultation?: Consultation;
  attachments?: Attachment[];
  createdAt: Date;
}

export interface Consultation {
  id: string;
  visitId: string;
  chiefComplaints: string;
  clinicalNotes?: string;
  diagnosis: string;
  treatmentPlan: string;
  prescriptions?: Prescription[];
  medicalRecords?: MedicalRecord[];
  followUpAdvice?: string;
  createdAt: Date;
}

export interface Prescription {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface MedicalRecord {
  category: string;    // vitals, lab, imaging, measurement, assessment, other
  title: string;       // e.g., Blood Pressure, Hemoglobin
  value: string;       // e.g., 120/80, 12.5
  unit: string;        // e.g., mmHg, g/dL
  normalRange: string; // e.g., 90-140/60-90
  notes: string;       // Additional observations
  recordDate: string;  // Date when record was taken
}

export interface Attachment {
  id: string;
  campId: string;
  visitId: string;
  consultationId?: string;
  fileName: string;
  fileUrl: string;
  type: 'LAB_REPORT' | 'PRESCRIPTION' | 'DOCUMENT' | 'IMAGE';
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export interface Analytics {
  totalVisitors: number;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  genderDistribution: Array<{ gender: string; count: number }>;
  ageDistribution: Array<{ ageGroup: string; count: number }>;
  doctorStats: Array<{ doctorName: string; visitCount: number }>;
}
