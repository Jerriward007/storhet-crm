"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Shield,
  Users,
  Lock,
  Search,
} from "lucide-react";

type RoleKey =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "SALES_REP"
  | "USER";

type RoleDefinition = {
  key: RoleKey;
  name: string;
  description: string;
  level: number;
  users: number;
  permissions: Record<string, boolean>;
};

const permissionGroups = [
  {
    name: "Dashboard",
    permissions: ["View dashboard"],
  },
  {
    name: "Companies",
    permissions: [
      "View companies",
      "Create companies",
      "Edit companies",
      "Delete companies",
    ],
  },
  {
    name: "Contacts",
    permissions: [
      "View contacts",
      "Create contacts",
      "Edit contacts",
      "Delete contacts",
    ],
  },
  {
    name: "Leads",
    permissions: [
      "View leads",
      "Create leads",
      "Edit leads",
      "Delete leads",
    ],
  },
  {
    name: "Opportunities",
    permissions: [
      "View opportunities",
      "Create opportunities",
      "Edit opportunities",
      "Delete opportunities",
    ],
  },
  {
    name: "Activities",
    permissions: [
      "View activities",
      "Create activities",
      "Edit activities",
      "Delete activities",
    ],
  },
  {
    name: "Tasks",
    permissions: [
      "View tasks",
      "Create tasks",
      "Edit tasks",
      "Delete tasks",
    ],
  },
  {
    name: "Products",
    permissions: [
      "View products",
      "Create products",
      "Edit products",
      "Delete products",
    ],
  },
  {
    name: "Quotations",
    permissions: [
      "View quotations",
      "Create quotations",
      "Edit quotations",
      "Delete quotations",
    ],
  },
  {
    name: "Reports",
    permissions: ["View reports"],
  },
  {
    name: "Users",
    permissions: [
      "View users",
      "Create users",
      "Edit users",
      "Delete users",
    ],
  },
];

const allPermissions = permissionGroups.flatMap(
  (group) => group.permissions,
);

function buildPermissions(
  enabled: string[],
): Record<string, boolean> {
  return Object.fromEntries(
    allPermissions.map((permission) => [
      permission,
      enabled.includes(permission),
    ]),
  );
}

