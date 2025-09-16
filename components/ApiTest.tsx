"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Student } from "@/types/student";

interface ApiTestResult {
  success: boolean;
  message: string;
  studentCount?: number;
  sampleStudent?: Student | null;
}

export default function ApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);

  const testApi = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const connectionTest = await apiClient.testConnection();
      
      if (connectionTest.success) {
        const students = await apiClient.getStudents();
        setResult({
          success: true,
          message: "API connection successful!",
          studentCount: students.length,
          sampleStudent: students[0] || null,
        });
      } else {
        setResult(connectionTest);
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
      
      <button
        onClick={testApi}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          isLoading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Testing Connection..." : "Test API Connection"}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-md ${
          result.success 
            ? "bg-green-50 border border-green-200" 
            : "bg-red-50 border border-red-200"
        }`}>
          <div className={`font-medium ${
            result.success ? "text-green-800" : "text-red-800"
          }`}>
            {result.success ? "✅ Success" : "❌ Failed"}
          </div>
          <p className={`mt-2 text-sm ${
            result.success ? "text-green-700" : "text-red-700"
          }`}>
            {result.message}
          </p>

          {result.success && result.studentCount !== undefined && (
            <div className="mt-3 text-sm text-gray-700">
              <p><strong>Students found:</strong> {result.studentCount}</p>
              
              {result.sampleStudent && (
                <div className="mt-2">
                  <p><strong>Sample student:</strong></p>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.sampleStudent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</p>
        <p><strong>Token:</strong> {process.env.NEXT_PUBLIC_API_TOKEN ? 'Configured' : 'Not configured'}</p>
      </div>
    </div>
  );
}