"use client";

import { Student } from "@/types/student";
import { useState } from "react";
import CSVUploadFilter from "./CSVUploadFilter";
import OptimizedAvatar from "./OptimizedAvatar";

interface StudentListProps {
  students: Student[];
  tempSelectedIds: Set<string>;
  onTempToggleSelection: (studentId: string) => void;
  onAddStudent: (studentId: string) => void;
  onAddSelectedStudents: () => void;
  onSelectAllVisible: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  startDateFilter: string;
  onStartDateFilterChange: (date: string) => void;
  isLoading?: boolean;
  csvStudentIds: Set<string>;
  onCsvUpload: (studentIds: Set<string>) => void;
  onClearCsv: () => void;
  csvFilterActive: boolean;
}

export default function StudentList({
  students,
  tempSelectedIds,
  onTempToggleSelection,
  onAddStudent,
  onAddSelectedStudents,
  onSelectAllVisible,
  searchTerm,
  onSearchChange,
  startDateFilter,
  onStartDateFilterChange,
  isLoading = false,
  csvStudentIds,
  onCsvUpload,
  onClearCsv,
  csvFilterActive
}: StudentListProps) {
  const [filterProgramme, setFilterProgramme] = useState<string>("");
  const [filterCampus, setFilterCampus] = useState<string>("");
  
  const programmes = Array.from(new Set(students.map(s => s.programme).filter(Boolean)));
  const campuses = Array.from(new Set(students.map(s => s.campus).filter(Boolean)));
  
  const filteredStudents = students.filter((student) => {
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.programme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProgramme = !filterProgramme || student.programme === filterProgramme;
    const matchesCampus = !filterCampus || student.campus === filterCampus;
    
    return matchesSearch && matchesProgramme && matchesCampus;
  });

  const hasSelectedStudents = tempSelectedIds.size > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">All Students</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Available Students ({filteredStudents.length})</h2>
          {csvFilterActive && (
            <p className="text-sm text-purple-600 mt-1">
              Showing students from CSV • {csvStudentIds.size} IDs uploaded
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filteredStudents.length > 0 && (
            <button
              onClick={onSelectAllVisible}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select All Visible
            </button>
          )}
          {hasSelectedStudents && (
            <button
              onClick={onAddSelectedStudents}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Selected ({tempSelectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* CSV Upload Filter */}
      <CSVUploadFilter
        csvStudentIds={csvStudentIds}
        onCsvUpload={onCsvUpload}
        onClearCsv={onClearCsv}
        isActive={csvFilterActive}
      />

      {/* Search and Filter Controls */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-600"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          >
            <option value="">All Programmes</option>
            {programmes.map(programme => (
              <option key={programme} value={programme}>{programme}</option>
            ))}
          </select>

          <select
            value={filterCampus}
            onChange={(e) => setFilterCampus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          >
            <option value="">All Campuses</option>
            {campuses.map(campus => (
              <option key={campus} value={campus}>{campus}</option>
            ))}
          </select>
          
          <div className="relative">
            <input
              type="month"
              value={startDateFilter}
              onChange={(e) => onStartDateFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              title="Show students arriving in or after this month"
              placeholder="YYYY-MM"
            />
            {startDateFilter && (
              <button
                onClick={() => onStartDateFilterChange("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear month filter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {startDateFilter && (
          <div className="text-xs text-gray-700 px-1">
            Showing students arriving in or after {new Date(startDateFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
        {filteredStudents.length === 0 ? (
          <div className="p-4 text-center text-gray-700">
            {csvFilterActive 
              ? 'No students found matching the CSV Student IDs' 
              : (searchTerm || filterProgramme || filterCampus ? 'No students match your filters' : 'No available students')
            }
          </div>
        ) : (
          <div className="space-y-0">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  tempSelectedIds.has(String(student.id)) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={tempSelectedIds.has(String(student.id))}
                      onChange={() => onTempToggleSelection(String(student.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <OptimizedAvatar
                      src={student.photoUrl}
                      alt={student.name}
                      size={40}
                      className="w-10 h-10 rounded-full overflow-hidden"
                    />
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{student.name}</p>
                      <p className="text-sm text-gray-700 truncate">
                        {student.degree} • {student.programme}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <span>ID: {student.idNumber}</span>
                        {student.arrivalDate && (
                          <>
                            <span>•</span>
                            <span title="Arrival Date">
                              📅 {new Date(student.arrivalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onAddStudent(String(student.id))}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1 flex-shrink-0 ml-2"
                    title="Add student"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 text-sm text-gray-700 text-center">
        Use checkboxes to select multiple students, then click "Add Selected" or click individual "Add" buttons
      </div>
    </div>
  );
}