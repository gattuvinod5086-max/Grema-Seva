import { Outlet } from "react-router";
import { useAppSession } from "@/react-app/context/AppSessionContext";
import Onboarding from "@/react-app/pages/Onboarding";

export default function AppGramaSevaLayout() {
  const { isOnboarded } = useAppSession();
  if (!isOnboarded) return <Onboarding />;
  return <Outlet />;
}
