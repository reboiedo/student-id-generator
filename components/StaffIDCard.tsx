import React from "react";
import BulkStaffIDCards from "./BulkStaffIDCards";
import { Staff } from "@/types/staff";

interface StaffIDCardProps {
  staff: Staff;
  imageDataUrl?: string | null;
}

const StaffIDCard: React.FC<StaffIDCardProps> = ({ staff, imageDataUrl }) => {
  const imageDataUrls = { [staff.id]: imageDataUrl || null };
  return <BulkStaffIDCards staffList={[staff]} imageDataUrls={imageDataUrls} />;
};

export default StaffIDCard;
