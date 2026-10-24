
import React, { useCallback, useEffect, useState } from "react";
import heroBackground from "../assets/reyasa-background.png";
import ExpenseService from "../services/ExpenseService";

const MAROON = "#800000";

const EMPTY_FORM = {
  title: "",
  category: "Material",
  materialType: "",
  color: "",
  quantity: "1",
  unit: "piece",
  unitCost: "",
  expenseDate: new Date().toLocaleDateString("en-CA"),
  supplier: "",
  paymentMethod: "UPI",
  notes: "",
};

const CATEGORIES = [
  "Material",
  "Equipment",
  "Packaging",
  "Labour",
  "Transport",
  "Marketing",
  "Utilities",
  "Other",
];

const UNITS = [
  "piece",
  "metre",
  "kg",
  "gram",
  "litre",
  "packet",
  "box",
  "hour",
  "day",
];

const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Other",
];

function ManageExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [receipt, setReceipt] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [startDate, setStartDate] = useState(
    new Date().toLocaleDateString("en-CA").slice(0, 8) + "01"
  );
  const [endDate, setEndDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getErrorMessage = (err) =>
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    "An unexpected error occurred.";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const filters = {
      startDate,
      endDate,
      ...(categoryFilter ? { category: categoryFilter } : {}),
    };

    try {
      const [expenseResponse, summaryResponse] = await Promise.all([
        ExpenseService.getAll(filters),
        ExpenseService.getSummary({ startDate, endDate }),
      ]);

      setExpenses(expenseResponse.data || []);
      setSummary(summaryResponse.data || {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setReceipt(null);
    setEditingId(null);

    const fileInput = document.getElementById("expenseReceipt");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const quantity = Number(form.quantity || 1);
    const unitCost = Number(form.unitCost);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than zero.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setError("Enter a valid unit cost.");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
    };

    try {
      if (editingId) {
        await ExpenseService.update(editingId, payload, receipt);
        setMessage("Expense updated successfully.");
      } else {
        await ExpenseService.create(payload, receipt);
        setMessage("Expense saved successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      title: expense.title || "",
      category: expense.category || "Other",
      materialType: expense.materialType || "",
      color: expense.color || "",
      quantity: String(expense.quantity ?? 1),
      unit: expense.unit || "piece",
      unitCost: String(expense.unitCost ?? ""),
      expenseDate: expense.expenseDate || "",
      supplier: expense.supplier || "",
      paymentMethod: expense.paymentMethod || "Other",
      notes: expense.notes || "",
    });

    setReceipt(null);
    setMessage("");
    setError("");

    document.getElementById("expenseForm")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `Delete "${expense.title}" and its receipt, if present? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await ExpenseService.remove(expense.id);
      setMessage("Expense deleted successfully.");

      if (editingId === expense.id) resetForm();

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReceiptDownload = async (id) => {
    try {
      await ExpenseService.downloadReceipt(id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const totalItems = expenses.length;

  return (
    <main
      className="container-fluid px-3 px-md-4 pb-5"
      style={{
        paddingTop: "150px",
        minHeight: "100vh",
        backgroundColor: "#f5eee7",
        backgroundImage: `url("${heroBackground}")`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        boxSizing: "border-box",
      }}
    >
      {/* PAGE HEADING */}
      <div className="mb-4">
        <p
          className="text-uppercase fw-semibold mb-2"
          style={{
            color: MAROON,
            letterSpacing: "3px",
            fontSize: "0.8rem",
          }}
        >
          REYASA Administration
        </p>

        <h2 className="fw-bold mb-2" style={{ color: MAROON }}>
          <i className="bi bi-cash-stack me-2"></i>
          Manage Material &amp; Expenses
        </h2>

        <p className="mb-0" style={{ color: MAROON }}>
          Record material purchases, colours, equipment, receipts and
          all other REYASA business spending.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {message && (
        <div className="alert alert-success alert-dismissible">
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* SUMMARY */}
      <div className="row g-3 mb-4">
        {[
          {
            title: "Total Expenses",
            amount: summary.totalExpenses,
            icon: "bi-wallet2",
          },
          {
            title: "Material Expenses",
            amount: summary.materialExpenses,
            icon: "bi-box-seam",
          },
          {
            title: "Equipment Expenses",
            amount: summary.equipmentExpenses,
            icon: "bi-tools",
          },
          {
            title: "Receipts Uploaded",
            amount: summary.receiptCount ?? 0,
            icon: "bi-receipt",
            count: true,
          },
        ].map((item) => (
          <div className="col-12 col-sm-6 col-xl-3" key={item.title}>
            <section className="bg-white bg-opacity-95 p-3 p-md-4 h-100">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <div>
                  <p className="text-secondary small mb-2">{item.title}</p>
                  <h4 className="fw-bold mb-0" style={{ color: MAROON }}>
                    {item.count ? item.amount : money(item.amount)}
                  </h4>
                </div>
                <i
                  className={`bi ${item.icon} fs-2`}
                  style={{ color: MAROON }}
                ></i>
              </div>
            </section>
          </div>
        ))}
      </div>

      {/* EXPENSE FORM */}
      <section
        id="expenseForm"
        className="bg-white bg-opacity-95 p-3 p-md-4 mb-4"
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-3 mb-4">
          <div>
            <h5 className="fw-bold mb-1" style={{ color: MAROON }}>
              {editingId ? "Edit Expense" : "Record New Expense"}
            </h5>
            <p className="text-secondary small mb-0">
              Fields marked * are required. Receipts are optional.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={resetForm}
            >
              Cancel Editing
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="title">
                Expense / Item Name *
              </label>
              <input
                id="title"
                name="title"
                className="form-control"
                value={form.title}
                onChange={updateField}
                placeholder="e.g. Cotton fabric purchase"
                maxLength={150}
                required
              />
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="category">
                Expense Category *
              </label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={form.category}
                onChange={updateField}
                required
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="materialType">
                Material / Equipment Type
              </label>
              <input
                id="materialType"
                name="materialType"
                className="form-control"
                value={form.materialType}
                onChange={updateField}
                placeholder="e.g. Cotton, sewing machine"
                maxLength={120}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="color">
                Colour / Shade
              </label>
              <input
                id="color"
                name="color"
                className="form-control"
                value={form.color}
                onChange={updateField}
                placeholder="e.g. Maroon, navy blue"
                maxLength={80}
              />
            </div>

            <div className="col-6 col-md-3 col-xl-2">
              <label className="form-label fw-semibold" htmlFor="quantity">
                Quantity *
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                className="form-control"
                value={form.quantity}
                onChange={updateField}
                required
              />
            </div>

            <div className="col-6 col-md-3 col-xl-2">
              <label className="form-label fw-semibold" htmlFor="unit">
                Unit
              </label>
              <select
                id="unit"
                name="unit"
                className="form-select"
                value={form.unit}
                onChange={updateField}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="unitCost">
                Cost Per Unit (₹) *
              </label>
              <input
                id="unitCost"
                name="unitCost"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={form.unitCost}
                onChange={updateField}
                placeholder="0.00"
                required
              />
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="expenseDate">
                Expense Date *
              </label>
              <input
                id="expenseDate"
                name="expenseDate"
                type="date"
                className="form-control"
                value={form.expenseDate}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={updateField}
                required
              />
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="supplier">
                Supplier / Vendor
              </label>
              <input
                id="supplier"
                name="supplier"
                className="form-control"
                value={form.supplier}
                onChange={updateField}
                placeholder="Supplier name"
                maxLength={150}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <label className="form-label fw-semibold" htmlFor="paymentMethod">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                className="form-select"
                value={form.paymentMethod}
                onChange={updateField}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="expenseReceipt">
                Receipt / Invoice (optional)
              </label>
              <input
                id="expenseReceipt"
                type="file"
                className="form-control"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;

                  if (file && file.size > 5 * 1024 * 1024) {
                    setError("Receipt must be 5 MB or smaller.");
                    event.target.value = "";
                    setReceipt(null);
                    return;
                  }

                  setError("");
                  setReceipt(file);
                }}
              />
              <div className="form-text">
                PDF, JPG, PNG or WEBP. Maximum 5 MB.
                {editingId &&
                  " Leave empty to keep the existing receipt."}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor="notes">
                Notes / Spending Details
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                className="form-control"
                value={form.notes}
                onChange={updateField}
                placeholder="Purpose of the expense, order reference or other details..."
                maxLength={1000}
              />
            </div>

            <div className="col-12">
              <div className="border rounded p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <span className="text-secondary small">
                    Calculated Total
                  </span>
                  <h4 className="fw-bold mb-0" style={{ color: MAROON }}>
                    {money(
                      Number(form.quantity || 0) *
                        Number(form.unitCost || 0)
                    )}
                  </h4>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetForm}
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    className="btn text-white"
                    style={{ backgroundColor: MAROON }}
                    disabled={saving}
                  >
                    <i className="bi bi-save me-2"></i>
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Expense"
                      : "Save Expense"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* FILTERS */}
      <section className="bg-white bg-opacity-95 p-3 p-md-4 mb-4">
        <h5 className="fw-bold mb-3" style={{ color: MAROON }}>
          <i className="bi bi-funnel me-2"></i>
          Filter Expense History
        </h5>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold" htmlFor="startDate">
              From Date
            </label>
            <input
              id="startDate"
              type="date"
              className="form-control"
              value={startDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold" htmlFor="endDate">
              To Date
            </label>
            <input
              id="endDate"
              type="date"
              className="form-control"
              value={endDate}
              min={startDate}
              max={new Date().toLocaleDateString("en-CA")}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold" htmlFor="categoryFilter">
              Category
            </label>
            <select
              id="categoryFilter"
              className="form-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: MAROON }}
              onClick={loadData}
              disabled={loading}
            >
              <i className="bi bi-search me-2"></i>
              Apply Filters
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setStartDate(
                  new Date().toLocaleDateString("en-CA").slice(0, 8) + "01"
                );
                setEndDate(new Date().toLocaleDateString("en-CA"));
                setCategoryFilter("");
              }}
            >
              This Month
            </button>
          </div>
        </div>
      </section>

      {/* EXPENSE TABLE */}
      <section className="bg-white bg-opacity-95 p-3 p-md-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold mb-1" style={{ color: MAROON }}>
              Expense History
            </h5>
            <p className="text-secondary small mb-0">
              {totalItems} record(s) matching the selected filters.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={loadData}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-2 mb-0">
              Loading expenses...
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-receipt fs-1 text-secondary"></i>
            <h6 className="fw-bold mt-3">No expenses found</h6>
            <p className="text-secondary mb-0">
              Add an expense or change your filters.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Expense / Item</th>
                  <th>Category</th>
                  <th>Material &amp; Colour</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Payment</th>
                  <th>Receipt</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-nowrap">
                      {expense.expenseDate}
                    </td>
                    <td>
                      <div className="fw-semibold">{expense.title}</div>
                      {expense.supplier && (
                        <small className="text-secondary">
                          {expense.supplier}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="badge text-bg-light border">
                        {expense.category}
                      </span>
                    </td>
                    <td>
                      <div>{expense.materialType || "—"}</div>
                      {expense.color && (
                        <small className="text-secondary">
                          {expense.color}
                        </small>
                      )}
                    </td>
                    <td className="text-nowrap">
                      {expense.quantity ?? "—"} {expense.unit || ""}
                    </td>
                    <td className="text-nowrap">
                      {money(expense.unitCost)}
                    </td>
                    <td className="fw-bold text-nowrap">
                      {money(expense.totalCost)}
                    </td>
                    <td>{expense.paymentMethod || "—"}</td>
                    <td>
                      {expense.receiptPath ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark text-nowrap"
                          onClick={() => handleReceiptDownload(expense.id)}
                        >
                          <i className="bi bi-download me-1"></i>
                          Receipt
                        </button>
                      ) : (
                        <span className="text-secondary small">
                          Not uploaded
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          title="Edit expense"
                          onClick={() => handleEdit(expense)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete expense"
                          onClick={() => handleDelete(expense)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="table-light">
                <tr>
                  <td colSpan="6" className="text-end fw-bold">
                    Total for displayed records
                  </td>
                  <td className="fw-bold text-nowrap">
                    {money(
                      expenses.reduce(
                        (total, expense) =>
                          total + Number(expense.totalCost || 0),
                        0
                      )
                    )}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ManageExpenses;
