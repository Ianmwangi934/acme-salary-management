
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, Wallet } from "lucide-react";
import api from "../api/client";
import "../styles/forms.css";

function asList(data) {
  return Array.isArray(data) ? data : data?.results ?? [];
}

function formatSalary(value, currency) {
  if (value == null) return "—";

  return `${currency || ""} ${Number(value).toLocaleString(
    "en-US",
    { maximumFractionDigits: 3 }
  )}`;
}

export default function EmployeeDetails() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [compensation, setCompensation] = useState(null);
  const [history, setHistory] = useState([]);
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [employeeResponse, compensationResponse] =
        await Promise.all([
          api.get(`employees/${id}/`),
          api.get("compensation/", {
            params: { employee: id },
          }),
        ]);

      const compensationRecord =
        asList(compensationResponse.data)[0] ?? null;

      setEmployee(employeeResponse.data);
      setCompensation(compensationRecord);

      if (compensationRecord) {
        setSalary(
          String(compensationRecord.annual_base_salary)
        );
        setCurrency(compensationRecord.currency);
        setEffectiveDate(
          compensationRecord.effective_date
        );

        const historyResponse = await api.get(
          `compensation/${compensationRecord.id}/history/`
        );

        setHistory(asList(historyResponse.data));
      } else {
        setHistory([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load employee details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function handleSalaryUpdate(event) {
    event.preventDefault();
    if (!compensation) return;

    const confirmed = window.confirm(
      "Confirm this salary change? It will be recorded in the audit history."
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        `compensation/${compensation.id}/update-salary/`,
        {
          new_salary: salary,
          new_currency: currency.toUpperCase(),
          effective_date: effectiveDate,
        }
      );

      setSuccess("Salary updated successfully.");
      await loadDetails();
    } catch (err) {
      const data = err.response?.data;

      setError(
        typeof data?.detail === "string"
          ? data.detail
          : data
            ? JSON.stringify(data)
            : "Unable to update salary."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading && !employee) {
    return <p>Loading employee details...</p>;
  }

  if (error && !employee) {
    return <div role="alert">{error}</div>;
  }

  return (
    <div className="form-page">
      <Link to="/employees" className="back-link">
        <ArrowLeft size={17} />
        Back to Employees
      </Link>

      <header className="form-page-header">
        <div className="form-page-icon">
          <Wallet size={24} />
        </div>
        <div>
          <h1>
            {employee?.full_name ||
              `${employee?.first_name} ${employee?.last_name}`}
          </h1>
          <p>
            {employee?.employee_id} · {employee?.job_title}
          </p>
        </div>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="salary-success" role="status">
          {success}
        </div>
      )}

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Employee Information</h2>
        </div>

        <div className="detail-grid">
          <div>
            <small>Email</small>
            <strong>{employee?.email}</strong>
          </div>
          <div>
            <small>Department</small>
            <strong>{employee?.department_name}</strong>
          </div>
          <div>
            <small>Country</small>
            <strong>{employee?.country}</strong>
          </div>
          <div>
            <small>Employment Status</small>
            <strong>{employee?.employment_status}</strong>
          </div>
          <div>
            <small>Hire Date</small>
            <strong>{employee?.hire_date}</strong>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Current Compensation</h2>
          <p>Annual base salary and effective date</p>
        </div>

        {compensation ? (
          <>
            <div className="salary-highlight">
              <span>Annual Base Salary</span>
              <strong>
                {formatSalary(
                  compensation.annual_base_salary,
                  compensation.currency
                )}
              </strong>
              <small>
                Effective {compensation.effective_date}
              </small>
            </div>

            <form onSubmit={handleSalaryUpdate}>
              <h3>Update Salary</h3>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="new_salary">
                    New Annual Salary
                  </label>
                  <input
                    id="new_salary"
                    type="number"
                    min="0"
                    step="0.001"
                    value={salary}
                    onChange={(e) =>
                      setSalary(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="new_currency">
                    Currency
                  </label>
                  <input
                    id="new_currency"
                    maxLength={3}
                    value={currency}
                    onChange={(e) =>
                      setCurrency(
                        e.target.value.toUpperCase()
                      )
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="effective_date">
                    Effective Date
                  </label>
                  <input
                    id="effective_date"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) =>
                      setEffectiveDate(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-actions salary-actions">
                <button
                  type="submit"
                  className="primary-action"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Update Salary"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <p>No compensation record found.</p>
        )}
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Salary Change History</h2>
          <p>Audit trail of compensation changes</p>
        </div>

        <div className="employee-table-scroll">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Previous Salary</th>
                <th>New Salary</th>
                <th>Effective Date</th>
                <th>Changed At</th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="table-message">
                    No salary changes recorded.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {formatSalary(
                        record.previous_salary,
                        record.previous_currency
                      )}
                    </td>
                    <td>
                      {formatSalary(
                        record.new_salary,
                        record.new_currency
                      )}
                    </td>
                    <td>{record.effective_date}</td>
                    <td>
                      {record.changed_at
                        ? new Date(
                            record.changed_at
                          ).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
