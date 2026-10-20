
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Search,
  RefreshCw,
  History,
  Pencil,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe2,
  Building2,
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
import "../styles/compensation.css";

const initialFilters = {
  search: "",
  department: "",
  country: "",
  currency: "",
};

function today() {
  const date = new Date();
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
}

function formatSalary(value, currency = "") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })}`.trim();
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value.slice(0, 10)}T12:00:00`)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
}

function getError(error, fallback) {
  const data = error.response?.data;

  if (typeof data?.detail === "string") return data.detail;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) =>
        `${field}: ${
          Array.isArray(messages)
            ? messages.join(" ")
            : String(messages)
        }`
      )
      .join(" ");
  }

  return fallback;
}

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.results ?? [];
}

export default function Compensation() {
  // Compensation records
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  // Analytics
  const [payrollSummary, setPayrollSummary] = useState([]);
  const [departmentAnalytics, setDepartmentAnalytics] = useState([]);
  const [countryAnalytics, setCountryAnalytics] = useState([]);
  const [analyticsCurrency, setAnalyticsCurrency] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // Shared refresh counter
  const [refreshKey, setRefreshKey] = useState(0);

  // Salary update / history dialog
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  const [salaryForm, setSalaryForm] = useState({
    new_salary: "",
    new_currency: "",
    effective_date: today(),
  });

  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyNext, setHistoryNext] = useState(false);
  const [historyPrevious, setHistoryPrevious] = useState(false);

  // Load departments, countries and currencies
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const [departmentResponse, locationResponse] =
          await Promise.all([
            api.get("employees/departments/"),
            api.get("employees/country-currency-options/"),
          ]);

        if (!active) return;

        setDepartments(normalizeList(departmentResponse.data));
        setCountries(locationResponse.data?.countries ?? []);
        setCurrencies(locationResponse.data?.currencies ?? []);
      } catch (err) {
        if (active) {
          setOptionsError(
            "Unable to load some department or location options."
          );
        }
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  // Load compensation records with server-side filters
  useEffect(() => {
    let active = true;

    async function loadRecords() {
      setLoading(true);
      setError("");

      try {
        const params = { page };

        if (filters.search) params.search = filters.search;
        if (filters.department) {
          params["employee__department"] = filters.department;
        }
        if (filters.country) {
          params["employee__country"] = filters.country;
        }
        if (filters.currency) {
          params.currency = filters.currency;
        }

        const { data } = await api.get("compensation/", {
          params,
        });

        if (!active) return;

        const results = normalizeList(data);

        setRecords(results);
        setTotalRecords(
          Array.isArray(data)
            ? data.length
            : data?.count ?? results.length
        );
        setHasNext(Boolean(data?.next));
        setHasPrevious(Boolean(data?.previous));

        if (page === 1 && results.length && data?.next) {
          setPageSize(results.length);
        }
      } catch (err) {
        if (!active) return;

        setRecords([]);
        setTotalRecords(0);
        setHasNext(false);
        setHasPrevious(false);
        setError(
          getError(err, "Unable to load compensation records.")
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      active = false;
    };
  }, [page, filters, refreshKey]);

  // Load company-wide analytics independently of table filters
  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      try {
        const [summary, departmentsResult, countriesResult] =
          await Promise.all([
            api.get("analytics/compensation-summary/"),
            api.get("analytics/compensation/departments/"),
            api.get("analytics/compensation/countries/"),
          ]);

        if (!active) return;

        setPayrollSummary(normalizeList(summary.data));
        setDepartmentAnalytics(
          normalizeList(departmentsResult.data)
        );
        setCountryAnalytics(
          normalizeList(countriesResult.data)
        );
      } catch (err) {
        if (active) {
          setAnalyticsError(
            getError(
              err,
              "Unable to load compensation analytics."
            )
          );
        }
      } finally {
        if (active) setAnalyticsLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = searchInput.trim();

      setFilters((previous) => {
        if (previous.search === search) return previous;

        setPage(1);
        return { ...previous, search };
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  function updateFilter(name, value) {
    setPage(1);
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function refreshRecords() {
    setRefreshKey((previous) => previous + 1);
  }

  // Currency-safe analytics
  const analyticsCurrencies = [
    ...new Set([
      ...payrollSummary.map((item) => item.currency),
      ...departmentAnalytics.map((item) => item.currency),
      ...countryAnalytics.map((item) => item.currency),
    ]),
  ]
    .filter(Boolean)
    .sort();

  const selectedCurrency =
    analyticsCurrencies.includes(analyticsCurrency)
      ? analyticsCurrency
      : analyticsCurrencies[0] ?? "";

  const selectedPayroll = payrollSummary.find(
    (item) => item.currency === selectedCurrency
  );

  const departmentChartData = departmentAnalytics
    .filter((item) => item.currency === selectedCurrency)
    .map((item) => ({
      department:
        item.employee__department__name || "Unassigned",
      average: Number(item.average_salary),
      employees: Number(item.employee_count),
    }))
    .sort((a, b) => b.average - a.average);

  const countryChartData = countryAnalytics
    .filter((item) => item.currency === selectedCurrency)
    .map((item) => ({
      code: item.employee__country || "Unknown",
      country:
        countries.find(
          (country) =>
            country.code === item.employee__country
        )?.name ||
        item.employee__country ||
        "Unknown",
      average: Number(item.average_salary),
      minimum: Number(item.minimum_salary),
      maximum: Number(item.maximum_salary),
      employees: Number(item.employee_count),
    }))
    .sort((a, b) => b.average - a.average);

  const totalCompanyRecords = payrollSummary.reduce(
    (total, item) =>
      total + Number(item.employee_count || 0),
    0
  );

  const totalCompanyCountries = new Set(
    countryAnalytics
      .map((item) => item.employee__country)
      .filter(Boolean)
  ).size;

  // Dialog actions
  function openUpdateModal(record) {
    setSelectedRecord(record);
    setModalType("update");
    setModalError("");

    setSalaryForm({
      new_salary: record.annual_base_salary ?? "",
      new_currency: record.currency ?? "",
      effective_date: today(),
    });
  }

  function openHistoryModal(record) {
    setSelectedRecord(record);
    setModalType("history");
    setModalError("");
    setHistoryRecords([]);
    setHistoryPage(1);
  }

  function closeModal() {
    if (saving) return;
    setModalType(null);
    setSelectedRecord(null);
    setModalError("");
  }

  // Load history when record or history page changes
  useEffect(() => {
    if (modalType !== "history" || !selectedRecord) return;

    let active = true;

    async function loadHistory() {
      setHistoryLoading(true);
      setModalError("");

      try {
        const { data } = await api.get(
          `compensation/${selectedRecord.id}/history/`,
          { params: { page: historyPage } }
        );

        if (!active) return;

        setHistoryRecords(normalizeList(data));
        setHistoryNext(Boolean(data?.next));
        setHistoryPrevious(Boolean(data?.previous));
      } catch (err) {
        if (!active) return;

        setHistoryRecords([]);
        setHistoryNext(false);
        setHistoryPrevious(false);
        setModalError(
          getError(err, "Unable to load salary history.")
        );
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [modalType, selectedRecord, historyPage]);

  // Update salary using existing backend service
  async function handleSalaryUpdate(event) {
    event.preventDefault();
    if (!selectedRecord || saving) return;

    setSaving(true);
    setModalError("");

    try {
      await api.post(
        `compensation/${selectedRecord.id}/update-salary/`,
        {
          new_salary: salaryForm.new_salary,
          new_currency: salaryForm.new_currency,
          effective_date: salaryForm.effective_date,
        }
      );

      setModalType(null);
      setSelectedRecord(null);
      refreshRecords();
    } catch (err) {
      setModalError(
        getError(err, "Unable to update salary.")
      );
    } finally {
      setSaving(false);
    }
  }

  const totalPages = pageSize
    ? Math.max(1, Math.ceil(totalRecords / pageSize))
    : null;

  return (
    <div className="compensation-page">
      <header className="compensation-header">
        <div>
          <span className="compensation-eyebrow">
            PAYROLL & COMPENSATION
          </span>
          <h1>Compensation Management</h1>
          <p>
            Manage employee salaries, currency assignments,
            and compensation history.
          </p>
        </div>

        <button
          type="button"
          className="compensation-refresh"
          onClick={refreshRecords}
          disabled={loading || analyticsLoading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {/* COMPANY-WIDE ANALYTICS */}
      <section
        className="compensation-analytics"
        aria-label="Company-wide compensation analytics"
      >
        <div className="compensation-panel-heading">
          <div>
            <h2>Company-wide Compensation Analytics</h2>
            <p>
              Current annual base salaries, grouped by currency
            </p>
          </div>

          <label className="compensation-analytics-currency">
            Compare currency
            <select
              value={selectedCurrency}
              onChange={(event) =>
                setAnalyticsCurrency(event.target.value)
              }
              disabled={
                analyticsLoading || !analyticsCurrencies.length
              }
            >
              {!analyticsCurrencies.length && (
                <option value="">No currencies</option>
              )}

              {analyticsCurrencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>

        {analyticsError && (
          <div className="compensation-error" role="alert">
            {analyticsError}
            <button
              type="button"
              onClick={refreshRecords}
            >
              Retry
            </button>
          </div>
        )}

        {analyticsLoading ? (
          <p className="compensation-analytics-status">
            Loading analytics...
          </p>
        ) : !analyticsError && !payrollSummary.length ? (
          <p className="compensation-analytics-status">
            No compensation analytics available yet.
          </p>
        ) : !analyticsError ? (
          <>
            {/* ANALYTICS SUMMARY CARDS */}
            <div className="compensation-summary">
              <article className="compensation-stat">
                <div className="compensation-stat-icon">
                  <Wallet size={19} />
                </div>
                <span>Company-wide Salary Records</span>
                <strong>
                  {totalCompanyRecords.toLocaleString()}
                </strong>
                <small>Across all currencies</small>
              </article>

              <article className="compensation-stat">
                <div className="compensation-stat-icon">
                  <Globe2 size={19} />
                </div>
                <span>Countries / Currencies</span>
                <strong>
                  {totalCompanyCountries} /{" "}
                  {analyticsCurrencies.length}
                </strong>
                <small>Countries with salary records</small>
              </article>

              <article className="compensation-stat">
                <div className="compensation-stat-icon">
                  <TrendingUp size={19} />
                </div>
                <span>
                  Annual Payroll — {selectedCurrency}
                </span>
                <strong className="compensation-analytics-figure">
                  {selectedPayroll
                    ? formatSalary(
                        selectedPayroll.total_salary,
                        selectedCurrency
                      )
                    : "—"}
                </strong>
                <small>
                  {selectedPayroll?.employee_count ?? 0}{" "}
                  employees · Average{" "}
                  {formatSalary(
                    selectedPayroll?.average_salary,
                    selectedCurrency
                  )}
                </small>
              </article>
            </div>

            {/* PAYROLL BY CURRENCY */}
            <section className="compensation-panel compensation-analytics-panel">
              <div className="compensation-panel-heading">
                <div>
                  <h2>Annual Payroll by Currency</h2>
                  <p>
                    Amounts are not converted or added together
                  </p>
                </div>
              </div>

              <div className="compensation-table-scroll">
                <table className="compensation-table">
                  <thead>
                    <tr>
                      <th>Currency</th>
                      <th>Employees</th>
                      <th>Total Annual Payroll</th>
                      <th>Average Salary</th>
                      <th>Minimum</th>
                      <th>Maximum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollSummary.map((item) => (
                      <tr key={item.currency}>
                        <td>
                          <span className="compensation-currency">
                            {item.currency}
                          </span>
                        </td>
                        <td>
                          {Number(
                            item.employee_count
                          ).toLocaleString()}
                        </td>
                        <td className="compensation-amount">
                          {formatSalary(
                            item.total_salary,
                            item.currency
                          )}
                        </td>
                        <td>
                          {formatSalary(
                            item.average_salary,
                            item.currency
                          )}
                        </td>
                        <td>
                          {formatSalary(
                            item.minimum_salary,
                            item.currency
                          )}
                        </td>
                        <td>
                          {formatSalary(
                            item.maximum_salary,
                            item.currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* DEPARTMENT AND COUNTRY CHARTS */}
            <div className="compensation-analytics-grid">
              <section className="compensation-panel compensation-analytics-panel">
                <div className="compensation-panel-heading">
                  <div>
                    <h2>
                      <Building2 size={18} />
                      Average Salary by Department
                    </h2>
                    <p>
                      {selectedCurrency} only · Annual base salary
                    </p>
                  </div>
                </div>

                {departmentChartData.length ? (
                  <div
                    className="compensation-analytics-chart"
                    style={{
                      height: Math.max(
                        260,
                        departmentChartData.length * 42
                      ),
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={departmentChartData}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 20,
                          left: 5,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="department"
                          width={115}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatSalary(
                              value,
                              selectedCurrency
                            ),
                            "Average salary",
                          ]}
                        />
                        <Bar
                          dataKey="average"
                          fill="#4f6ef7"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="compensation-analytics-status">
                    No department salaries in {selectedCurrency}.
                  </p>
                )}
              </section>

              <section className="compensation-panel compensation-analytics-panel">
                <div className="compensation-panel-heading">
                  <div>
                    <h2>
                      <Globe2 size={18} />
                      Average Salary by Country
                    </h2>
                    <p>
                      {selectedCurrency} only · Country salary averages
                    </p>
                  </div>
                </div>

                {countryChartData.length ? (
                  <div
                    className="compensation-analytics-chart"
                    style={{
                      height: Math.max(
                        260,
                        countryChartData.length * 42
                      ),
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={countryChartData}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 20,
                          left: 5,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="country"
                          width={115}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatSalary(
                              value,
                              selectedCurrency
                            ),
                            "Average salary",
                          ]}
                        />
                        <Bar
                          dataKey="average"
                          fill="#0d9488"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="compensation-analytics-status">
                    No country salaries in {selectedCurrency}.
                  </p>
                )}
              </section>
            </div>

            {/* COUNTRY SALARY RANGES */}
            <section className="compensation-panel compensation-analytics-panel">
              <div className="compensation-panel-heading">
                <div>
                  <h2>
                    Salary Ranges by Country — {selectedCurrency}
                  </h2>
                  <p>
                    Minimum, average and maximum annual salary
                  </p>
                </div>
              </div>

              <div className="compensation-table-scroll">
                <table className="compensation-table">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Employees</th>
                      <th>Minimum</th>
                      <th>Average</th>
                      <th>Maximum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryChartData.map((item) => (
                      <tr
                        key={`${item.code}-${selectedCurrency}`}
                      >
                        <td>{item.country}</td>
                        <td>
                          {item.employees.toLocaleString()}
                        </td>
                        <td>
                          {formatSalary(
                            item.minimum,
                            selectedCurrency
                          )}
                        </td>
                        <td className="compensation-amount">
                          {formatSalary(
                            item.average,
                            selectedCurrency
                          )}
                        </td>
                        <td>
                          {formatSalary(
                            item.maximum,
                            selectedCurrency
                          )}
                        </td>
                      </tr>
                    ))}

                    {!countryChartData.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="compensation-empty"
                        >
                          No salary records for this currency.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </section>

      {/* EMPLOYEE COMPENSATION RECORDS */}
      <section className="compensation-panel">
        <div className="compensation-panel-heading">
          <div>
            <h2>Employee Compensation</h2>
            <p>
              {totalRecords.toLocaleString()} matching records
            </p>
          </div>
        </div>

        <div className="compensation-filters">
          <div className="compensation-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search name, ID, email..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
            />
          </div>

          <select
            value={filters.department}
            onChange={(event) =>
              updateFilter(
                "department",
                event.target.value
              )
            }
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={filters.country}
            onChange={(event) =>
              updateFilter(
                "country",
                event.target.value
              )
            }
            aria-label="Filter by country"
          >
            <option value="">All Countries</option>
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={filters.currency}
            onChange={(event) =>
              updateFilter(
                "currency",
                event.target.value
              )
            }
            aria-label="Filter by currency"
          >
            <option value="">All Currencies</option>
            {currencies.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} — {item.name}
              </option>
            ))}
          </select>
        </div>

        {(error || optionsError) && (
          <div className="compensation-error" role="alert">
            {[error, optionsError].filter(Boolean).join(" ")}
          </div>
        )}

        <div className="compensation-table-scroll">
          <table className="compensation-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Annual Base Salary</th>
                <th>Currency</th>
                <th>Effective Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="compensation-empty"
                  >
                    Loading compensation records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="compensation-empty"
                  >
                    No compensation records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="compensation-person">
                        <span className="compensation-avatar">
                          {(record.employee_name || "E")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div>
                          <strong>
                            {record.employee_name}
                          </strong>
                          <small>
                            <Link
                              to={`/employees/${record.employee}`}
                            >
                              View employee
                            </Link>
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>{record.employee_code}</td>

                    <td className="compensation-amount">
                      {formatSalary(
                        record.annual_base_salary,
                        record.currency
                      )}
                    </td>

                    <td>
                      <span className="compensation-currency">
                        {record.currency}
                      </span>
                    </td>

                    <td>
                      {formatDate(record.effective_date)}
                    </td>

                    <td>
                      <div className="compensation-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openUpdateModal(record)
                          }
                        >
                          <Pencil size={15} />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openHistoryModal(record)
                          }
                        >
                          <History size={15} />
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="compensation-pagination">
          <span>
            Page {page}
            {totalPages ? ` of ${totalPages}` : ""}
            {" · "}
            {totalRecords.toLocaleString()} records
          </span>
          <div>
            <button
              type="button"
              disabled={!hasPrevious || loading}
              onClick={() =>
                setPage((previous) =>
                  Math.max(1, previous - 1)
                )
              }
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() =>
                setPage((previous) => previous + 1)
              }
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* SALARY UPDATE AND HISTORY MODAL */}
      {modalType && selectedRecord && (
        <div
          className="compensation-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="compensation-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modalType === "update"
                ? "Update employee salary"
                : "Employee salary history"
            }
          >
            <div className="compensation-modal-header">
              <div>
                <h2>
                  {modalType === "update"
                    ? "Update Salary"
                    : "Salary History"}
                </h2>
                <p>
                  {selectedRecord.employee_name} ·{" "}
                  {selectedRecord.employee_code}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div
                className="compensation-error"
                role="alert"
              >
                {modalError}
              </div>
            )}

            {modalType === "update" && (
              <form
                onSubmit={handleSalaryUpdate}
                className="compensation-update-form"
              >
                <div className="compensation-current-salary">
                  <span>Current Annual Salary</span>
                  <strong>
                    {formatSalary(
                      selectedRecord.annual_base_salary,
                      selectedRecord.currency
                    )}
                  </strong>
                </div>

                <label htmlFor="new_salary">
                  New Annual Base Salary
                </label>
                <input
                  id="new_salary"
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  value={salaryForm.new_salary}
                  onChange={(event) =>
                    setSalaryForm((previous) => ({
                      ...previous,
                      new_salary: event.target.value,
                    }))
                  }
                />

                <label htmlFor="new_currency">
                  Currency
                </label>
                <select
                  id="new_currency"
                  required
                  value={salaryForm.new_currency}
                  onChange={(event) =>
                    setSalaryForm((previous) => ({
                      ...previous,
                      new_currency: event.target.value,
                    }))
                  }
                >
                  {salaryForm.new_currency &&
                    !currencies.some(
                      (item) =>
                        item.code === salaryForm.new_currency
                    ) && (
                      <option value={salaryForm.new_currency}>
                        {salaryForm.new_currency}
                      </option>
                    )}
                  {currencies.map((item) => (
                    <option
                      key={item.code}
                      value={item.code}
                    >
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="effective_date">
                  Effective Date
                </label>
                <input
                  id="effective_date"
                  type="date"
                  required
                  value={salaryForm.effective_date}
                  onChange={(event) =>
                    setSalaryForm((previous) => ({
                      ...previous,
                      effective_date: event.target.value,
                    }))
                  }
                />

                <p className="compensation-note">
                  This update will be recorded in salary
                  history. Changing currency does not
                  automatically convert the salary amount.
                </p>

                <div className="compensation-modal-footer">
                  <button
                    type="button"
                    className="compensation-secondary-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="compensation-primary-button"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving
                      ? "Saving..."
                      : "Save Salary Update"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "history" && (
              <div className="compensation-history">
                {historyLoading ? (
                  <p>Loading salary history...</p>
                ) : historyRecords.length === 0 ? (
                  <p>No salary changes recorded yet.</p>
                ) : (
                  <div className="compensation-history-list">
                    {historyRecords.map((entry) => (
                      <div
                        key={entry.id}
                        className="compensation-history-entry"
                      >
                        <span>
                          {formatDate(entry.effective_date)}
                        </span>
                        <strong>
                          {formatSalary(
                            entry.previous_salary,
                            entry.previous_currency
                          )}
                        </strong>
                        <span className="compensation-history-arrow">
                          →
                        </span>
                        <strong>
                          {formatSalary(
                            entry.new_salary,
                            entry.new_currency
                          )}
                        </strong>
                        <small>
                          Recorded{" "}
                          {new Date(
                            entry.changed_at
                          ).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="compensation-pagination">
                  <span>History page {historyPage}</span>
                  <div>
                    <button
                      type="button"
                      disabled={
                        !historyPrevious || historyLoading
                      }
                      onClick={() =>
                        setHistoryPage((previous) =>
                          Math.max(1, previous - 1)
                        )
                      }
                      aria-label="Previous history page"
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      type="button"
                      disabled={
                        !historyNext || historyLoading
                      }
                      onClick={() =>
                        setHistoryPage((previous) =>
                          previous + 1
                        )
                      }
                      aria-label="Next history page"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}