const roles: RoleDefinition[] = [
  {
    key: "SUPER_ADMIN",
    name: "Super Admin",
    description:
      "Full platform access including users, security, configuration and all CRM operations.",
    level: 5,
    users: 0,
    permissions: buildPermissions(allPermissions),
  },
  {
    key: "ADMIN",
    name: "Administrator",
    description:
      "Manages the organization, users and all major CRM operations.",
    level: 4,
    users: 0,
    permissions: buildPermissions(
      allPermissions.filter(
        (permission) =>
          ![
            "Delete companies",
            "Delete contacts",
            "Delete leads",
          ].includes(permission),
      ),
    ),
  },
  {
    key: "MANAGER",
    name: "Manager",
    description:
      "Manages sales activity, customers, opportunities, tasks and reporting.",
    level: 3,
    users: 0,
    permissions: buildPermissions(
      allPermissions.filter(
        (permission) =>
          !permission.startsWith("Delete users") &&
          !permission.includes("Create users") &&
          !permission.includes("Edit users") &&
          !permission.includes("View users"),
      ),
    ),
  },
  {
    key: "SALES_REP",
    name: "Sales Representative",
    description:
      "Works with leads, contacts, opportunities, activities, tasks and quotations.",
    level: 2,
    users: 0,
    permissions: buildPermissions(
      [
        "View dashboard",
        "View companies",
        "Create companies",
        "Edit companies",
        "View contacts",
        "Create contacts",
        "Edit contacts",
        "View leads",
        "Create leads",
        "Edit leads",
        "View opportunities",
        "Create opportunities",
        "Edit opportunities",
        "View activities",
        "Create activities",
        "Edit activities",
        "View tasks",
        "Create tasks",
        "Edit tasks",
        "View products",
        "View quotations",
        "Create quotations",
        "Edit quotations",
        "View reports",
      ],
    ),
  },
  {
    key: "USER",
    name: "Standard User",
    description:
      "Basic CRM access for viewing and working with assigned customer records.",
    level: 1,
    users: 0,
    permissions: buildPermissions(
      [
        "View dashboard",
        "View companies",
        "View contacts",
        "View leads",
        "View opportunities",
        "View activities",
        "Create activities",
        "View tasks",
        "Create tasks",
        "Edit tasks",
        "View products",
        "View quotations",
      ],
    ),
  },
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] =
    useState<RoleKey>("ADMIN");
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({});

  const currentRole = useMemo(
    () =>
      roles.find((role) => role.key === selectedRole) ??
      roles[0],
    [selectedRole],
  );

  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(value) ||
        role.key.toLowerCase().includes(value) ||
        role.description.toLowerCase().includes(value),
    );
  }, [search]);

  const enabledCount = allPermissions.filter(
    (permission) =>
      currentRole.permissions[permission],
  ).length;

  function toggleGroup(groupName: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupName]: !current[groupName],
    }));
  }

  function selectRole(role: RoleDefinition) {
    setSelectedRole(role.key);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Shield size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Roles & Permissions
                </h1>

                <p className="text-sm text-slate-500">
                  Control access to Storhet CRM features by role.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Lock size={17} className="text-slate-500" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Access model
              </p>

              <p className="text-sm font-semibold text-slate-800">
                Role-based access control
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Shield size={19} />}
            label="System Roles"
            value={roles.length}
          />

          <SummaryCard
            icon={<Lock size={19} />}
            label="Permissions"
            value={allPermissions.length}
          />

          <SummaryCard
            icon={<Users size={19} />}
            label="Selected Role"
            value={currentRole.name}
            small
          />

          <SummaryCard
            icon={<Check size={19} />}
            label="Enabled Permissions"
            value={`${enabledCount}/${allPermissions.length}`}
          />
        </div>

        {/* Main layout */}
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Roles list */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-base font-semibold text-slate-900">
                System Roles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a role to inspect its permissions.
              </p>

              <div className="relative mt-4">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search roles..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRoles.map((role) => {
                const selected =
                  role.key === selectedRole;

                const rolePermissionCount =
                  allPermissions.filter(
                    (permission) =>
                      role.permissions[permission],
                  ).length;

                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`w-full p-4 text-left transition ${
                      selected
                        ? "bg-slate-900 text-white"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Shield size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={`truncate text-sm font-semibold ${
                              selected
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {role.name}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              selected
                                ? "bg-white/10 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            L{role.level}
                          </span>
                        </div>

                        <p
                          className={`mt-1 text-xs leading-5 ${
                            selected
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          {role.description}
                        </p>

                        <div
                          className={`mt-3 text-xs ${
                            selected
                              ? "text-slate-300"
                              : "text-slate-400"
                          }`}
                        >
                          {rolePermissionCount} permissions
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredRoles.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No roles found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Try another search term.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Permissions */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {currentRole.name}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {currentRole.key}
                    </span>
                  </div>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {currentRole.description}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs text-slate-400">
                    Permissions enabled
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {enabledCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="space-y-3">
                {permissionGroups.map((group) => {
                  const enabledInGroup =
                    group.permissions.filter(
                      (permission) =>
                        currentRole.permissions[
                          permission
                        ],
                    ).length;

                  const expanded =
                    expandedGroups[group.name] ?? true;

                  return (
                    <div
                      key={group.name}
                      className="overflow-hidden rounded-xl border border-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleGroup(group.name)
                        }
                        className="flex w-full items-center justify-between gap-4 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {group.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {enabledInGroup} of{" "}
                            {group.permissions.length}{" "}
                            permissions enabled
                          </p>
                        </div>

                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-slate-400 transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expanded && (
                        <div className="divide-y divide-slate-100">
                          {group.permissions.map(
                            (permission) => {
                              const enabled =
                                currentRole.permissions[
                                  permission
                                ];

                              return (
                                <div
                                  key={permission}
                                  className="flex items-center justify-between gap-4 px-4 py-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm text-slate-700">
                                      {permission}
                                    </p>
                                  </div>

                                  <div
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                      enabled
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-300"
                                    }`}
                                  >
                                    {enabled && (
                                      <Check size={14} />
                                    )}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Lock
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      System-managed roles
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      These roles are currently defined by the
                      Storhet CRM backend. Permission editing from
                      this screen will be connected to a dedicated
                      role-management API when custom roles are
                      introduced.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 truncate font-bold text-slate-900 ${
          small ? "text-base" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
