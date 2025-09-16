"use client";

import { useState, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { Student } from "@/types/student";
import { useStudents } from "@/hooks/useStudents";
import StudentList from "./StudentList";
import SelectedStudents from "./SelectedStudents";
import StudentIDCard from "./StudentIDCard";
import BulkStudentIDCards from "./BulkStudentIDCards";
import { convertStudentImageForPDF } from "@/lib/imageUtils";

export default function StudentSelector() {
  const { data: allStudents = [], isLoading, error } = useStudents();
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set()); // For right-side checkboxes
  const [customExpirationDates, setCustomExpirationDates] = useState<{ [studentId: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [csvStudentIds, setCsvStudentIds] = useState<Set<string>>(new Set());
  const [csvFilterActive, setCsvFilterActive] = useState(false);

  const selectedStudents = useMemo(() => {
    return allStudents.filter(student => selectedStudentIds.has(String(student.id)));
  }, [allStudents, selectedStudentIds]);

  const filteredStudents = useMemo(() => {
    // First, exclude already selected students
    let availableStudents = allStudents.filter(
      student => !selectedStudentIds.has(String(student.id))
    );

    // Apply CSV filter if active - only show students whose ID is in the CSV
    if (csvFilterActive && csvStudentIds.size > 0) {
      availableStudents = availableStudents.filter(student => 
        csvStudentIds.has(student.idNumber)
      );
    }

    // Apply month/year filter - show students arriving in or after selected month
    if (startDateFilter) {
      const [filterYear, filterMonth] = startDateFilter.split('-').map(Number);
      availableStudents = availableStudents.filter(student => {
        if (!student.arrivalDate) return true; // Include students without arrival date
        
        const studentDate = new Date(student.arrivalDate);
        const studentYear = studentDate.getFullYear();
        const studentMonth = studentDate.getMonth() + 1; // getMonth() returns 0-11
        
        // Compare year first, then month
        if (studentYear > filterYear) return true;
        if (studentYear === filterYear && studentMonth >= filterMonth) return true;
        return false;
      });
    }

    // Then apply search filter
    if (!searchTerm) return availableStudents;
    
    const search = searchTerm.toLowerCase();
    return availableStudents.filter(student =>
      student.name.toLowerCase().includes(search) ||
      student.programme.toLowerCase().includes(search) ||
      student.degree.toLowerCase().includes(search) ||
      student.idNumber.toLowerCase().includes(search) ||
      (student.email && student.email.toLowerCase().includes(search))
    );
  }, [allStudents, searchTerm, selectedStudentIds, startDateFilter, csvFilterActive, csvStudentIds]);

  // Handle temporary checkbox selections on right side
  const handleTempToggleSelection = (studentId: string) => {
    const newTempSelected = new Set(tempSelectedIds);
    if (newTempSelected.has(studentId)) {
      newTempSelected.delete(studentId);
    } else {
      newTempSelected.add(studentId);
    }
    setTempSelectedIds(newTempSelected);
  };

  // Add individual student to left side
  const handleAddStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    newSelected.add(studentId);
    setSelectedStudentIds(newSelected);
    
    // Remove from temp selection
    const newTempSelected = new Set(tempSelectedIds);
    newTempSelected.delete(studentId);
    setTempSelectedIds(newTempSelected);
  };

  // Add multiple selected students to left side
  const handleAddSelectedStudents = () => {
    const newSelected = new Set([...selectedStudentIds, ...tempSelectedIds]);
    setSelectedStudentIds(newSelected);
    setTempSelectedIds(new Set()); // Clear temp selections
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
    setCustomExpirationDates({});
  };

  const handleRemoveStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    newSelected.delete(studentId);
    setSelectedStudentIds(newSelected);
    
    // Also remove custom expiration date for this student
    const newCustomDates = { ...customExpirationDates };
    delete newCustomDates[studentId];
    setCustomExpirationDates(newCustomDates);
  };

  const handleExpirationDateChange = (studentId: string, date: string) => {
    setCustomExpirationDates(prev => ({
      ...prev,
      [studentId]: date
    }));
  };

  const handleCsvUpload = (studentIds: Set<string>) => {
    setCsvStudentIds(studentIds);
    setCsvFilterActive(true);
  };

  const handleClearCsv = () => {
    setCsvStudentIds(new Set());
    setCsvFilterActive(false);
  };

  const handleSelectAllVisible = () => {
    const visibleStudentIds = new Set(filteredStudents.map(student => String(student.id)));
    setTempSelectedIds(visibleStudentIds);
  };

  const handleGenerateCards = async () => {
    if (selectedStudents.length === 0) return;

    setIsGenerating(true);
    try {
      // Create students with custom expiration dates
      const studentsWithCustomDates = selectedStudents.map(student => ({
        ...student,
        expirationDate: customExpirationDates[String(student.id)] || student.expirationDate
      }));

      if (selectedStudents.length === 1) {
        // Convert single student image
        const imageDataUrl = await convertStudentImageForPDF(selectedStudents[0].photoUrl);
        
        // Generate single PDF
        const blob = await pdf(
          <StudentIDCard student={studentsWithCustomDates[0]} imageDataUrl={imageDataUrl} />
        ).toBlob();
        
        saveAs(
          blob,
          `${selectedStudents[0].name.replace(/\s+/g, "_")}_StudentID.pdf`
        );
      } else {
        // Convert all student images
        const imageDataUrls: { [studentId: string]: string | null } = {};
        
        await Promise.all(
          selectedStudents.map(async (student) => {
            const dataUrl = await convertStudentImageForPDF(student.photoUrl);
            imageDataUrls[String(student.id)] = dataUrl;
          })
        );
        
        // Generate bulk PDF with all cards
        const blob = await pdf(
          <BulkStudentIDCards students={studentsWithCustomDates} imageDataUrls={imageDataUrls} />
        ).toBlob();
        
        saveAs(blob, `Harbour_Space_Student_IDs_Bulk_${selectedStudents.length}_cards.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };


  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">API Connection Error</h3>
              <p className="text-red-700 mt-1">{(error as Error).message}</p>
              <p className="text-sm text-red-600 mt-2">Use the API Test button in the top bar to diagnose.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Dual List Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Side: Selected Students */}
          <div className="flex flex-col min-h-0">
            <SelectedStudents
              students={selectedStudents}
              onRemoveStudent={handleRemoveStudent}
              onClearAll={handleDeselectAll}
              onGenerateCards={handleGenerateCards}
              isGenerating={isGenerating}
              customExpirationDates={customExpirationDates}
              onExpirationDateChange={handleExpirationDateChange}
            />
          </div>

          {/* Right Side: All Students */}
          <div className="flex flex-col min-h-0">
            <StudentList
              students={filteredStudents}
              tempSelectedIds={tempSelectedIds}
              onTempToggleSelection={handleTempToggleSelection}
              onAddStudent={handleAddStudent}
              onAddSelectedStudents={handleAddSelectedStudents}
              onSelectAllVisible={handleSelectAllVisible}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              startDateFilter={startDateFilter}
              onStartDateFilterChange={setStartDateFilter}
              isLoading={isLoading}
              csvStudentIds={csvStudentIds}
              onCsvUpload={handleCsvUpload}
              onClearCsv={handleClearCsv}
              csvFilterActive={csvFilterActive}
            />
          </div>
      </div>
    </div>
  );
}