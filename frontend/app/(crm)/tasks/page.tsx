"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Edit3,
  ListTodo,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  opportunity?: {
    id: string;
    name: string;
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
};

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
};

type Opportunity = {
  id: string;
  name: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type TaskForm = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: string;
  companyId: string;
  contactId: string;
  leadId: string;
  opportunityId: string;
};

const statuses = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const priorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const emptyForm: TaskForm = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  assigneeId: "",
  companyId: "",
  contactId: "",
  leadId: "",
  opportunityId: "",
};

function formatLabel(value?: string | null) {
  if (!value) return "â€”";

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function priorityClass(priority?: string | null) {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700";
    case "HIGH":
      return "bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDueDate(date?: string | null) {
  if (!date) return "No due date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState<TaskForm>(emptyForm);

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

      const results = await Promise.allSettled([
        api.get("/tasks"),
        api.get("/companies"),
        api.get("/contacts"),
        api.get("/leads"),
        api.get("/opportunities"),
      ]);

      const tasksResult = results[0];
      const companiesResult = results[1];
      const contactsResult = results[2];
      const leadsResult = results[3];
      const opportunitiesResult = results[4];

      if (tasksResult.status === "rejected") {
        if (tasksResult.reason?.response?.status === 401) {
          router.replace("/login");
          return;
        }

        throw tasksResult.reason;
      }

      const getArray = (data: any) =>
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setTasks(getArray(tasksResult.value.data));

      if (companiesResult.status === "fulfilled") {
        setCompanies(getArray(companiesResult.value.data));
      }

      if (contactsResult.status === "fulfilled") {
        setContacts(getArray(contactsResult.value.data));
      }

      if (leadsResult.status === "fulfilled") {
        setLeads(getArray(leadsResult.value.data));
      }

      if (opportunitiesResult.status === "fulfilled") {
        setOpportunities(
          getArray(opportunitiesResult.value.data),
        );
      }

      try {
        const usersResponse = await api.get("/users");

        setUsers(getArray(usersResponse.data));
      } catch {
        setUsers([]);
      }
    } catch (err: any) {
      console.error("Tasks error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load tasks.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    const currentUser = getUser();

    setEditingTask(null);

    setForm({
      ...emptyForm,
      assigneeId: currentUser?.id || "",
    });

    setError("");
    setShowModal(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);

    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 16)
        : "",
      assigneeId: task.assignee?.id || "",
      companyId: task.company?.id || "",
      contactId: task.contact?.id || "",
      leadId: task.lead?.id || "",
      opportunityId: task.opportunity?.id || "",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingTask(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof TaskForm,
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

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate
          ? new Date(form.dueDate).toISOString()
          : undefined,
        assigneeId: form.assigneeId || undefined,
        companyId: form.companyId || undefined,
        contactId: form.contactId || undefined,
        leadId: form.leadId || undefined,
        opportunityId:
          form.opportunityId || undefined,
      };

      if (editingTask) {
        await api.patch(
          `/tasks/${editingTask.id}`,
          payload,
        );
      } else {
        await api.post("/tasks", payload);
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error("Save task error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save task.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeTask(task: Task) {
    if (task.status === "COMPLETED") return;

    try {
      setError("");

      await api.patch(
        `/tasks/${task.id}/complete`,
      );

      await loadData();
    } catch (err: any) {
      console.error("Complete task error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to complete task.",
      );
    }
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/tasks/${task.id}`);

      await loadData();
    } catch (err: any) {
      console.error("Delete task error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete task.",
      );
    }
  }

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return tasks;

    return tasks.filter((task) => {
      const assigneeName = task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : "";

      const contactName = task.contact
        ? `${task.contact.firstName} ${task.contact.lastName}`
        : "";

      const leadName = task.lead
        ? `${task.lead.firstName} ${task.lead.lastName}`
        : "";

      return [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.company?.name,
        contactName,
        leadName,
        task.opportunity?.name,
        assigneeName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(term),
        );
    });
  }, [tasks, search]);

  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const pendingCount = tasks.filter(
    (task) =>
      task.status !== "COMPLETED" &&
      task.status !== "CANCELLED",
  ).length;

  const urgentCount = tasks.filter(
    (task) =>
      task.priority === "URGENT" &&
      task.status !== "COMPLETED",
  ).length;

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
                Tasks
              </h1>

              <p className="text-xs text-slate-500">
                Manage and track your CRM tasks
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Add Task
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Pending Tasks
              </p>

              <Clock3
                size={20}
                className="text-blue-600"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Completed
              </p>

              <CheckCircle2
                size={20}
                className="text-emerald-600"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Urgent
              </p>

              <ListTodo
                size={20}
                className="text-red-600"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {urgentCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Task Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {tasks.length}{" "}
              {tasks.length === 1 ? "task" : "tasks"} in
              your CRM
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
              placeholder="Search tasks..."
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
              Loading tasks...
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ListTodo size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search
                ? "No tasks found"
                : "No tasks yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Create your first task to start managing your team's work."}
            </p>

            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ListTodo size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {task.title}
                      </h3>

                      <p className="truncate text-xs text-slate-500">
                        {task.company?.name ||
                          task.opportunity?.name ||
                          "General task"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        openEditModal(task)
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      title="Edit task"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => deleteTask(task)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                      task.status,
                    )}`}
                  >
                    {formatLabel(task.status)}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
                      task.priority,
                    )}`}
                  >
                    {formatLabel(task.priority)}
                  </span>
                </div>

                {task.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                    {task.description}
                  </p>
                )}

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-800">
                      Due:
                    </span>{" "}
                    {formatDueDate(task.dueDate)}
                  </p>

                  {task.assignee && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Assignee:
                      </span>{" "}
                      {task.assignee.firstName}{" "}
                      {task.assignee.lastName}
                    </p>
                  )}

                  {task.contact && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Contact:
                      </span>{" "}
                      {task.contact.firstName}{" "}
                      {task.contact.lastName}
                    </p>
                  )}

                  {task.lead && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Lead:
                      </span>{" "}
                      {task.lead.firstName}{" "}
                      {task.lead.lastName}
                    </p>
                  )}

                  {task.opportunity && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Opportunity:
                      </span>{" "}
                      {task.opportunity.name}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  {task.status !== "COMPLETED" &&
                  task.status !== "CANCELLED" ? (
                    <button
                      onClick={() =>
                        completeTask(task)
                      }
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Mark complete
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">
                      {task.status === "COMPLETED"
                        ? "Completed"
                        : "Cancelled"}
                    </span>
                  )}

                  <button
                    onClick={() =>
                      openEditModal(task)
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View / Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingTask
                    ? "Edit Task"
                    : "Add Task"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingTask
                    ? "Update task information"
                    : "Create a new CRM task"}
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
                    Task Title *
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateField(
                        "title",
                        event.target.value,
                      )
                    }
                    required
                    maxLength={200}
                    placeholder="e.g. Follow up with client"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
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
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateField(
                        "priority",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {priorities.map((priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {formatLabel(priority)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Due Date
                  </label>

                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(event) =>
                      updateField(
                        "dueDate",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Assignee
                  </label>

                  <select
                    value={form.assigneeId}
                    onChange={(event) =>
                      updateField(
                        "assigneeId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Unassigned
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
                    Lead
                  </label>

                  <select
                    value={form.leadId}
                    onChange={(event) =>
                      updateField(
                        "leadId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      No lead
                    </option>

                    {leads.map((lead) => (
                      <option
                        key={lead.id}
                        value={lead.id}
                      >
                        {lead.firstName}{" "}
                        {lead.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Opportunity
                  </label>

                  <select
                    value={form.opportunityId}
                    onChange={(event) =>
                      updateField(
                        "opportunityId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      No opportunity
                    </option>

                    {opportunities.map(
                      (opportunity) => (
                        <option
                          key={opportunity.id}
                          value={opportunity.id}
                        >
                          {opportunity.name}
                        </option>
                      ),
                    )}
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
                    rows={4}
                    placeholder="Describe what needs to be done..."
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
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
