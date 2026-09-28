"use client";

import {
  Activity,
  Building2,
  ClipboardList,
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
  BarChart3,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuth, getUser } from "../lib/auth";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Companies",
    icon: Building2,
    href: "/companies",
  },
  {
    label: "Contacts",
    icon: Users,
    href: "/contacts",
  },
  {
    label: "Leads",
    icon: UserPlus,
    href: "/leads",
  },
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
    icon: BarChart3,
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

export default function CrmShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = getUser();

  function navigate(href: string) {
    setSidebarOpen(false);
    router.push(href);
  }

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center text-left"
          >
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
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.href)}
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
          <button
            type="button"
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Settings size={18} className="mr-3" />
            Settings
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} className="mr-3" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="mr-3 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {getPageTitle(pathname)}
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your customer relationships and business operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {user?.firstName || "User"}{" "}
                {user?.lastName || ""}
              </div>

              <div className="text-xs text-slate-500">
                {formatRole(user?.role)}
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {(user?.firstName || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Dashboard";

  const match = navItems.find(
    (item) =>
      item.href !== "/" &&
      (pathname === item.href ||
        pathname.startsWith(`${item.href}/`)),
  );

  return match?.label || "Storhet CRM";
}

function formatRole(role?: string) {
  if (!role) return "CRM User";

  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}