import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DiagramDetail from "./pages/DiagramDetail";
import SharedDiagram from "./pages/SharedDiagram";
import Pricing from "./pages/Pricing";
import { UserProvider } from "./hooks/useUser";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";

export default function App() {
  const ThemeProviderAny = ThemeProvider as any;
  return (
    <ThemeProviderAny attribute="class" defaultTheme="dark">
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>

            <Route path="/share/:token" element={<SharedDiagram />} />
            <Route path="/pricing" element={<Pricing />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/diagram/:id" element={<DiagramDetail />} />
            </Route>
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProviderAny>
  );
}
