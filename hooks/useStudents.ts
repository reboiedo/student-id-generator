import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Student } from '@/types/student';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: () => apiClient.getStudents(),
    staleTime: 1000 * 60 * 10, // 10 minutes - don't refetch unless data is stale
    gcTime: 1000 * 60 * 60, // 1 hour cache time
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
  });
}

export function useStudentSearch(students: Student[], searchTerm: string) {
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.programme.toLowerCase().includes(search) ||
      student.degree.toLowerCase().includes(search) ||
      student.idNumber.toLowerCase().includes(search) ||
      (student.email && student.email.toLowerCase().includes(search))
    );
  });

  return filteredStudents;
}