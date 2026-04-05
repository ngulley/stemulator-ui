import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../services/localUsers";
import { LOGIN_ROUTE } from "../constants";

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a route so that unauthenticated users are redirected to the login page.
 * Replace `getSession()` with a real JWT/session check when backend auth lands.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const session = getSession();
  if (!session) {
    return <Navigate to={LOGIN_ROUTE} replace />;
  }
  return <>{children}</>;
};

export default PrivateRoute;
