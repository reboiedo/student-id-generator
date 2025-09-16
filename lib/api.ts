import { Student } from "@/types/student";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface ApiStudentResponse {
  full_name: string;
  programme: string | null;
  student_id_number: string | null;
  arrival_date: string | null;
  degree: string | null;
  campus: string;
  is_teacher: boolean;
  photo: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    this.token = process.env.NEXT_PUBLIC_API_TOKEN || '';
    
    if (!this.baseUrl || !this.token) {
      throw new Error('API configuration missing. Please check environment variables.');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': this.token,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  async getStudents(): Promise<Student[]> {
    try {
      const response = await this.request<ApiStudentResponse[]>('/users-list');
      
      // Handle different possible response structures
      let students: ApiStudentResponse[] = [];
      if (Array.isArray(response)) {
        students = response as unknown as ApiStudentResponse[];
      } else if (Array.isArray(response.data)) {
        students = response.data;
      } else if (response && typeof response === 'object' && 'users' in response) {
        students = (response as any).users;
      } else if (response && typeof response === 'object' && 'students' in response) {
        students = (response as any).students;
      } else {
        console.error('Unexpected API response structure:', response);
        throw new Error('Unexpected API response structure');
      }
      
      return students.map((student, index) => this.transformStudent(student, index));
    } catch (error) {
      console.error('Failed to fetch students:', error);
      throw error;
    }
  }

  private transformStudent(apiStudent: ApiStudentResponse, index: number): Student {
    const generateIdNumber = (name: string, index: number): string => {
      // If API has student_id_number, use it, otherwise generate one
      if (apiStudent.student_id_number) {
        return apiStudent.student_id_number;
      }
      // Generate from name and index
      const nameHash = name.replace(/\s+/g, '').toLowerCase().slice(0, 5);
      const idStr = String(index + 1).padStart(5, '0');
      return `${nameHash}-${idStr}`;
    };

    const generateExpirationDate = (arrivalDate: string | null, degree: string | null): string => {
      let baseDate: Date;
      
      if (arrivalDate) {
        // Use arrival date as base
        baseDate = new Date(arrivalDate);
      } else {
        // Fallback to current date if no arrival date
        baseDate = new Date();
      }
      
      // Add years based on degree type (handle null degree)
      const degreeStr = degree || 'master'; // Default to master if null
      const yearsToAdd = degreeStr.toLowerCase().includes('bachelor') ? 3 : 1; // 3 years for bachelor, 1 year for master/others
      baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
      
      return baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Generate unique ID using full_name + index
    const uniqueId = `${apiStudent.full_name.replace(/\s+/g, '_').toLowerCase()}_${index}`;

    return {
      id: uniqueId, // Use unique ID based on name + index
      name: apiStudent.full_name || 'Unknown Student',
      degree: apiStudent.degree || 'Master', // Use real degree from API or default to Master
      programme: apiStudent.programme || 'General Studies',
      idNumber: generateIdNumber(apiStudent.full_name || '', index),
      expirationDate: generateExpirationDate(apiStudent.arrival_date, apiStudent.degree),
      photoUrl: apiStudent.photo || '/test-photo.jpg', // Use real photo URL or fallback
      email: '', // API doesn't provide email
      status: 'active',
      arrivalDate: apiStudent.arrival_date,
      campus: apiStudent.campus,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getStudents();
      return {
        success: true,
        message: 'API connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const apiClient = new ApiClient();
export type { ApiStudentResponse };