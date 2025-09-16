"use client";

import { useState } from "react";
import StudentSelector from "@/components/StudentSelector";
import StaffManager from "@/components/StaffManager";
import ApiTest from "@/components/ApiTest";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mode, setMode] = useState<"student" | "staff">("student");
  const [showApiTest, setShowApiTest] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-gray-50">
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">ID Card Generator</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowApiTest(!showApiTest)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                API Test
              </button>
              <div className="flex rounded-lg shadow-sm">
                <button
                  onClick={() => setMode("student")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                    mode === "student"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Student IDs
                </button>
                <button
                  onClick={() => setMode("staff")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r ${
                    mode === "staff"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Staff IDs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {showApiTest ? (
          <ApiTest />
        ) : mode === "student" ? (
          <StudentSelector />
        ) : (
          <StaffManager />
        )}
      </div>
    </div>
  );
}
