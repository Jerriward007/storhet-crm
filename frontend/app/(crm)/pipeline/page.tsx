"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type Opportunity = {
  id: string;
  name: string;
  description?: string;
  amount?: number | string;
  currency?: string;
  stage: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  companyId?: string;
  contactId?: string;
  ownerId?: string;
  company?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
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
  email: string;
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

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function amountValue(value?: number | string) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : 0;
}

function formatCurrency(
  value?: number | string,
  currency = "NGN",
) {
  const amount = amountValue(value);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return "No close date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No close date";
  }

  return date.toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function stageClass(stage: string) {
  switch (stage) {
    case "PROSPECTING":
      return "border-slate-200 bg-slate-50";

    case "QUALIFICATION":
      return "border-blue-200 bg-blue-50";

    case "PROPOSAL":
      return "border-violet-200 bg-violet-50";

    case "NEGOTIATION":
      return "border-amber-200 bg-amber-50";

    case "CLOSED_WON":
      return "border-emerald-200 bg-emerald-50";

    case "CLOSED_LOST":
      return "border-red-200 bg-red-50";

    default:
      return "border-slate-200 bg-white";
  }
}

function stageBadgeClass(stage: string) {
  switch (stage) {
    case "PROSPECTING":
      return "bg-slate-100 text-slate-700";

    case "QUALIFICATION":
      return "bg-blue-100 text-blue-700";

    case "PROPOSAL":
      return "bg-violet-100 text-violet-700";

    case "NEGOTIATION":
      return "bg-amber-100 text-amber-700";

    case "CLOSED_WON":
      return "bg-emerald-100 text-emerald-700";

    case "CLOSED_LOST":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PipelinePage() {
  const router = useRouter();

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [contacts, setContacts] =
    useState<Contact[]>([]);

  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<OpportunityForm>(
      emptyForm,
    );

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    loadData();
  }, [router]);

  async function loadData(
    showRefresh = false,
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results =
        await Promise.allSettled([
          api.get("/opportunities"),
          api.get("/companies"),
          api.get("/contacts"),
          api.get("/users"),
        ]);

      if (
        results.some(
          (result) =>
            result.status === "rejected" &&
            result.reason?.response
              ?.status === 401,
        )
      ) {
        router.replace("/login");
        return;
      }

      const opportunityResult =
        results[0];

      if (
        opportunityResult.status ===
        "fulfilled"
      ) {
        setOpportunities(
          Array.isArray(
            opportunityResult.value.data,
          )
            ? opportunityResult.value.data
            : opportunityResult.value
                  .data?.data || [],
        );
      }

      const companiesResult =
        results[1];

      if (
        companiesResult.status ===
        "fulfilled"
      ) {
        setCompanies(
          Array.isArray(
            companiesResult.value.data,
          )
            ? companiesResult.value.data
            : companiesResult.value.data
                  ?.data || [],
        );
      }

      const contactsResult =
        results[2];

      if (
        contactsResult.status ===
        "fulfilled"
      ) {
        setContacts(
          Array.isArray(
            contactsResult.value.data,
          )
            ? contactsResult.value.data
            : contactsResult.value.data
                  ?.data || [],
        );
      }

      const usersResult = results[3];

      if (
        usersResult.status ===
        "fulfilled"
      ) {
        setUsers(
          Array.isArray(
            usersResult.value.data,
          )
            ? usersResult.value.data
            : usersResult.value.data
                  ?.data || [],
        );
      }
    } catch (err: any) {
      console.error(err);

      if (
        err?.response?.status === 401
      ) {
        router.replace("/login");
        return;
      }

      setError(
        "Unable to load pipeline data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openCreate(stage = "PROSPECTING") {
    const currentUser = getUser();

    setEditingId(null);

    setForm({
      ...emptyForm,
      stage,
      ownerId:
        currentUser?.id || "",
    });

    setShowModal(true);
  }

  function openEdit(
    opportunity: Opportunity,
  ) {
    setEditingId(opportunity.id);

    setForm({
      name: opportunity.name || "",
      description:
        opportunity.description || "",
      amount:
        opportunity.amount !==
          undefined &&
        opportunity.amount !== null
          ? String(opportunity.amount)
          : "",
      currency:
        opportunity.currency || "NGN",
      stage:
        opportunity.stage ||
        "PROSPECTING",
      probability:
        opportunity.probability !==
          undefined
          ? String(
              opportunity.probability,
            )
          : "10",
      expectedCloseDate:
        opportunity.expectedCloseDate
          ? new Date(
              opportunity.expectedCloseDate,
            )
              .toISOString()
              .slice(0, 10)
          : "",
      companyId:
        opportunity.companyId ||
        opportunity.company?.id ||
        "",
      contactId:
        opportunity.contactId ||
        opportunity.contact?.id ||
        "",
      ownerId:
        opportunity.ownerId ||
        opportunity.owner?.id ||
        "",
      notes: opportunity.notes || "",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Opportunity name is required.",
      );
      return;
    }

    if (!form.ownerId) {
      setError(
        "Please select an opportunity owner.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: Record<
        string,
        string | number
      > = {
        name: form.name.trim(),
        ownerId: form.ownerId,
        stage: form.stage,
      };

      if (form.description.trim()) {
        payload.description =
          form.description.trim();
      }

      if (form.amount) {
        payload.amount =
          Number(form.amount);
      }

      if (form.currency) {
        payload.currency =
          form.currency;
      }

      if (form.probability) {
        payload.probability =
          Number(form.probability);
      }

      if (form.expectedCloseDate) {
        payload.expectedCloseDate =
          new Date(
            form.expectedCloseDate,
          ).toISOString();
      }

      if (form.companyId) {
        payload.companyId =
          form.companyId;
      }

      if (form.contactId) {
        payload.contactId =
          form.contactId;
      }

      if (form.notes.trim()) {
        payload.notes =
          form.notes.trim();
      }

      if (editingId) {
        await api.patch(
          `/opportunities/${editingId}`,
          payload,
        );
      } else {
        await api.post(
          "/opportunities",
          payload,
        );
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error(err);

      if (
        err?.response?.status === 401
      ) {
        router.replace("/login");
        return;
      }

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message ||
              "Unable to save opportunity.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOpportunity(
    id: string,
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this opportunity?",
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/opportunities/${id}`,
      );

      setOpportunities((current) =>
        current.filter(
          (item) => item.id !== id,
        ),
      );
    } catch (err: any) {
      console.error(err);

      setError(
        "Unable to delete opportunity.",
      );
    }
  }

  const filteredOpportunities =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return opportunities;
      }

      return opportunities.filter(
        (opportunity) =>
          opportunity.name
            .toLowerCase()
            .includes(query) ||
          (
            opportunity.company?.name ||
            ""
          )
            .toLowerCase()
            .includes(query) ||
          (
            opportunity.contact
              ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
              : ""
          )
            .toLowerCase()
            .includes(query),
      );
    }, [opportunities, search]);

  const stageData = stages.map(
    (stage) => ({
      stage,
      opportunities:
        filteredOpportunities.filter(
          (opportunity) =>
            opportunity.stage === stage,
        ),
    }),
  );

  const totalValue =
    filteredOpportunities.reduce(
      (sum, opportunity) =>
        sum +
        amountValue(opportunity.amount),
      0,
    );

  const weightedValue =
    filteredOpportunities.reduce(
      (sum, opportunity) =>
        sum +
        amountValue(
          opportunity.amount,
        ) *
          (Number(
            opportunity.probability,
          ) || 0) /
          100,
      0,
    );

  const wonValue =
    filteredOpportunities
      .filter(
        (opportunity) =>
          opportunity.stage ===
          "CLOSED_WON",
      )
      .reduce(
        (sum, opportunity) =>
          sum +
          amountValue(
            opportunity.amount,
          ),
        0,
      );

  const openCount =
    filteredOpportunities.filter(
      (opportunity) =>
        opportunity.stage !==
          "CLOSED_WON" &&
        opportunity.stage !==
          "CLOSED_LOST",
    ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push("/")
              }
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft size={20} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Sales Pipeline
              </h1>

              <p className="text-xs text-slate-500">
                Manage opportunities through every sales stage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                loadData(true)
              }
              disabled={refreshing}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <button
              onClick={() =>
                openCreate()
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">
                New Opportunity
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-6 p-4 sm:p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            Pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Visualize and manage your sales opportunities from prospecting to close.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Pipeline Value"
            value={formatCurrency(
              totalValue,
            )}
            icon={TrendingUp}
            description="Total opportunity value"
          />

          <SummaryCard
            label="Weighted Value"
            value={formatCurrency(
              weightedValue,
            )}
            icon={Target}
            description="Probability-adjusted value"
          />

          <SummaryCard
            label="Open Opportunities"
            value={openCount.toLocaleString(
              "en-NG",
            )}
            icon={TrendingUp}
            description="Active sales opportunities"
          />

          <SummaryCard
            label="Closed Won"
            value={formatCurrency(
              wonValue,
            )}
            icon={Target}
            description="Won opportunity value"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Opportunity Pipeline
              </h3>

              <p className="text-xs text-slate-500">
                Drag-style pipeline view for your sales process
              </p>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search opportunities..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white sm:w-72"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading pipeline...
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[1300px] gap-4">
                {stageData.map(
                  ({
                    stage,
                    opportunities:
                      stageOpportunities,
                  }) => {
                    const stageValue =
                      stageOpportunities.reduce(
                        (
                          sum,
                          opportunity,
                        ) =>
                          sum +
                          amountValue(
                            opportunity.amount,
                          ),
                        0,
                      );

                    return (
                      <div
                        key={stage}
                        className={`w-[210px] shrink-0 rounded-2xl border ${stageClass(
                          stage,
                        )} p-3`}
                      >
                        <div className="mb-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-800">
                              {formatLabel(
                                stage,
                              )}
                            </h4>

                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm">
                              {
                                stageOpportunities.length
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {formatCurrency(
                              stageValue,
                            )}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {stageOpportunities.length ===
                          0 ? (
                            <button
                              onClick={() =>
                                openCreate(
                                  stage,
                                )
                              }
                              className="w-full rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-5 text-center text-xs font-medium text-slate-400 hover:border-blue-300 hover:text-blue-600"
                            >
                              + Add opportunity
                            </button>
                          ) : (
                            stageOpportunities.map(
                              (
                                opportunity,
                              ) => (
                                <OpportunityCard
                                  key={
                                    opportunity.id
                                  }
                                  opportunity={
                                    opportunity
                                  }
                                  onEdit={() =>
                                    openEdit(
                                      opportunity,
                                    )
                                  }
                                  onDelete={() =>
                                    deleteOpportunity(
                                      opportunity.id,
                                    )
                                  }
                                />
                              ),
                            )
                          )}

                          {stageOpportunities.length >
                            0 && (
                            <button
                              onClick={() =>
                                openCreate(
                                  stage,
                                )
                              }
                              className="w-full rounded-lg py-1.5 text-xs font-semibold text-slate-400 hover:bg-white hover:text-blue-600"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? "Edit Opportunity"
                    : "New Opportunity"}
                </h2>

                <p className="text-xs text-slate-500">
                  Manage the opportunity and its sales details.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Opportunity Name"
                  required
                >
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target
                          .value,
                      })
                    }
                    placeholder="e.g. FCMB SolarWinds Renewal"
                    className="input"
                    required
                  />
                </Field>

                <Field
                  label="Stage"
                  required
                >
                  <select
                    value={form.stage}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        stage:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  >
                    {stages.map(
                      (stage) => (
                        <option
                          key={stage}
                          value={stage}
                        >
                          {formatLabel(
                            stage,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Amount">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        amount:
                          event.target
                            .value,
                      })
                    }
                    placeholder="0"
                    className="input"
                  />
                </Field>

                <Field label="Currency">
                  <select
                    value={form.currency}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        currency:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  >
                    <option value="NGN">
                      NGN
                    </option>
                    <option value="USD">
                      USD
                    </option>
                    <option value="GBP">
                      GBP
                    </option>
                    <option value="EUR">
                      EUR
                    </option>
                  </select>
                </Field>

                <Field label="Probability (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.probability
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        probability:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  />
                </Field>

                <Field label="Expected Close Date">
                  <input
                    type="date"
                    value={
                      form.expectedCloseDate
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        expectedCloseDate:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  />
                </Field>

                <Field label="Company">
                  <select
                    value={
                      form.companyId
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        companyId:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  >
                    <option value="">
                      No company
                    </option>

                    {companies.map(
                      (company) => (
                        <option
                          key={company.id}
                          value={
                            company.id
                          }
                        >
                          {company.name}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Contact">
                  <select
                    value={
                      form.contactId
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        contactId:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  >
                    <option value="">
                      No contact
                    </option>

                    {contacts.map(
                      (contact) => (
                        <option
                          key={contact.id}
                          value={
                            contact.id
                          }
                        >
                          {
                            contact.firstName
                          }{" "}
                          {
                            contact.lastName
                          }
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Owner">
                  <select
                    value={form.ownerId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        ownerId:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                    required
                  >
                    <option value="">
                      Select owner
                    </option>

                    {users.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {
                            user.firstName
                          }{" "}
                          {user.lastName}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target
                          .value,
                    })
                  }
                  rows={3}
                  placeholder="Describe this opportunity..."
                  className="input resize-none"
                />
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target
                        .value,
                    })
                  }
                  rows={3}
                  placeholder="Additional notes..."
                  className="input resize-none"
                />
              </Field>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.7rem 0.8rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px
            rgb(59 130 246 / 0.1);
        }
      `}</style>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onEdit,
  onDelete,
}: {
  opportunity: Opportunity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const amount = amountValue(
    opportunity.amount,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onEdit}
          className="min-w-0 text-left"
        >
          <p className="truncate text-sm font-semibold text-slate-900 hover:text-blue-600">
            {opportunity.name}
          </p>
        </button>

        <div className="flex shrink-0">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Edit3 size={13} />
          </button>

          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {formatCurrency(
          amount,
          opportunity.currency ||
            "NGN",
        )}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500">
          {opportunity.probability ??
            0}
          % probability
        </span>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageBadgeClass(
            opportunity.stage,
          )}`}
        >
          {formatLabel(
            opportunity.stage,
          )}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                Number(
                  opportunity.probability,
                ) || 0,
              ),
            )}%`,
          }}
        />
      </div>

      <div className="mt-3 space-y-1 text-[11px] text-slate-400">
        {opportunity.company?.name && (
          <p className="truncate">
            {opportunity.company.name}
          </p>
        )}

        <p>
          Close:{" "}
          {formatDate(
            opportunity.expectedCloseDate,
          )}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    size?: number;
  }>;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

