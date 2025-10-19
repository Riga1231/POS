import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthorized } = useAuth();
  return isAuthorized ? children : null;
};

export default ProtectedRoute;
