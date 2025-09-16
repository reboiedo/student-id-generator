"use client";

import { useState, useRef } from "react";

interface CSVUploadFilterProps {
  csvStudentIds: Set<string>;
  onCsvUpload: (studentIds: Set<string>) => void;
  onClearCsv: () => void;
  isActive: boolean;
}

export default function CSVUploadFilter({
  csvStudentIds,
  onCsvUpload,
  onClearCsv,
  isActive
}: CSVUploadFilterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("Please select a CSV file");
      return;
    }

    setIsProcessing(true);
    setError("");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const studentIds = parseCSV(text);
        onCsvUpload(studentIds);
        setIsProcessing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error processing CSV file");
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError("Error reading file");
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string): Set<string> => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    const studentIds = new Set<string>();
    
    // Try to detect which column contains student IDs
    const headers = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim().toLowerCase());
    let idColumnIndex = headers.findIndex(h => 
      h.includes('id') || h.includes('student') || h.includes('number')
    );
    
    // If no obvious column found, assume first column
    if (idColumnIndex === -1) {
      idColumnIndex = 0;
    }

    // Process data rows (skip header if it looks like a header)
    const hasHeader = isNaN(Number(lines[0].split(',')[idColumnIndex]?.replace(/['"]/g, '').trim()));
    const dataStartIndex = hasHeader ? 1 : 0;
    
    for (let i = dataStartIndex; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length > idColumnIndex) {
        const studentId = columns[idColumnIndex].replace(/['"]/g, '').trim();
        if (studentId) {
          studentIds.add(studentId);
        }
      }
    }

    if (studentIds.size === 0) {
      throw new Error("No valid Student IDs found in CSV");
    }

    return studentIds;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClearFilter = () => {
    onClearCsv();
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mb-4">
      {!isActive ? (
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragging 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            id="csv-upload"
          />
          
          <div className="flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          {isProcessing ? (
            <div className="text-purple-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto mb-2"></div>
              Processing CSV...
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Filter by Student IDs from CSV</strong>
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Drop a CSV file here or{" "}
                <label htmlFor="csv-upload" className="text-purple-600 hover:text-purple-700 cursor-pointer underline">
                  browse files
                </label>
              </p>
              <p className="text-xs text-gray-400">
                CSV should contain Student ID column (auto-detected)
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-purple-800">
                CSV Filter Active
              </span>
              <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                {csvStudentIds.size} IDs
              </span>
            </div>
            <button
              onClick={handleClearFilter}
              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}