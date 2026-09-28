"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronLeft,
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type ActivityRecord = {
  id: string;
  type: string;
  status: string;
  subject?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt?: string;
  companyId?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  company?: {
    id: string;
    name: string;
  };
  contact?: {
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
};

type Lead = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  company?: {
    name: string;
  };
};

type Opportunity = {
  id: string;
  name: string;
};

type ActivityForm = {
  type: string;
  status: string;
  subject: string;
  description: string;
  dueDate: string;
  companyId: string;
  contactId: string;
  leadId: string;
  opportunityId: string;
};

const emptyForm: ActivityForm = {
  type: "CALL",
  status: "PENDING",
  subject: "",
  description: "",
  dueDate: "",
  companyId: "",
  contactId: "",
  leadId: "",
  opportunityId: "",
};

const activityTypes = [
  "CALL",
  "MEETING",
  "EMAIL",
  "TASK",
  "NOTE",
];

const activityStatuses = [
  "PENDING",
  "COMPLETED",
  "CANCELLED",
];

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

function formatDate(value?: string) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function typeIcon(type: string) {
  switch (type) {
    case "CALL":
      return Phone;
    case "EMAIL":
      return Mail;
    case "MEETING":
      return Video;
    case "TASK":
      return Calendar;
    default:
      return Activity;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default function ActivitiesPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<
    ActivityRecord[]
  >([]);

  const [companies, setCompanies] = useState<
    Company[]
  >([]);

  const [contacts, setContacts] = useState<
    Contact[]
  >([]);

  const [leads, setLeads] = useState<Lead[]>([]);

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<ActivityForm>(emptyForm);

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

      const [
        activitiesResponse,
        companiesResponse,
        contactsResponse,
        leadsResponse,
        opportunitiesResponse,
      ] = await Promise.all([
        api.get("/activities"),
        api.get("/companies"),
        api.get("/contacts"),
        api.get("/leads"),
        api.get("/opportunities"),
      ]);

      setActivities(
        Array.isArray(
          activitiesResponse.data,
        )
          ? activitiesResponse.data
          : activitiesResponse.data?.data ||
              [],
      );

      setCompanies(
        Array.isArray(companiesResponse.data)
          ? companiesResponse.data
          : companiesResponse.data?.data ||
              [],
      );

      setContacts(
        Array.isArray(contactsResponse.data)
          ? contactsResponse.data
          : contactsResponse.data?.data ||
              [],
      );

      setLeads(
        Array.isArray(leadsResponse.data)
          ? leadsResponse.data
          : leadsResponse.data?.data || [],
      );

      setOpportunities(
        Array.isArray(
          opportunitiesResponse.data,
        )
          ? opportunitiesResponse.data
          : opportunitiesResponse.data
                ?.data || [],
      );
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        "Unable to load activities.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(activity: ActivityRecord) {
    setEditingId(activity.id);

    setForm({
      type: activity.type || "CALL",
      status: activity.status || "PENDING",
      subject:
        activity.subject ||
        activity.title ||
        "",
      description:
        activity.description || "",
      dueDate: activity.dueDate
        ? new Date(activity.dueDate)
            .toISOString()
            .slice(0, 16)
        : "",
      companyId:
        activity.companyId ||
        activity.company?.id ||
        "",
      contactId:
        activity.contactId ||
        activity.contact?.id ||
        "",
      leadId: activity.leadId || "",
      opportunityId:
        activity.opportunityId || "",
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
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!form.subject.trim()) {
      setError(
        "Please enter an activity subject.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: Record<
        string,
        string
      > = {
        type: form.type,
        status: form.status,
        subject: form.subject.trim(),
      };

      if (form.description.trim()) {
        payload.description =
          form.description.trim();
      }

      if (form.dueDate) {
        payload.dueDate = new Date(
          form.dueDate,
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

      if (form.leadId) {
        payload.leadId = form.leadId;
      }

      if (form.opportunityId) {
        payload.opportunityId =
          form.opportunityId;
      }

      if (editingId) {
        await api.patch(
          `/activities/${editingId}`,
          payload,
        );
      } else {
        await api.post(
          "/activities",
          payload,
        );
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      const backendMessage =
        err?.response?.data?.message;

      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage ||
              "Unable to save activity.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteActivity(
    id: string,
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this activity?",
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/activities/${id}`,
      );

      setActivities((current) =>
        current.filter(
          (activity) =>
            activity.id !== id,
        ),
      );
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        "Unable to delete activity.",
      );
    }
  }

  async function markCompleted(
    activity: ActivityRecord,
  ) {
    try {
      setError("");

      await api.patch(
        `/activities/${activity.id}`,
        {
          status: "COMPLETED",
        },
      );

      setActivities((current) =>
        current.map((item) =>
          item.id === activity.id
            ? {
                ...item,
                status: "COMPLETED",
              }
            : item,
        ),
      );
    } catch (err: any) {
      console.error(err);

      setError(
        "Unable to complete activity.",
      );
    }
  }

  const filteredActivities =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return activities.filter(
        (activity) => {
          const matchesSearch =
            !query ||
            (
              activity.subject ||
              activity.title ||
              ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              activity.description || ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              activity.company?.name ||
              ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              activity.contact
                ? `${activity.contact.firstName} ${activity.contact.lastName}`
                : ""
            )
              .toLowerCase()
              .includes(query);

          const matchesType =
            typeFilter === "ALL" ||
            activity.type === typeFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            activity.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        },
      );
    }, [
      activities,
      search,
      typeFilter,
      statusFilter,
    ]);

  const totalActivities =
    activities.length;

  const pendingActivities =
    activities.filter(
      (activity) =>
        activity.status === "PENDING",
    ).length;

  const completedActivities =
    activities.filter(
      (activity) =>
        activity.status === "COMPLETED",
    ).length;

  const meetings =
    activities.filter(
      (activity) =>
        activity.type === "MEETING",
    ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
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
                Activities
              </h1>

              <p className="text-xs text-slate-500">
                Calls, meetings, emails, tasks and notes
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">
              New Activity
            </span>
          </button>
        </div>
      </header>

      <main className="space-y-6 p-4 sm:p-6">
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              className="font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            Activity Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track every important interaction with your customers and prospects.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Activities"
            value={totalActivities}
            icon={Activity}
            description="All logged activities"
          />

          <SummaryCard
            label="Pending"
            value={pendingActivities}
            icon={Calendar}
            description="Activities awaiting completion"
          />

          <SummaryCard
            label="Completed"
            value={completedActivities}
            icon={Activity}
            description="Successfully completed"
          />

          <SummaryCard
            label="Meetings"
            value={meetings}
            icon={Video}
            description="Scheduled meetings"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Activity History
                </h3>

                <p className="text-xs text-slate-500">
                  {filteredActivities.length} activities shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
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
                    placeholder="Search activities..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white sm:w-64"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="ALL">
                    All Types
                  </option>

                  {activityTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {formatLabel(type)}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="ALL">
                    All Statuses
                  </option>

                  {activityStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatLabel(
                          status,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading activities...
            </div>
          ) : filteredActivities.length ===
            0 ? (
            <div className="p-12 text-center">
              <Activity
                size={34}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-3 font-semibold text-slate-700">
                No activities found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Create your first activity to start tracking customer interactions.
              </p>

              <button
                onClick={openCreate}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Activity
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">
                        Activity
                      </th>

                      <th className="px-5 py-3">
                        Type
                      </th>

                      <th className="px-5 py-3">
                        Related To
                      </th>

                      <th className="px-5 py-3">
                        Due Date
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredActivities.map(
                      (activity) => {
                        const Icon =
                          typeIcon(
                            activity.type,
                          );

                        const related =
                          activity.company
                            ?.name ||
                          (activity.contact
                            ? `${activity.contact.firstName} ${activity.contact.lastName}`
                            : "â€”");

                        return (
                          <tr
                            key={
                              activity.id
                            }
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <Icon
                                    size={17}
                                  />
                                </div>

                                <div>
                                  <p className="font-medium text-slate-900">
                                    {activity.subject ||
                                      activity.title ||
                                      "Untitled activity"}
                                  </p>

                                  {activity.description && (
                                    <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                                      {
                                        activity.description
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatLabel(
                                activity.type,
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {related}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatDate(
                                activity.dueDate,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  activity.status,
                                )}`}
                              >
                                {formatLabel(
                                  activity.status,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                {activity.status !==
                                  "COMPLETED" && (
                                  <button
                                    onClick={() =>
                                      markCompleted(
                                        activity,
                                      )
                                    }
                                    title="Mark completed"
                                    className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <Activity
                                      size={
                                        16
                                      }
                                    />
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    openEdit(
                                      activity,
                                    )
                                  }
                                  title="Edit"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                                >
                                  <Edit3
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    deleteActivity(
                                      activity.id,
                                    )
                                  }
                                  title="Delete"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredActivities.map(
                  (activity) => {
                    const Icon =
                      typeIcon(
                        activity.type,
                      );

                    const related =
                      activity.company
                        ?.name ||
                      (activity.contact
                        ? `${activity.contact.firstName} ${activity.contact.lastName}`
                        : "No linked record");

                    return (
                      <div
                        key={activity.id}
                        className="p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Icon
                              size={18}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {activity.subject ||
                                    activity.title ||
                                    "Untitled activity"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatLabel(
                                    activity.type,
                                  )}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass(
                                  activity.status,
                                )}`}
                              >
                                {formatLabel(
                                  activity.status,
                                )}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-slate-400">
                                  Related
                                </p>

                                <p className="mt-1 truncate font-medium text-slate-700">
                                  {related}
                                </p>
                              </div>

                              <div>
                                <p className="text-slate-400">
                                  Due
                                </p>

                                <p className="mt-1 font-medium text-slate-700">
                                  {formatDate(
                                    activity.dueDate,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex justify-end gap-2">
                              {activity.status !==
                                "COMPLETED" && (
                                <button
                                  onClick={() =>
                                    markCompleted(
                                      activity,
                                    )
                                  }
                                  className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                                >
                                  Complete
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  openEdit(
                                    activity,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  deleteActivity(
                                    activity.id,
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </>
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
                    ? "Edit Activity"
                    : "New Activity"}
                </h2>

                <p className="text-xs text-slate-500">
                  Record a customer or sales interaction.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                  label="Activity Type"
                  required
                >
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target
                          .value,
                      })
                    }
                    className="input"
                  >
                    {activityTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {formatLabel(type)}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field
                  label="Status"
                  required
                >
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target
                            .value,
                      })
                    }
                    className="input"
                  >
                    {activityStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatLabel(
                            status,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
              </div>

              <Field
                label="Subject"
                required
              >
                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      subject:
                        event.target.value,
                    })
                  }
                  placeholder="e.g. Follow up with FCMB"
                  className="input"
                  required
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Add activity details..."
                  className="input resize-none"
                />
              </Field>

              <Field label="Due Date">
                <input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      dueDate:
                        event.target.value,
                    })
                  }
                  className="input"
                />
              </Field>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                  Link Activity
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
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
                            key={
                              company.id
                            }
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
                            key={
                              contact.id
                            }
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

                  <Field label="Lead">
                    <select
                      value={form.leadId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          leadId:
                            event.target
                              .value,
                        })
                      }
                      className="input"
                    >
                      <option value="">
                        No lead
                      </option>

                      {leads.map(
                        (lead) => (
                          <option
                            key={lead.id}
                            value={lead.id}
                          >
                            {lead.name ||
                              `${lead.firstName || ""} ${lead.lastName || ""}`.trim() ||
                              "Unnamed lead"}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>

                  <Field label="Opportunity">
                    <select
                      value={
                        form.opportunityId
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          opportunityId:
                            event.target
                              .value,
                        })
                      }
                      className="input"
                    >
                      <option value="">
                        No opportunity
                      </option>

                      {opportunities.map(
                        (
                          opportunity,
                        ) => (
                          <option
                            key={
                              opportunity.id
                            }
                            value={
                              opportunity.id
                            }
                          >
                            {
                              opportunity.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
                      : "Create Activity"}
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
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

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value.toLocaleString(
              "en-NG",
            )}
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

