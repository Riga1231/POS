import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RouteAuthHandler = () => {
  const { isAuthorized, revokeAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    console.log(
      "🔄 Route changed from:",
      previousPath.current,
      "to:",
      location.pathname,
      "Authorized:",
      isAuthorized
    );

    // If trying to access backoffice without authorization
    if (location.pathname === "/backoffice" && !isAuthorized) {
      console.log("🚫 Unauthorized access to backoffice - redirecting to /");
      navigate("/", { replace: true });
    }

    // If LEAVING backoffice (was on backoffice, now going somewhere else), revoke access
    if (
      previousPath.current === "/backoffice" &&
      location.pathname !== "/backoffice" &&
      isAuthorized
    ) {
      console.log("🏃 LEAVING backoffice - revoking access");
      revokeAccess();
    }

    // Update previous path
    previousPath.current = location.pathname;
  }, [location.pathname, isAuthorized, navigate, revokeAccess]);

  return null;
};

export default RouteAuthHandler;
