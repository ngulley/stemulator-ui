import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Labs from "./pages/Labs";
import LabDetail from "./pages/LabDetail";
import PrivateRoute from "./components/PrivateRoute";
import { useEffect } from "react";
import { startHealthPolling, stopHealthPolling } from "./services/healthCheck";

function App() {
  // Silent health monitoring — logs only, nothing user-facing
  useEffect(() => {
    startHealthPolling();
    return stopHealthPolling;
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public — login / sign-up landing */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected — require an active session */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <Courses />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <PrivateRoute>
              <CourseDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/labs"
          element={
            <PrivateRoute>
              <Labs />
            </PrivateRoute>
          }
        />
        <Route
          path="/labs/:labId"
          element={
            <PrivateRoute>
              <LabDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/about"
          element={
            <PrivateRoute>
              <div>About</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
