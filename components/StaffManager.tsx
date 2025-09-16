"use client";

import { useState, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { Staff } from "@/types/staff";
import BulkStaffIDCards from "./BulkStaffIDCards";

export default function StaffManager() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const manualPhotoInputRef = useRef<HTMLInputElement>(null);
  
  // Manual form state
  const [manualForm, setManualForm] = useState({
    name: "",
    staffId: "",
    photoFile: null as File | null
  });

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
        const staffData = parseCSV(text);
        setStaffList(staffData);
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

  const parseCSV = (csvText: string): Staff[] => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    const staffData: Staff[] = [];
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim().toLowerCase());
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const idIndex = headers.findIndex(h => h.includes('id') || h.includes('staff'));
    
    if (nameIndex === -1 || idIndex === -1) {
      throw new Error("CSV must contain 'name' and 'id' columns");
    }

    // Process data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.replace(/['"]/g, '').trim());
      
      if (columns.length > Math.max(nameIndex, idIndex)) {
        const name = columns[nameIndex];
        const staffId = columns[idIndex];
        
        if (name && staffId) {
          staffData.push({
            id: `staff-${i}`,
            name,
            staffId,
            issueDate: new Date().toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: '2-digit' 
            }).replace(/\//g, '/')
          });
        }
      }
    }

    if (staffData.length === 0) {
      throw new Error("No valid staff data found in CSV");
    }

    return staffData;
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

  const handlePhotoUpload = (staffId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setStaffList(prev => prev.map(staff => 
        staff.id === staffId 
          ? { ...staff, photoDataUrl: dataUrl }
          : staff
      ));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSelect = (staffId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(staffId, file);
    }
  };

  const removePhoto = (staffId: string) => {
    setStaffList(prev => prev.map(staff => 
      staff.id === staffId 
        ? { ...staff, photoDataUrl: undefined }
        : staff
    ));
    
    // Reset the file input
    if (photoInputRefs.current[staffId]) {
      photoInputRefs.current[staffId]!.value = "";
    }
  };

  const addManualStaff = () => {
    if (!manualForm.name.trim() || !manualForm.staffId.trim()) {
      setError("Name and Staff ID are required");
      return;
    }

    // Check for duplicate staff ID
    if (staffList.some(staff => staff.staffId === manualForm.staffId.trim())) {
      setError("Staff ID already exists");
      return;
    }

    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: manualForm.name.trim(),
      staffId: manualForm.staffId.trim(),
      issueDate: new Date().toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: '2-digit' 
      }).replace(/\//g, '/')
    };

    // Add photo if selected
    if (manualForm.photoFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setStaffList(prev => [...prev, { ...newStaff, photoDataUrl: dataUrl }]);
      };
      reader.readAsDataURL(manualForm.photoFile);
    } else {
      setStaffList(prev => [...prev, newStaff]);
    }

    // Reset form
    setManualForm({ name: "", staffId: "", photoFile: null });
    if (manualPhotoInputRef.current) {
      manualPhotoInputRef.current.value = "";
    }
    setError("");
  };

  const handleManualPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setManualForm(prev => ({ ...prev, photoFile: file }));
    }
  };

  const removeStaff = (staffId: string) => {
    setStaffList(prev => prev.filter(staff => staff.id !== staffId));
    // Clean up photo input ref
    delete photoInputRefs.current[staffId];
  };

  const handlePhotoDrop = (staffId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handlePhotoUpload(staffId, files[0]);
    }
  };

  const generateBulkPDF = async () => {
    setIsGenerating(true);
    try {
      const staffWithPhotos = staffList.filter(s => s.photoDataUrl);
      
      if (staffWithPhotos.length === 0) {
        setError("No staff members with photos to generate");
        return;
      }

      // Create imageDataUrls object
      const imageDataUrls: { [staffId: string]: string | null } = {};
      staffWithPhotos.forEach(staff => {
        imageDataUrls[staff.id] = staff.photoDataUrl || null;
      });

      const doc = <BulkStaffIDCards staffList={staffWithPhotos} imageDataUrls={imageDataUrls} />;
      const blob = await pdf(doc).toBlob();
      saveAs(blob, `Harbour_Space_Staff_IDs_Bulk_${staffWithPhotos.length}_cards.pdf`);
    } catch (error) {
      console.error("Error generating bulk PDF:", error);
      setError("Failed to generate bulk PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearData = () => {
    setStaffList([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const staffWithPhotos = staffList.filter(s => s.photoDataUrl);

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Staff ID Generator</h2>
      
      {/* Manual Add Form - Always visible */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Add Staff Member</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={manualForm.name}
              onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              placeholder="Enter staff name"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
            <input
              type="text"
              value={manualForm.staffId}
              onChange={(e) => setManualForm(prev => ({ ...prev, staffId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              placeholder="Enter staff ID"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            {manualForm.photoFile ? (
              <div className="flex items-center gap-3">
                <img 
                  src={URL.createObjectURL(manualForm.photoFile)} 
                  alt="Preview"
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                />
                <span className="text-green-600 text-sm">Photo selected</span>
                <button
                  onClick={() => {
                    setManualForm(prev => ({ ...prev, photoFile: null }));
                    if (manualPhotoInputRef.current) {
                      manualPhotoInputRef.current.value = "";
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Remove photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-purple-500 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0 && files[0].type.startsWith('image/')) {
                    setManualForm(prev => ({ ...prev, photoFile: files[0] }));
                  }
                }}
              >
                <input
                  ref={manualPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleManualPhotoSelect}
                  className="hidden"
                  id="manual-photo-upload"
                />
                <label 
                  htmlFor="manual-photo-upload"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">Upload Photo</span>
                </label>
              </div>
            )}
          </div>
          
          <button
            onClick={addManualStaff}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* CSV Upload Section - Optional */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-6 ${
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
        
        <div className="flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        {isProcessing ? (
          <div className="text-purple-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto mb-2"></div>
            Processing CSV...
          </div>
        ) : (
          <>
            <p className="font-medium text-gray-700 mb-1">
              Or Upload Staff CSV (Optional)
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Drop a CSV file here or{" "}
              <label htmlFor="csv-upload" className="text-purple-600 hover:text-purple-700 cursor-pointer underline">
                browse files
              </label>
            </p>
            <p className="text-xs text-gray-400">
              CSV should contain columns: Name, Staff ID
            </p>
          </>
        )}
      </div>

      {staffList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {staffList.length} staff members loaded
              </span>
              <span className="text-sm text-gray-600">
                {staffWithPhotos.length} photos uploaded
              </span>
            </div>
            <div className="flex gap-2">
              {staffWithPhotos.length > 0 && (
                <button
                  onClick={generateBulkPDF}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Generating..." : `Generate Bulk PDF (${staffWithPhotos.length} cards)`}
                </button>
              )}
              <button
                onClick={clearData}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {staffList.map((staff) => (
              <div key={staff.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-sm text-gray-500">Staff ID: {staff.staffId}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {staff.photoDataUrl ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={staff.photoDataUrl} 
                          alt={staff.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-sm">Photo uploaded</span>
                          <button
                            onClick={() => removePhoto(staff.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-purple-500 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handlePhotoDrop(staff.id, e)}
                      >
                        <input
                          ref={el => photoInputRefs.current[staff.id] = el}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoSelect(staff.id, e)}
                          className="hidden"
                          id={`photo-${staff.id}`}
                        />
                        <label 
                          htmlFor={`photo-${staff.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Upload Photo</span>
                        </label>
                      </div>
                    )}
                    
                    {/* Remove Staff Button - separate with clear visual distinction */}
                    <button
                      onClick={() => removeStaff(staff.id)}
                      className="ml-4 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium text-sm border border-red-200"
                      title="Remove staff member"
                    >
                      Remove Staff
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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