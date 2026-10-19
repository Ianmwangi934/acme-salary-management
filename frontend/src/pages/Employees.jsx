
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import api from "../api/client";
import "../styles/employees.css";

const PAGE_SIZE = 20;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("employees/departments/")
      .then((response) => {
        const data = response.data;
        setDepartments(
          Array.isArray(data) ? data : data.results ?? []
        );
      })
      .catch(() => setError("Unable to load departments."));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadEmployees = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("employees/", {
        params: {
          page,
          search: search || undefined,
          department: department || undefined,
          country: country || undefined,
          employment_status: status || undefined,
        },
        signal,
      });

      const data = response.data;

      if (Array.isArray(data)) {
        setEmployees(data);
        setCount(data.length);
      } else {
        setEmployees(data.results ?? []);
        setCount(data.count ?? 0);
      }
    } catch (err) {
      if (err.code !== "ERR_CANCELED") {
        setError(
          err.response?.data?.detail ||
          "Unable to load employees."
        );
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, search, department, country, status]);

  useEffect(() => {
    const controller = new AbortController();
    loadEmployees(controller.signal);

    return () => controller.abort();
  }, [loadEmployees]);

  const totalPages = Math.max(
    1,
    Math.ceil(count / PAGE_SIZE)
  );

  function resetPage(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="employees-page">
      <header className="employees-header">
        <div>
          <span className="section-eyebrow">
            WORKFORCE MANAGEMENT
          </span>
          <h1>Employees</h1>
          <p>
            Manage your workforce, employee records,
            and compensation.
          </p>
        </div>

        <Link to="/employees/new" className="primary-action">
          <Plus size={18} />
          Add Employee
        </Link>
      </header>

      <section className="employee-panel">
        <div className="employee-panel-heading">
          <div>
            <h2>Employee Directory</h2>
            <p>
              {count.toLocaleString()} employees found
            </p>
          </div>

          <button
            className="icon-action"
            onClick={() => {
              const controller = new AbortController();
              loadEmployees(controller.signal);
            }}
            aria-label="Refresh employees"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="employee-filters">
          <div className="employee-search">
            <Search size={18} />
            <input
              aria-label="Search employees"
              placeholder="Search name, ID, email, job title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter by department"
            value={department}
            onChange={(e) =>
              resetPage(setDepartment, e.target.value)
            }
          >
            <option value="">All Departments</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by country"
            value={country}
            onChange={(e) =>
              resetPage(setCountry, e.target.value)
            }
          >
            <option value="">All Countries</option>
            {["BR", "DE", "GB", "IN", "JP", "KE", "KW", "RU", "US"]
              .map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
          </select>

          <select
            aria-label="Filter by employment status"
            value={status}
            onChange={(e) =>
              resetPage(setStatus, e.target.value)
            }
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {error && (
          <div className="employee-error" role="alert">
            {error}
          </div>
        )}

        <div className="employee-table-scroll">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Country</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-message">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-message">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="employee-identity">
                        <span className="employee-avatar">
                          {employee.first_name?.[0]}
                          {employee.last_name?.[0]}
                        </span>

                        <div>
                          <strong>
                            {employee.full_name ||
                              `${employee.first_name} ${employee.last_name}`}
                          </strong>
                          <small>{employee.email}</small>
                        </div>
                      </div>
                    </td>

                    <td>{employee.employee_id}</td>
                    <td>{employee.department_name}</td>
                    <td>{employee.job_title}</td>
                    <td>{employee.country}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          employee.employment_status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {employee.employment_status}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="table-link"
                        to={`/employees/${employee.id}`}
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="employee-pagination">
          <span>
            Page {page} of {totalPages}
          </span>

          <div>
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
