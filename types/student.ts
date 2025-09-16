export interface Student {
  id: number | string;
  name: string;
  degree: string;
  programme: string;
  idNumber: string;
  expirationDate: string;
  photoUrl: string;
  email?: string;
  status?: string;
  arrivalDate?: string | null;
  campus?: string;
}