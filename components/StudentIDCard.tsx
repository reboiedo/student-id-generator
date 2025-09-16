import React from "react";
import BulkStudentIDCards from "./BulkStudentIDCards";
import { Student } from "@/types/student";

interface StudentIDCardProps {
  student: Student;
  imageDataUrl?: string | null;
}

const StudentIDCard: React.FC<StudentIDCardProps> = ({ student, imageDataUrl }) => {
  const imageDataUrls = { [String(student.id)]: imageDataUrl || null };
  return <BulkStudentIDCards students={[student]} imageDataUrls={imageDataUrls} />;
};

export default StudentIDCard;
