"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type UserForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
};

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SALES_REP",
  "USER",
];

const emptyForm: UserForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "USER",
};

function formatRole(role?: string) {
  if (!role) return "User";

  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function roleClass(role?: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-purple-50 text-purple-700";
    case "ADMIN":
      return "bg-blue-50 text-blue-700";
    case "MANAGER":
      return "bg-emerald-50 text-emerald-700";
    case "SALES_REP":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(date?: string) {
  if (!date) return "â€”";

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

function getArray(data: any) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];
}

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<UserForm>(emptyForm);

  useEffect(() => {
    const currentUser = getUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    loadUsers();
  }, [router]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      setUsers(getArray(response.data));
    } catch (err: any) {
      console.error("Users error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      if (err?.response?.status === 403) {
        setError(
          "You do not have permission to manage users.",
        );
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);

    setForm({
      email: user.email || "",
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "USER",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof UserForm,
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

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!editingUser && form.password.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (
      editingUser &&
      form.password &&
      form.password.length < 8
    ) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: {
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        password?: string;
      } = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingUser) {
        await api.patch(
          `/users/${editingUser.id}`,
          payload,
        );
      } else {
        await api.post("/users", {
          ...payload,
          password: form.password,
        });
      }

      closeModal();
      await loadUsers();
    } catch (err: any) {
      console.error("Save user error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save user.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.firstName} ${user.lastName}?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/users/${user.id}`);

      await loadUsers();
    } catch (err: any) {
      console.error("Delete user error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete user.",
      );
    }
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        [
          user.firstName,
          user.lastName,
          user.email,
          user.role,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(term),
        );

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const adminCount = users.filter(
    (user) =>
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN",
  ).length;

  const managerCount = users.filter(
    (user) => user.role === "MANAGER",
  ).length;

  const salesCount = users.filter(
    (user) => user.role === "SALES_REP",
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
                Users
              </h1>

              <p className="text-xs text-slate-500">
                Manage CRM users and access roles
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              New User
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Users
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {users.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Administrators
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {adminCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Managers & Sales
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {managerCount + salesCount}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                User Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {users.length}{" "}
                {users.length === 1
                  ? "user"
                  : "users"}{" "}
                in your organization
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search users..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="ALL">
                  All Roles
                </option>

                {roles.map((role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {formatRole(role)}
                  </option>
                ))}
              </select>
            </div>
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
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserCircle2 size={28} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search ||
              roleFilter !== "ALL"
                ? "No users found"
                : "No users yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search ||
              roleFilter !== "ALL"
                ? "Try changing your search or role filter."
                : "Create your first CRM user to start managing access."}
            </p>

            {!search &&
              roleFilter === "ALL" && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  New User
                </button>
              )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                              {user.firstName
                                ?.charAt(0)
                                .toUpperCase()}
                              {user.lastName
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {
                                  user.firstName
                                }{" "}
                                {
                                  user.lastName
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                ID:{" "}
                                {user.id.slice(
                                  0,
                                  8,
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {user.email}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClass(
                              user.role,
                            )}`}
                          >
                            {formatRole(
                              user.role,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            user.createdAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() =>
                                openEditModal(
                                  user,
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                              title="Edit user"
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            <button
                              onClick={() =>
                                deleteUser(
                                  user,
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              title="Delete user"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredUsers.map(
                (user) => (
                  <div
                    key={user.id}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                          {user.firstName
                            ?.charAt(0)
                            .toUpperCase()}
                          {user.lastName
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {user.firstName}{" "}
                            {user.lastName}
                          </p>

                          <p className="truncate text-sm text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() =>
                            openEditModal(
                              user,
                            )
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() =>
                            deleteUser(user)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleClass(
                          user.role,
                        )}`}
                      >
                        {formatRole(
                          user.role,
                        )}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDate(
                          user.createdAt,
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingUser
                    ? "Edit User"
                    : "Create User"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingUser
                    ? "Update user information and access role"
                    : "Add a new user to your organization"}
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First Name *
                  </label>

                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      updateForm(
                        "firstName",
                        event.target.value,
                      )
                    }
                    required
                    maxLength={100}
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
                      updateForm(
                        "lastName",
                        event.target.value,
                      )
                    }
                    required
                    maxLength={100}
                    placeholder="Doe"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm(
                        "email",
                        event.target.value,
                      )
                    }
                    required
                    placeholder="john@company.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Role *
                  </label>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateForm(
                        "role",
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {roles.map((role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {formatRole(role)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {editingUser
                      ? "New Password"
                      : "Password *"}
                  </label>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateForm(
                        "password",
                        event.target.value,
                      )
                    }
                    required={!editingUser}
                    minLength={8}
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Minimum 8 characters"
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Shield
                    size={19}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Role permissions
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      The selected role controls what this
                      user can access and manage within
                      Storhet CRM.
                    </p>
                  </div>
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
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
