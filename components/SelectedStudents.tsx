"use client";

import { Student } from "@/types/student";
import OptimizedAvatar from "./OptimizedAvatar";

interface SelectedStudentsProps {
  students: Student[];
  onRemoveStudent: (studentId: string) => void;
  onClearAll: () => void;
  onGenerateCards: () => void;
  isGenerating?: boolean;
  customExpirationDates: { [studentId: string]: string };
  onExpirationDateChange: (studentId: string, date: string) => void;
  imageRefreshKeys: { [studentId: string]: number };
  refreshingImages: Set<string>;
  onRefreshImage: (studentId: string) => void;
}

export default function SelectedStudents({
  students,
  onRemoveStudent,
  onClearAll,
  onGenerateCards,
  isGenerating = false,
  customExpirationDates,
  onExpirationDateChange,
  imageRefreshKeys,
  refreshingImages,
  onRefreshImage
}: SelectedStudentsProps) {
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Selected Students ({students.length})</h2>
        {students.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected Students List */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md mb-4">
        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-700">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="font-medium">No students selected</p>
            <p className="text-sm mt-1">Select students from the list on the right to generate ID cards</p>
          </div>
        ) : (
          <div className="space-y-0">
            {students.map((student, index) => (
              <div
                key={student.id}
                className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >                
                <div className="flex items-center gap-3">
                  {/* Photo */}
                  <div className="relative">
                    <OptimizedAvatar
                      src={student.photoUrl}
                      alt={student.name}
                      size={40}
                      className="w-10 h-10 rounded-full overflow-hidden"
                      refreshKey={imageRefreshKeys[String(student.id)]}
                    />
                    <button
                      onClick={() => onRefreshImage(String(student.id))}
                      disabled={refreshingImages.has(String(student.id))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                      title="Refresh photo"
                    >
                      {refreshingImages.has(String(student.id)) ? (
                        <div className="w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Student Data */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-sm text-gray-700 truncate">
                      {student.degree} • {student.programme}
                    </p>
                    <p className="text-xs text-gray-700">ID: {student.idNumber}</p>
                  </div>
                  
                  {/* Expiration Date Input */}
                  <div className="flex-shrink-0 w-32">
                    <label className="text-xs text-gray-700 block mb-1">Expiration:</label>
                    <input
                      type="text"
                      value={customExpirationDates[String(student.id)] || ""}
                      onChange={(e) => onExpirationDateChange(String(student.id), e.target.value)}
                      placeholder={student.expirationDate}
                      className="w-full px-2 py-1 text-xs text-gray-900 placeholder-gray-600 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      title="Leave empty to use calculated date"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveStudent(String(student.id))}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-2"
                    title="Remove student"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onGenerateCards}
          disabled={students.length === 0 || isGenerating}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            students.length === 0 || isGenerating
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 transform hover:scale-[1.02] shadow-lg"
          }`}
        >
          {isGenerating 
            ? "Generating PDF..." 
            : `Generate ${students.length} ID Card${students.length !== 1 ? 's' : ''}`
          }
        </button>
        
        {students.length > 0 && (
          <div className="text-xs text-gray-700 text-center">
            {students.length === 1 
              ? "1 student selected for ID card generation"
              : `${students.length} students selected for bulk ID card generation`
            }
          </div>
        )}
      </div>
    </div>
  );
}