
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Building2,
  Globe2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import api from "../api/client";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [overviewRes, departmentsRes, countriesRes] =
          await Promise.all([
            api.get("analytics/overview/"),
            api.get("analytics/departments/"),
            api.get("analytics/countries/"),
          ]);

        setOverview(overviewRes.data);
        setDepartments(departmentsRes.data);
        setCountries(countriesRes.data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Unable to load dashboard analytics."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p role="alert" className="error">{error}</p>;
  }

  const departmentData = (
    Array.isArray(departments)
        ? departments
        : departments?.results || []
    ).map((item) => ({
    department: item.department__name,
    employee_count: item.employee_count,
    }));

  const countryData = Array.isArray(countries)
    ? countries
    : countries?.results || [];

  const stats = [
    {
      label: "Total Employees",
      value: overview?.total_employees ?? 0,
      icon: Users,
    },
    {
      label: "Active Employees",
      value: overview?.active_employees ?? 0,
      icon: UserCheck,
    },
    {
      label: "Departments",
      value: overview?.total_departments ?? 0,
      icon: Building2,
    },
    {
      label: "Countries",
      value: overview?.total_countries ?? 0,
      icon: Globe2,
    },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Workforce Dashboard</h1>
        <p>ACME employee and compensation analytics</p>
      </header>

      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">
              <Icon size={22} />
            </div>
            <p>{label}</p>
            <h2>{Number(value).toLocaleString()}</h2>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        
        <section className="chart-card">
        <div className="chart-heading">
            <h2>Employees by Department</h2>
            <p>Workforce distribution across departments</p>
        </div>

        <div className="chart-container department-chart">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 15, bottom: 5 }}
            >
                <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e8edf5"
                />

                <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 12 }}
                />

                <YAxis
                type="category"
                dataKey="department"
                width={125}
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                />

                <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                formatter={(value) => [
                    Number(value).toLocaleString(),
                    "Employees",
                ]}
                />

                <Bar
                dataKey="employee_count"
                fill="#4f6ef7"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                />
            </BarChart>
            </ResponsiveContainer>
        </div>
        </section>


        <section className="chart-card">
          <h2>Employees by Country</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="employee_count" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
