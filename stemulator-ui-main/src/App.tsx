import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Labs from "./pages/Labs";
import LabDetail from "./pages/LabDetail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/labs/:labId" element={<LabDetail />} />
        <Route path="/about" element={<div>About</div>} />
      </Routes>
    </Router>
  );
}

export default App;
