
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import api from "./api/client";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EmployeeDetails from "./pages/EmployeeDetails";
import Compensation from "./pages/Compensation";

import "./styles/dashboard.css";

function ProtectedLayout({ user, onLogout }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="topbar">
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout}>Logout</button>
        </div>

        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/employees"
            element={<Employees />}
          />

          <Route
            path="/employees/new"
            element={<AddEmployee />}
          />

          <Route
            path="/employees/:id"
            element={<EmployeeDetails />}
          />

          <Route
            path="/compensation"
            element={<Compensation />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const response = await api.get("auth/me/");
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuthentication();
  }, []);

  async function handleLogout() {
    try {
      await api.get("auth/csrf/");
      await api.post("auth/logout/");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (checkingAuth) {
    return <p>Checking authentication...</p>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/" replace />
              : <Login onLogin={setUser} />
          }
        />

        <Route
          path="/*"
          element={
            <ProtectedLayout
              user={user}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
