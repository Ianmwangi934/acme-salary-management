
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import api from "../api/client";
import "../styles/forms.css";

// Initial employee onboarding form values
const initialForm = {
  employee_id: "",
  first_name: "",
  last_name: "",
  email: "",
  department: "",
  job_title: "",
  country: "KE",
  hire_date: new Date().toLocaleDateString("en-CA"),
  annual_base_salary: "",
  currency: "KES",
  salary_effective_date: new Date().toLocaleDateString("en-CA"),
};

export default function AddEmployee() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [errors, setErrors] = useState({});

  // Loading and submission state
  const [loadingDepartments, setLoadingDepartments] =
    useState(true);
  const [loadingLocations, setLoadingLocations] =
    useState(true);
  const [generatingId, setGeneratingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Track the latest ID suggestion request
  const latestIdRequest = useRef(0);

  // Keep the selected department synchronized
  const selectedDepartment = useRef("");

  // Prevent duplicate submissions before React updates state
  const submittingRef = useRef(false);

  // Load departments
  useEffect(() => {
    let active = true;

    async function loadDepartments() {
      try {
        const { data } = await api.get(
          "employees/departments/"
        );

        if (!active) return;

        setDepartments(
          Array.isArray(data)
            ? data
            : data?.results ?? []
        );
      } catch (error) {
        if (!active) return;

        setErrors((previous) => ({
          ...previous,
          detail:
            "Unable to load departments. Please refresh the page.",
        }));
      } finally {
        if (active) {
          setLoadingDepartments(false);
        }
      }
    }

    loadDepartments();

    return () => {
      active = false;
    };
  }, []);

  // Load globally supported countries and currencies
  useEffect(() => {
    let active = true;

    async function loadCountryCurrencyOptions() {
      try {
        const { data } = await api.get(
          "employees/country-currency-options/"
        );

        if (!active) return;

        const countryOptions = Array.isArray(data?.countries)
          ? data.countries
          : [];

        const currencyOptions = Array.isArray(data?.currencies)
          ? data.currencies
          : [];

        setCountries(countryOptions);
        setCurrencies(currencyOptions);

        // Synchronize the default currency with the
        // currently selected country.
        setForm((previous) => {
          const selectedCountry = countryOptions.find(
            (country) => country.code === previous.country
          );

          return {
            ...previous,
            currency:
              selectedCountry?.default_currency ??
              previous.currency,
          };
        });
      } catch (error) {
        if (!active) return;

        setErrors((previous) => ({
          ...previous,
          detail:
            "Unable to load countries and currencies. Please refresh the page.",
        }));
      } finally {
        if (active) {
          setLoadingLocations(false);
        }
      }
    }

    loadCountryCurrencyOptions();

    return () => {
      active = false;
    };
  }, []);

  // Request a department-based employee ID suggestion
  async function generateEmployeeId(departmentId) {
    const requestId = ++latestIdRequest.current;

    if (!departmentId) {
      setGeneratingId(false);
      return;
    }

    setGeneratingId(true);

    try {
      const { data } = await api.get(
        "employees/suggest-id/",
        {
          params: {
            department: departmentId,
          },
        }
      );

      // Ignore responses from older requests
      if (requestId !== latestIdRequest.current) {
        return;
      }

      // Prevent suggestions for a previously selected department
      if (
        String(selectedDepartment.current) !==
        String(departmentId)
      ) {
        return;
      }

      if (!data?.suggested_id) {
        throw new Error(
          "The server did not return an employee ID."
        );
      }

      setForm((previous) => ({
        ...previous,
        employee_id: data.suggested_id,
      }));

      setErrors((previous) => ({
        ...previous,
        employee_id: undefined,
      }));
    } catch (error) {
      if (requestId !== latestIdRequest.current) {
        return;
      }

      setErrors((previous) => ({
        ...previous,
        employee_id: [
          "Unable to generate an employee ID. You can enter one manually.",
        ],
      }));
    } finally {
      if (requestId === latestIdRequest.current) {
        setGeneratingId(false);
      }
    }
  }

  // Handle form input changes
  function updateField(event) {
    const { name, value } = event.target;

    // Cancel the effect of pending ID suggestions
    // when HR manually edits the employee ID.
    if (name === "employee_id") {
      latestIdRequest.current += 1;
      setGeneratingId(false);
    }

    // Update department tracking
    if (name === "department") {
      selectedDepartment.current = value;
      latestIdRequest.current += 1;
    }

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      // Automatically recommend the country's currency
      if (name === "country") {
        const selectedCountry = countries.find(
          (country) => country.code === value
        );

        updated.currency =
          selectedCountry?.default_currency ?? "";
      }

      // Clear the previous employee ID when the
      // department changes.
      if (name === "department") {
        updated.employee_id = "";
      }

      return updated;
    });

    // Clear errors for the edited field
    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
      ...(name === "department"
        ? { employee_id: undefined }
        : {}),
      ...(name === "country"
        ? { currency: undefined }
        : {}),
      detail: undefined,
    }));

    // Generate a new ID when a department is selected
    if (name === "department") {
      generateEmployeeId(value);
    }
  }

  // Submit employee and initial compensation
  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submittingRef.current ||
      generatingId ||
      loadingDepartments ||
      loadingLocations
    ) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});

    try {
      const response = await api.post("employees/", {
        ...form,
        department: Number(form.department),
      });

      const employee = response.data;

      if (employee?.id) {
        navigate(`/employees/${employee.id}`);
      } else {
        navigate("/employees");
      }
    } catch (error) {
      const data = error.response?.data;

      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {
        setErrors(data);
      } else {
        setErrors({
          detail:
            typeof data?.detail === "string"
              ? data.detail
              : "Unable to create employee. Please try again.",
        });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  // Display Django field validation errors
  function fieldError(name) {
    const value = errors[name];

    if (!value) return null;

    const message = Array.isArray(value)
      ? value.join(" ")
      : typeof value === "string"
        ? value
        : JSON.stringify(value);

    return (
      <small className="field-error" role="alert">
        {message}
      </small>
    );
  }

  const formUnavailable =
    submitting ||
    generatingId ||
    loadingDepartments ||
    loadingLocations;

  return (
    <div className="form-page">
      {/* Back navigation */}
      <Link to="/employees" className="back-link">
        <ArrowLeft size={17} />
        Back to Employees
      </Link>

      {/* Page header */}
      <header className="form-page-header">
        <div className="form-page-icon">
          <UserPlus size={24} />
        </div>

        <div>
          <h1>Add New Employee</h1>
          <p>
            Create an employee record and assign initial
            compensation.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        {/* General API errors */}
        {errors.detail && (
          <div className="form-alert" role="alert">
            {String(errors.detail)}
          </div>
        )}

        {errors.non_field_errors && (
          <div className="form-alert" role="alert">
            {Array.isArray(errors.non_field_errors)
              ? errors.non_field_errors.join(" ")
              : String(errors.non_field_errors)}
          </div>
        )}

        {/* PERSONAL INFORMATION */}
        <section className="form-section">
          <div className="form-section-heading">
            <h2>Personal Information</h2>
            <p>
              Employee identity and contact details
            </p>
          </div>

          <div className="form-grid">
            {/* Employee ID */}
            <div className="form-field">
              <label htmlFor="employee_id">
                Employee ID
              </label>

              <div className="employee-id-control">
                <input
                  id="employee_id"
                  name="employee_id"
                  type="text"
                  maxLength={20}
                  value={form.employee_id}
                  onChange={updateField}
                  placeholder="Select a department for an ID"
                  required
                />

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    generateEmployeeId(form.department)
                  }
                  disabled={
                    !form.department ||
                    generatingId ||
                    submitting
                  }
                >
                  <RefreshCw
                    size={16}
                    className={
                      generatingId ? "spin-icon" : ""
                    }
                  />

                  {generatingId
                    ? "Generating..."
                    : "Generate ID"}
                </button>
              </div>

              {fieldError("employee_id")}

              <small>
                An employee ID is recommended based on
                the selected department. You may edit it.
              </small>
            </div>

            {/* Other personal information */}
            {[
              ["first_name", "First Name", "text"],
              ["last_name", "Last Name", "text"],
              ["email", "Email Address", "email"],
            ].map(([name, label, type]) => (
              <div className="form-field" key={name}>
                <label htmlFor={name}>
                  {label}
                </label>

                <input
                  id={name}
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={updateField}
                  required
                />

                {fieldError(name)}
              </div>
            ))}
          </div>
        </section>

        {/* EMPLOYMENT DETAILS */}
        <section className="form-section">
          <div className="form-section-heading">
            <h2>Employment Details</h2>
            <p>
              Role, location, and employment start date
            </p>
          </div>

          <div className="form-grid">
            {/* Department */}
            <div className="form-field">
              <label htmlFor="department">
                Department
              </label>

              <select
                id="department"
                name="department"
                value={form.department}
                onChange={updateField}
                disabled={
                  loadingDepartments || submitting
                }
                required
              >
                <option value="">
                  {loadingDepartments
                    ? "Loading departments..."
                    : "Select department"}
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                ))}
              </select>

              {fieldError("department")}
            </div>

            {/* Job title */}
            <div className="form-field">
              <label htmlFor="job_title">
                Job Title
              </label>

              <input
                id="job_title"
                name="job_title"
                value={form.job_title}
                onChange={updateField}
                required
              />

              {fieldError("job_title")}
            </div>

            {/* Global country selection */}
            <div className="form-field">
              <label htmlFor="country">
                Country
              </label>

              <select
                id="country"
                name="country"
                value={form.country}
                onChange={updateField}
                disabled={
                  loadingLocations || submitting
                }
                required
              >
                <option value="">
                  {loadingLocations
                    ? "Loading countries..."
                    : "Select country"}
                </option>

                {countries.map((country) => (
                  <option
                    key={country.code}
                    value={country.code}
                  >
                    {country.name}
                  </option>
                ))}
              </select>

              {fieldError("country")}
            </div>

            {/* Hire date */}
            <div className="form-field">
              <label htmlFor="hire_date">
                Hire Date
              </label>

              <input
                id="hire_date"
                name="hire_date"
                type="date"
                value={form.hire_date}
                onChange={updateField}
                required
              />

              {fieldError("hire_date")}
            </div>
          </div>
        </section>

        {/* INITIAL COMPENSATION */}
        <section className="form-section">
          <div className="form-section-heading">
            <h2>Initial Compensation</h2>
            <p>
              Annual base salary and effective date
            </p>
          </div>

          <div className="form-grid">
            {/* Annual base salary */}
            <div className="form-field">
              <label htmlFor="annual_base_salary">
                Annual Base Salary
              </label>

              <input
                id="annual_base_salary"
                name="annual_base_salary"
                type="number"
                min="0"
                step="0.001"
                value={form.annual_base_salary}
                onChange={updateField}
                required
              />

              {fieldError("annual_base_salary")}
            </div>

            {/* Global currency selection */}
            <div className="form-field">
              <label htmlFor="currency">
                Currency
              </label>

              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={updateField}
                disabled={
                  loadingLocations || submitting
                }
                required
              >
                <option value="">
                  Select currency
                </option>

                {currencies.map((currency) => (
                  <option
                    key={currency.code}
                    value={currency.code}
                  >
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>

              {fieldError("currency")}

              <small>
                Automatically recommended based on the
                country. You can select a different
                currency if needed.
              </small>
            </div>

            {/* Salary effective date */}
            <div className="form-field">
              <label htmlFor="salary_effective_date">
                Salary Effective Date
              </label>

              <input
                id="salary_effective_date"
                name="salary_effective_date"
                type="date"
                value={form.salary_effective_date}
                onChange={updateField}
                required
              />

              {fieldError("salary_effective_date")}
            </div>
          </div>
        </section>

        {/* FORM ACTIONS */}
        <div className="form-actions">
          <Link
            to="/employees"
            className="secondary-action"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="primary-action"
            disabled={formUnavailable}
          >
            <Save size={17} />

            {submitting
              ? "Creating..."
              : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
