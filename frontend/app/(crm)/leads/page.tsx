"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type Lead = {
  id: string;
  organizationId: string;
  companyId?: string | null;
  contactId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  source: string;
  status: string;
  notes?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  company?: {
    id: string;
    name: string;
  } | null;
};

type Company = {
  id: string;
  name: string;
};

type LeadForm = {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  source: string;
  status: string;
  notes: string;
};

const emptyForm: LeadForm = {
  companyId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  source: "OTHER",
  status: "NEW",
  notes: "",
};

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

const sourceOptions = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "ADVERTISEMENT", label: "Advertisement" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
];

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string) {
  switch (status) {
    case "QUALIFIED":
      return "bg-emerald-50 text-emerald-700";
    case "CONVERTED":
      return "bg-blue-50 text-blue-700";
    case "CONTACTED":
      return "bg-amber-50 text-amber-700";
    case "UNQUALIFIED":
      return "bg-slate-100 text-slate-600";
    case "LOST":
      return "bg-red-50 text-red-700";
    default:
      return "bg-violet-50 text-violet-700";
  }
}

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [leadsResponse, companiesResponse] = await Promise.all([
        api.get("/leads"),
        api.get("/companies"),
      ]);

      const leadsData = Array.isArray(leadsResponse.data)
        ? leadsResponse.data
        : leadsResponse.data?.data || [];

      const companiesData = Array.isArray(companiesResponse.data)
        ? companiesResponse.data
        : companiesResponse.data?.data || [];

      setLeads(leadsData);
      setCompanies(companiesData);
    } catch (err: any) {
      console.error("Leads error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load leads.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingLead(null);

    setForm({
      ...emptyForm,
      companyId: "",
    });

    setError("");
    setShowModal(true);
  }

  function openEditModal(lead: Lead) {
    setEditingLead(lead);

    setForm({
      companyId: lead.companyId || "",
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      jobTitle: lead.jobTitle || "",
      source: lead.source || "OTHER",
      status: lead.status || "NEW",
      notes: lead.notes || "",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingLead(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof LeadForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        companyId: form.companyId || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        source: form.source,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };

      if (editingLead) {
        await api.patch(
          `/leads/${editingLead.id}`,
          payload,
        );
      } else {
        await api.post("/leads", payload);
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error("Save lead error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveLead(lead: Lead) {
    const confirmed = window.confirm(
      `Archive "${lead.firstName} ${lead.lastName}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/leads/${lead.id}`);

      await loadData();
    } catch (err: any) {
      console.error("Archive lead error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to archive lead.",
      );
    }
  }

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const companyName =
        lead.company?.name ||
        companies.find(
          (company) => company.id === lead.companyId,
        )?.name ||
        "";

      const matchesSearch =
        !term ||
        [
          lead.firstName,
          lead.lastName,
          lead.email,
          lead.phone,
          lead.jobTitle,
          lead.source,
          lead.status,
          companyName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(term),
          );

      const matchesStatus =
        statusFilter === "ALL" ||
        lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, companies, search, statusFilter]);

  function getCompanyName(lead: Lead) {
    return (
      lead.company?.name ||
      companies.find(
        (company) => company.id === lead.companyId,
      )?.name ||
      "No company"
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft size={20} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Leads
              </h1>

              <p className="text-xs text-slate-500">
                Manage and qualify potential customers
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Add Lead
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Lead Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {leads.length}{" "}
            {leads.length === 1 ? "lead" : "leads"} in your
            CRM
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search leads..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All statuses</option>

            {statusOptions.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {error && !showModal && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading leads...
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== "ALL"
                ? "No leads found"
                : "No leads yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search || statusFilter !== "ALL"
                ? "Try changing your search or status filter."
                : "Add your first lead to start tracking potential customers."}
            </p>

            {!search && statusFilter === "ALL" && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Lead
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <UserRound size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {lead.firstName}{" "}
                              {lead.lastName}
                            </p>

                            <p className="text-xs text-slate-500">
                              {lead.jobTitle ||
                                "No job title"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {getCompanyName(lead)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {lead.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail
                                size={14}
                                className="text-slate-400"
                              />
                              {lead.email}
                            </div>
                          )}

                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone
                                size={14}
                                className="text-slate-400"
                              />
                              {lead.phone}
                            </div>
                          )}

                          {!lead.email && !lead.phone && (
                            <span className="text-sm text-slate-400">
                              No contact details
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatLabel(lead.source)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            lead.status,
                          )}`}
                        >
                          {formatLabel(lead.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() =>
                              openEditModal(lead)
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                            title="Edit lead"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() =>
                              archiveLead(lead)
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Archive lead"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingLead
                    ? "Edit Lead"
                    : "Add Lead"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingLead
                    ? "Update lead information"
                    : "Create a new lead record"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Company
                  </label>

                  <select
                    value={form.companyId}
                    onChange={(event) =>
                      updateField(
                        "companyId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      No company
                    </option>

                    {companies.map((company) => (
                      <option
                        key={company.id}
                        value={company.id}
                      >
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First Name *
                  </label>

                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      updateField(
                        "firstName",
                        event.target.value,
                      )
                    }
                    required
                    placeholder="John"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Last Name *
                  </label>

                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      updateField(
                        "lastName",
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Doe"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="+234..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job Title
                  </label>

                  <input
                    value={form.jobTitle}
                    onChange={(event) =>
                      updateField(
                        "jobTitle",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Managing Director"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Source
                  </label>

                  <select
                    value={form.source}
                    onChange={(event) =>
                      updateField(
                        "source",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {sourceOptions.map((source) => (
                      <option
                        key={source.value}
                        value={source.value}
                      >
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {statusOptions.map((status) => (
                      <option
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Additional notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingLead
                      ? "Save Changes"
                      : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
