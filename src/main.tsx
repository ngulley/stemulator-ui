import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.tsx";
import { logger } from "./services/logger";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

if (!googleClientId) {
  logger.warn(
    "VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will be unavailable.",
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Fall back to a non-empty placeholder so Google's gsi/client library
        doesn't throw on an empty client_id string (which blanks the page). */}
    <GoogleOAuthProvider clientId={googleClientId ?? "not-configured"}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
