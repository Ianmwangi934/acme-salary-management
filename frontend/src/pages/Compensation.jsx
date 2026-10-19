
import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

import api from "../api/client";
import "../styles/compensation.css";

const PAGE_SIZE = 20;

const initialFilters = {
  search: "",
  department: "",
  country: "",
  currency: "",
};

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

function formatSalary(value, currency) {
  if (value === null || value === undefined) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${currency || ""} ${number.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }
  )}`.trim();
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

function errorMessage(error, fallback) {
  const data = error.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data)) {
    return data.join(" ");
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);

        return `${field}: ${text}`;
      })
      .join(" ");
  }

  return fallback;
}

export default function Compensation() {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");

  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  // Salary update form
  const [salaryForm, setSalaryForm] = useState({
    new_salary: "",
    new_currency: "",
    effective_date: getToday(),
  });

  // Salary history state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyNext, setHistoryNext] = useState(false);
  const [historyPrevious, setHistoryPrevious] = useState(false);

  // Load dropdown options
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const [departmentResponse, locationResponse] =
          await Promise.all([
            api.get("employees/departments/"),
            api.get(
              "employees/country-currency-options/"
            ),
          ]);

        if (!active) return;

        const departmentData = departmentResponse.data;
        const locationData = locationResponse.data;

        setDepartments(
          Array.isArray(departmentData)
            ? departmentData
            : departmentData?.results ?? []
        );

        setCountries(locationData?.countries ?? []);
        setCurrencies(locationData?.currencies ?? []);
      } catch (err) {
        if (!active) return;

        setError(
          "Some filter options could not be loaded."
        );
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  // Load paginated compensation records
  useEffect(() => {
    let active = true;

    async function loadCompensations() {
      setLoading(true);
      setError("");

      try {
        const params = { page };

        if (filters.search) {
          params.search = filters.search;
        }

        if (filters.department) {
          params["employee__department"] =
            filters.department;
        }

        if (filters.country) {
          params["employee__country"] =
            filters.country;
        }

        if (filters.currency) {
          params.currency = filters.currency;
        }

        const { data } = await api.get(
          "compensation/",
          { params }
        );

        if (!active) return;

        const results = Array.isArray(data)
          ? data
          : data?.results ?? [];

        setRecords(results);
        setTotalRecords(
          Array.isArray(data)
            ? data.length
            : data?.count ?? results.length
        );
        setHasNext(Boolean(data?.next));
        setHasPrevious(Boolean(data?.previous));
      } catch (err) {
        if (!active) return;

        setRecords([]);
        setTotalRecords(0);
        setHasNext(false);
        setHasPrevious(false);
        setError(
          errorMessage(
            err,
            "Unable to load compensation records."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCompensations();

    return () => {
      active = false;
    };
  }, [page, filters, refreshKey]);

  // Debounce employee searches
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setFilters((previous) => {
        const search = searchInput.trim();

        if (previous.search === search) {
          return previous;
        }

        return {
          ...previous,
          search,
        };
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

  // Summary for the CURRENTLY LOADED PAGE.
  // This is intentionally not presented as company-wide payroll.
  const pageCurrencies = [
    ...new Set(records.map((item) => item.currency)),
  ].filter(Boolean);

  const pagePayroll = records.reduce(
    (totals, item) => {
      const code = item.currency;
      const salary = Number(item.annual_base_salary);

      if (code && Number.isFinite(salary)) {
        totals[code] = (totals[code] ?? 0) + salary;
      }

      return totals;
    },
    {}
  );

  function openUpdateModal(record) {
    setSelectedRecord(record);
    setModalType("update");
    setModalError("");

    setSalaryForm({
      new_salary: record.annual_base_salary ?? "",
      new_currency: record.currency ?? "",
      effective_date: getToday(),
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

    setSelectedRecord(null);
    setModalType(null);
    setModalError("");
  }

  // Fetch salary history for the selected compensation
  const loadHistory = useCallback(
    async (recordId, requestedPage = 1) => {
      setHistoryLoading(true);
      setModalError("");

      try {
        const { data } = await api.get(
          `compensation/${recordId}/history/`,
          {
            params: {
              page: requestedPage,
            },
          }
        );

        const results = Array.isArray(data)
          ? data
          : data?.results ?? [];

        setHistoryRecords(results);
        setHistoryNext(Boolean(data?.next));
        setHistoryPrevious(Boolean(data?.previous));
      } catch (err) {
        setHistoryRecords([]);
        setHistoryNext(false);
        setHistoryPrevious(false);

        setModalError(
          errorMessage(
            err,
            "Unable to load salary history."
          )
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (modalType !== "history" || !selectedRecord) {
      return;
    }

    loadHistory(selectedRecord.id, historyPage);
  }, [
    modalType,
    selectedRecord,
    historyPage,
    loadHistory,
  ]);

  // Update an employee's salary
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

      closeModalAfterSave();
      refreshRecords();
    } catch (err) {
      setModalError(
        errorMessage(
          err,
          "Unable to update the employee's salary."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function closeModalAfterSave() {
    setModalType(null);
    setSelectedRecord(null);
    setModalError("");
  }

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / PAGE_SIZE)
  );

  return (
    <div className="compensation-page">
      {/* Page heading */}
      <header className="compensation-header">
        <div>
          <span className="compensation-eyebrow">
            PAYROLL & COMPENSATION
          </span>

          <h1>Compensation Management</h1>

          <p>
            Manage annual salaries, currency assignments,
            and compensation history.
          </p>
        </div>

        <button
          type="button"
          className="compensation-refresh"
          onClick={refreshRecords}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {/* Summary cards */}
      <div className="compensation-summary">
        <article className="compensation-stat">
          <div className="compensation-stat-icon">
            <Wallet size={19} />
          </div>

          <span>Compensation Records</span>
          <strong>
            {totalRecords.toLocaleString()}
          </strong>
          <small>Matching current filters</small>
        </article>

        <article className="compensation-stat">
          <div className="compensation-stat-icon">
            <Wallet size={19} />
          </div>

          <span>Currencies on This Page</span>
          <strong>{pageCurrencies.length}</strong>
          <small>
            Based on loaded records
          </small>
        </article>

        <article className="compensation-stat compensation-payroll-stat">
          <div className="compensation-stat-icon">
            <Wallet size={19} />
          </div>

          <span>Annual Payroll — Current Page</span>

          <div className="compensation-payroll-values">
            {Object.entries(pagePayroll).length ? (
              Object.entries(pagePayroll)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([currency, amount]) => (
                  <strong key={currency}>
                    {formatSalary(amount, currency)}
                  </strong>
                ))
            ) : (
              <strong>—</strong>
            )}
          </div>

          <small>
            Separate totals by currency
          </small>
        </article>
      </div>

      {/* Main records table */}
      <section className="compensation-panel">
        <div className="compensation-panel-heading">
          <div>
            <h2>Employee Compensation</h2>
            <p>
              {totalRecords.toLocaleString()} records found
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="compensation-filters">
          <div className="compensation-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search name, ID, email, job title..."
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

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
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

            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
              >
                {country.name}
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

            {currencies.map((currency) => (
              <option
                key={currency.code}
                value={currency.code}
              >
                {currency.code} — {currency.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            className="compensation-error"
            role="alert"
          >
            {error}
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
                  <td colSpan={6} className="compensation-empty">
                    Loading compensation records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="compensation-empty">
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
                          title="Update salary"
                        >
                          <Pencil size={15} />
                          Update
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openHistoryModal(record)
                          }
                          title="View salary history"
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

        {/* Pagination */}
        <div className="compensation-pagination">
          <span>
            Page {page} of {totalPages}
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

      {/* Modal overlay */}
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
                  {selectedRecord.employee_name}
                  {" · "}
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

                  {currencies.map((currency) => (
                    <option
                      key={currency.code}
                      value={currency.code}
                    >
                      {currency.code} — {currency.name}
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
                  This update will be recorded in the
                  employee's salary history. Changing the
                  currency does not automatically convert
                  the salary amount.
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
                  <span>
                    History page {historyPage}
                  </span>

                  <div>
                    <button
                      type="button"
                      disabled={
                        !historyPrevious ||
                        historyLoading
                      }
                      onClick={() =>
                        setHistoryPage((previous) =>
                          Math.max(1, previous - 1)
                        )
                      }
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        !historyNext ||
                        historyLoading
                      }
                      onClick={() =>
                        setHistoryPage(
                          (previous) => previous + 1
                        )
                      }
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
