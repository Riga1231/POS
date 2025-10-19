import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  const grantAccess = () => setIsAuthorized(true);
  const revokeAccess = () => setIsAuthorized(false);

  return (
    <AuthContext.Provider value={{ isAuthorized, grantAccess, revokeAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
