"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronLeft,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type Opportunity = {
  id: string;
  name: string;
  description?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  stage?: string | null;
  probability?: number | null;
  expectedCloseDate?: string | null;
  notes?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  companyId?: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type OpportunityForm = {
  name: string;
  description: string;
  amount: string;
  currency: string;
  stage: string;
  probability: string;
  expectedCloseDate: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  notes: string;
};

const stages = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

const emptyForm: OpportunityForm = {
  name: "",
  description: "",
  amount: "",
  currency: "NGN",
  stage: "PROSPECTING",
  probability: "10",
  expectedCloseDate: "",
  companyId: "",
  contactId: "",
  ownerId: "",
  notes: "",
};

function formatStage(stage?: string | null) {
  if (!stage) return "Prospecting";

  return stage
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function formatAmount(
  amount?: string | number | null,
  currency = "NGN",
) {
  if (amount === null || amount === undefined || amount === "") {
    return "â€”";
  }

  const value = Number(amount);

  if (Number.isNaN(value)) return String(amount);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function stageClass(stage?: string | null) {
  switch (stage) {
    case "CLOSED_WON":
      return "bg-emerald-50 text-emerald-700";
    case "CLOSED_LOST":
      return "bg-red-50 text-red-700";
    case "NEGOTIATION":
      return "bg-purple-50 text-purple-700";
    case "PROPOSAL":
      return "bg-blue-50 text-blue-700";
    case "QUALIFICATION":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function OpportunitiesPage() {
  const router = useRouter();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<Opportunity | null>(null);

  const [form, setForm] =
    useState<OpportunityForm>(emptyForm);

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

      const requests = [
        api.get("/opportunities"),
        api.get("/companies"),
        api.get("/contacts"),
      ];

      const [opportunitiesResponse, companiesResponse, contactsResponse] =
        await Promise.all(requests);

      const opportunitiesData = Array.isArray(
        opportunitiesResponse.data,
      )
        ? opportunitiesResponse.data
        : opportunitiesResponse.data?.data || [];

      const companiesData = Array.isArray(
        companiesResponse.data,
      )
        ? companiesResponse.data
        : companiesResponse.data?.data || [];

      const contactsData = Array.isArray(
        contactsResponse.data,
      )
        ? contactsResponse.data
        : contactsResponse.data?.data || [];

      setOpportunities(opportunitiesData);
      setCompanies(companiesData);
      setContacts(contactsData);

      try {
        const usersResponse = await api.get("/users");

        const usersData = Array.isArray(usersResponse.data)
          ? usersResponse.data
          : usersResponse.data?.data || [];

        setUsers(usersData);
      } catch {
        setUsers([]);
      }
    } catch (err: any) {
      console.error("Opportunities error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load opportunities.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    const currentUser = getUser();

    setEditingOpportunity(null);

    setForm({
      ...emptyForm,
      ownerId: currentUser?.id || "",
    });

    setError("");
    setShowModal(true);
  }

  function openEditModal(opportunity: Opportunity) {
    setEditingOpportunity(opportunity);

    setForm({
      name: opportunity.name || "",
      description: opportunity.description || "",
      amount:
        opportunity.amount !== null &&
        opportunity.amount !== undefined
          ? String(opportunity.amount)
          : "",
      currency: opportunity.currency || "NGN",
      stage: opportunity.stage || "PROSPECTING",
      probability:
        opportunity.probability !== null &&
        opportunity.probability !== undefined
          ? String(opportunity.probability)
          : "10",
      expectedCloseDate: opportunity.expectedCloseDate
        ? opportunity.expectedCloseDate.slice(0, 10)
        : "",
      companyId: opportunity.company?.id || "",
      contactId: opportunity.contact?.id || "",
      ownerId: opportunity.owner?.id || "",
      notes: opportunity.notes || "",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingOpportunity(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof OpportunityForm,
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

    if (!form.name.trim()) {
      setError("Opportunity name is required.");
      return;
    }

    if (!form.ownerId) {
      setError("Please select an opportunity owner.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim() || undefined,
        amount: form.amount
          ? Number(form.amount)
          : undefined,
        currency: form.currency.trim() || "NGN",
        stage: form.stage,
        probability: form.probability
          ? Number(form.probability)
          : undefined,
        expectedCloseDate:
          form.expectedCloseDate || undefined,
        companyId: form.companyId || undefined,
        contactId: form.contactId || undefined,
        ownerId: form.ownerId,
        notes: form.notes.trim() || undefined,
      };

      if (editingOpportunity) {
        await api.patch(
          `/opportunities/${editingOpportunity.id}`,
          payload,
        );
      } else {
        await api.post("/opportunities", payload);
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error("Save opportunity error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save opportunity.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOpportunity(
    opportunity: Opportunity,
  ) {
    const confirmed = window.confirm(
      `Delete "${opportunity.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/opportunities/${opportunity.id}`,
      );

      await loadData();
    } catch (err: any) {
      console.error("Delete opportunity error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete opportunity.",
      );
    }
  }

  const filteredOpportunities = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return opportunities;

    return opportunities.filter((opportunity) => {
      const ownerName = opportunity.owner
        ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}`
        : "";

      const contactName = opportunity.contact
        ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
        : "";

      return [
        opportunity.name,
        opportunity.description,
        opportunity.stage,
        opportunity.company?.name,
        contactName,
        ownerName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(term),
        );
    });
  }, [opportunities, search]);

  const totalValue = opportunities.reduce(
    (sum, opportunity) =>
      sum + Number(opportunity.amount || 0),
    0,
  );

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
                Opportunities
              </h1>

              <p className="text-xs text-slate-500">
                Manage your sales opportunities
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">
              Add Opportunity
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Opportunities
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {opportunities.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pipeline Value
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatAmount(totalValue)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Closed Won
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {
                opportunities.filter(
                  (item) => item.stage === "CLOSED_WON",
                ).length
              }
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sales Opportunities
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {opportunities.length}{" "}
              {opportunities.length === 1
                ? "opportunity"
                : "opportunities"}{" "}
              in your CRM
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search opportunities..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {error && !showModal && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading opportunities...
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search
                ? "No opportunities found"
                : "No opportunities yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Create your first opportunity to start tracking your sales pipeline."}
            </p>

            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Opportunity
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map(
              (opportunity) => (
                <div
                  key={opportunity.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BriefcaseBusiness size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {opportunity.name}
                        </h3>

                        <p className="truncate text-xs text-slate-500">
                          {opportunity.company?.name ||
                            "No company"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          openEditModal(opportunity)
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        title="Edit opportunity"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() =>
                          deleteOpportunity(
                            opportunity,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete opportunity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatAmount(
                        opportunity.amount,
                        opportunity.currency ||
                          "NGN",
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stageClass(
                          opportunity.stage,
                        )}`}
                      >
                        {formatStage(
                          opportunity.stage,
                        )}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {opportunity.probability ?? 0}%
                        probability
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    {opportunity.contact && (
                      <p>
                        <span className="font-medium text-slate-800">
                          Contact:
                        </span>{" "}
                        {opportunity.contact.firstName}{" "}
                        {opportunity.contact.lastName}
                      </p>
                    )}

                    {opportunity.expectedCloseDate && (
                      <p>
                        <span className="font-medium text-slate-800">
                          Expected close:
                        </span>{" "}
                        {new Date(
                          opportunity.expectedCloseDate,
                        ).toLocaleDateString()}
                      </p>
                    )}

                    {opportunity.owner && (
                      <p>
                        <span className="font-medium text-slate-800">
                          Owner:
                        </span>{" "}
                        {opportunity.owner.firstName}{" "}
                        {opportunity.owner.lastName}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <button
                      onClick={() =>
                        openEditModal(opportunity)
                      }
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View / Edit opportunity
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingOpportunity
                    ? "Edit Opportunity"
                    : "Add Opportunity"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingOpportunity
                    ? "Update opportunity information"
                    : "Create a new sales opportunity"}
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
                    Opportunity Name *
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value,
                      )
                    }
                    required
                    placeholder="e.g. FCMB Network Upgrade"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
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
                    Contact
                  </label>

                  <select
                    value={form.contactId}
                    onChange={(event) =>
                      updateField(
                        "contactId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      No contact
                    </option>

                    {contacts.map((contact) => (
                      <option
                        key={contact.id}
                        value={contact.id}
                      >
                        {contact.firstName}{" "}
                        {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      updateField(
                        "amount",
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Currency
                  </label>

                  <input
                    value={form.currency}
                    onChange={(event) =>
                      updateField(
                        "currency",
                        event.target.value.toUpperCase(),
                      )
                    }
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Stage
                  </label>

                  <select
                    value={form.stage}
                    onChange={(event) =>
                      updateField(
                        "stage",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {stages.map((stage) => (
                      <option
                        key={stage}
                        value={stage}
                      >
                        {formatStage(stage)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Probability (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={(event) =>
                      updateField(
                        "probability",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Expected Close Date
                  </label>

                  <input
                    type="date"
                    value={form.expectedCloseDate}
                    onChange={(event) =>
                      updateField(
                        "expectedCloseDate",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Owner *
                  </label>

                  <select
                    value={form.ownerId}
                    onChange={(event) =>
                      updateField(
                        "ownerId",
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Select owner
                    </option>

                    {users.map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Describe this opportunity..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
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
                    rows={3}
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
                    : editingOpportunity
                      ? "Save Changes"
                      : "Create Opportunity"}
                </button>
              </div>
            </form>
                    </div>
        </div>
      )}
    </div>
  );
}
