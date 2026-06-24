import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function OrganizerRoute() {
  const { currentUser } = useAuth();
  const isOrganizer = ["organizer", "admin"].includes(currentUser?.role);
  if (!isOrganizer) return <Navigate to="/" replace />;
  return <Outlet />;
}