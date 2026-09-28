"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import api from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";

type DashboardData = {
  cards?: {
    companies?: number;
    contacts?: number;
    leads?: number;
    opportunities?: number;
    openTasks?: number;
    pendingActivities?: number;
    quotations?: number;
    products?: number;
  };
  sales?: {
    totalPipelineValue?: number;
    weightedPipelineValue?: number;
    closedWonValue?: number;
    closedLostValue?: number;
  };
  activity?: {
    total?: number;
    pending?: number;
    completed?: number;
  };
  leadConversion?: {
    total?: number;
    converted?: number;
    rate?: number;
  };
  quotationTotals?: {
    total?: number;
    draft?: number;
    sent?: number;
    accepted?: number;
    rejected?: number;
    totalValue?: number;
  };
  recent?: {
    opportunities?: any[];
    activities?: any[];
    tasks?: any[];
    quotations?: any[];
  };
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Leads", icon: UserPlus, href: "/leads" },
  {
    label: "Opportunities",
    icon: Target,
    href: "/opportunities",
  },
  {
    label: "Pipeline",
    icon: TrendingUp,
    href: "/pipeline",
  },
  {
    label: "Activities",
    icon: Activity,
    href: "/activities",
  },
  {
    label: "Tasks",
    icon: ClipboardList,
    href: "/tasks",
  },
  {
    label: "Products",
    icon: Package,
    href: "/products",
  },
  {
    label: "Quotations",
    icon: FileText,
    href: "/quotations",
  },
  {
    label: "Reports",
    icon: TrendingUp,
    href: "/reports",
  },
  {
    label: "Users",
    icon: Users,
    href: "/users",
  },
  {
    label: "Roles",
    icon: Settings,
    href: "/roles",
  },
];

function formatMoney(value: number | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | undefined) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(value: string | undefined) {
  if (!value) return "Pending";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardPage() {
  const router = useRouter();
const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserName(user.firstName || "User");

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard");

        setDashboard(response.data);
      } catch (err: any) {
        console.error("Dashboard error:", err);

        if (err?.response?.status === 401) {
          clearAuth();
          router.replace("/login");
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  const cards = dashboard?.cards;

  const stats = [
    {
      title: "Companies",
      value: cards?.companies ?? 0,
      icon: Building2,
    },
    {
      title: "Contacts",
      value: cards?.contacts ?? 0,
      icon: Users,
    },
    {
      title: "Leads",
      value: cards?.leads ?? 0,
      icon: UserPlus,
    },
    {
      title: "Opportunities",
      value: cards?.opportunities ?? 0,
      icon: Target,
    },
  ];

  const opportunities = dashboard?.recent?.opportunities ?? [];
  const activities = dashboard?.recent?.activities ?? [];
  const tasks = dashboard?.recent?.tasks ?? [];
  const quotations = dashboard?.recent?.quotations ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <TrendingUp size={20} />
          </div>

          <div className="ml-3">
            <div className="text-base font-bold text-slate-900">
              Storhet CRM
            </div>
            <div className="text-[11px] text-slate-500">
              Business Management
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
  {navItems.map((item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          setSidebarOpen(false);
          router.push(item.href);
        }}
        className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon size={18} className="mr-3" />
        {item.label}
      </button>
    );
  })}
</nav>

        <div className="border-t border-slate-200 p-3">
          <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Settings size={18} className="mr-3" />
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} className="mr-3" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-3 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Dashboard
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Monitor your customer relationships and sales activity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {userName}
              </div>
              <div className="text-xs text-slate-500">
                CRM User
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Welcome */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {userName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s what&apos;s happening in your CRM today.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Main stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {loading ? "—" : stat.value}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={20} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-xs text-slate-500">
                    <ArrowUpRight size={14} className="mr-1" />
                    CRM records
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sales summary */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={20} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Pipeline Value
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {loading
                      ? "—"
                      : formatMoney(
                          dashboard?.sales?.totalPipelineValue,
                        )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <TrendingUp size={20} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Weighted Pipeline
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {loading
                      ? "—"
                      : formatMoney(
                          dashboard?.sales?.weightedPipelineValue,
                        )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Closed Won
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {loading
                      ? "—"
                      : formatMoney(
                          dashboard?.sales?.closedWonValue,
                        )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {/* Pipeline */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Recent Opportunities
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest sales opportunities
                  </p>
                </div>

                <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    Loading opportunities...
                  </div>
                ) : opportunities.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No opportunities yet.
                  </div>
                ) : (
                  opportunities.slice(0, 5).map((opportunity: any) => (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {opportunity.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getStatusLabel(opportunity.stage)}
                        </p>
                      </div>

                      <div className="ml-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatMoney(opportunity.amount)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {opportunity.probability ?? 0}% probability
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Activity */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500">
                  Latest customer interactions
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    Loading activity...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No activities yet.
                  </div>
                ) : (
                  activities.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Activity size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {activity.subject}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getStatusLabel(activity.type)} •{" "}
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Bottom cards */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Tasks */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Tasks
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your recent tasks
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {cards?.openTasks ?? 0} open
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    Loading tasks...
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No tasks yet.
                  </div>
                ) : (
                  tasks.slice(0, 5).map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <ClipboardList size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {task.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {task.dueDate
                              ? `Due ${formatDate(task.dueDate)}`
                              : "No due date"}
                          </p>
                        </div>
                      </div>

                      <span className="ml-3 shrink-0 text-xs font-medium text-slate-500">
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Quotations */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Quotations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recent quotations
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {dashboard?.quotationTotals?.accepted ?? 0} accepted
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    Loading quotations...
                  </div>
                ) : quotations.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No quotations yet.
                  </div>
                ) : (
                  quotations.slice(0, 5).map((quotation: any) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <FileText size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {quotation.quotationNumber}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {quotation.title}
                          </p>
                        </div>
                      </div>

                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatMoney(quotation.total)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getStatusLabel(quotation.status)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Lead conversion */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Lead Conversion
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {dashboard?.leadConversion?.converted ?? 0} converted out of{" "}
                  {dashboard?.leadConversion?.total ?? 0} leads
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            dashboard?.leadConversion?.rate ?? 0,
                          ),
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {Number(
                    dashboard?.leadConversion?.rate ?? 0,
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}