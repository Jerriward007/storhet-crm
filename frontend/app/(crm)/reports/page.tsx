"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  FileText,
  Package,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type ReportRow = {
  label?: string;
  name?: string;
  status?: string;
  stage?: string;
  source?: string;
  category?: string;
  count?: number;
  total?: number | string;
  value?: number | string;
  amount?: number | string;
  quantity?: number | string;
};

type DashboardData = {
  companies?: number;
  contacts?: number;
  leads?: number;
  opportunities?: number;
  activities?: number;
  tasks?: number;
  products?: number;
  quotations?: number;
  users?: number;
  pipelineValue?: number | string;
  closedWonValue?: number | string;
  openOpportunities?: number;
  completedTasks?: number;
};

type ReportData = {
  dashboard: DashboardData;
  opportunities: ReportRow[];
  leadStatus: ReportRow[];
  leadSource: ReportRow[];
  activities: ReportRow[];
  tasks: ReportRow[];
  quotations: ReportRow[];
  products: ReportRow[];
};

const emptyReports: ReportData = {
  dashboard: {},
  opportunities: [],
  leadStatus: [],
  leadSource: [],
  activities: [],
  tasks: [],
  quotations: [],
  products: [],
};

function getArray(data: any): ReportRow[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getNumber(
  value: unknown,
  fallback = 0,
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getRowCount(row: ReportRow) {
  return getNumber(
    row.count ??
      row.total ??
      row.quantity ??
      0,
  );
}

function getRowValue(row: ReportRow) {
  return getNumber(
    row.value ??
      row.amount ??
      row.total ??
      0,
  );
}

function getRowLabel(row: ReportRow) {
  return (
    row.label ||
    row.name ||
    row.status ||
    row.stage ||
    row.source ||
    row.category ||
    "Unknown"
  );
}

function formatLabel(value?: string) {
  if (!value) return "Unknown";

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

function formatNumber(value: unknown) {
  return getNumber(value).toLocaleString(
    "en-NG",
  );
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(getNumber(value));
}

function percentage(
  value: number,
  total: number,
) {
  if (!total) return 0;

  return Math.round(
    (value / total) * 100,
  );
}

function barWidth(
  value: number,
  maximum: number,
) {
  if (!maximum) return 0;

  return Math.max(
    4,
    Math.round((value / maximum) * 100),
  );
}

export default function ReportsPage() {
  const router = useRouter();

  const [reports, setReports] =
    useState<ReportData>(emptyReports);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    loadReports();
  }, [router]);

  async function loadReports(
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
          api.get("/reports/dashboard"),
          api.get("/reports/opportunities"),
          api.get("/reports/leads/status"),
          api.get("/reports/leads/source"),
          api.get("/reports/activities"),
          api.get("/reports/tasks"),
          api.get("/reports/quotations"),
          api.get("/reports/products"),
        ]);

      const failedUnauthorized =
        results.some(
          (result) =>
            result.status === "rejected" &&
            result.reason?.response?.status === 401,
        );

      if (failedUnauthorized) {
        router.replace("/login");
        return;
      }

      const nextReports: ReportData = {
        dashboard: {},
        opportunities: [],
        leadStatus: [],
        leadSource: [],
        activities: [],
        tasks: [],
        quotations: [],
        products: [],
      };

      const dashboardResult = results[0];

      if (
        dashboardResult.status ===
        "fulfilled"
      ) {
        const data =
          dashboardResult.value.data;

        nextReports.dashboard =
          data?.data || data || {};
      }

      const opportunityResult = results[1];

      if (
        opportunityResult.status ===
        "fulfilled"
      ) {
        nextReports.opportunities =
          getArray(
            opportunityResult.value.data,
          );
      }

      const leadStatusResult = results[2];

      if (
        leadStatusResult.status ===
        "fulfilled"
      ) {
        nextReports.leadStatus =
          getArray(
            leadStatusResult.value.data,
          );
      }

      const leadSourceResult = results[3];

      if (
        leadSourceResult.status ===
        "fulfilled"
      ) {
        nextReports.leadSource =
          getArray(
            leadSourceResult.value.data,
          );
      }

      const activitiesResult = results[4];

      if (
        activitiesResult.status ===
        "fulfilled"
      ) {
        nextReports.activities =
          getArray(
            activitiesResult.value.data,
          );
      }

      const tasksResult = results[5];

      if (
        tasksResult.status ===
        "fulfilled"
      ) {
        nextReports.tasks =
          getArray(
            tasksResult.value.data,
          );
      }

      const quotationsResult = results[6];

      if (
        quotationsResult.status ===
        "fulfilled"
      ) {
        nextReports.quotations =
          getArray(
            quotationsResult.value.data,
          );
      }

      const productsResult = results[7];

      if (
        productsResult.status ===
        "fulfilled"
      ) {
        nextReports.products =
          getArray(
            productsResult.value.data,
          );
      }

      const successfulRequests =
        results.filter(
          (result) =>
            result.status === "fulfilled",
        ).length;

      if (successfulRequests === 0) {
        throw new Error(
          "No report data could be loaded.",
        );
      }

      setReports(nextReports);

      if (successfulRequests < 8) {
        setError(
          "Some report sections could not be loaded. The available sections are still displayed.",
        );
      }
    } catch (err: any) {
      console.error(
        "Reports error:",
        err,
      );

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        "Unable to load the reports dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const dashboard = reports.dashboard;

  const opportunityTotal =
    reports.opportunities.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const opportunityValue =
    reports.opportunities.reduce(
      (sum, row) =>
        sum + getRowValue(row),
      0,
    );

  const leadStatusTotal =
    reports.leadStatus.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const leadSourceTotal =
    reports.leadSource.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const activityTotal =
    reports.activities.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const taskTotal =
    reports.tasks.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const quotationTotal =
    reports.quotations.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const productTotal =
    reports.products.reduce(
      (sum, row) =>
        sum + getRowCount(row),
      0,
    );

  const opportunityMaximum =
    Math.max(
      ...reports.opportunities.map(
        getRowCount,
      ),
      1,
    );

  const leadStatusMaximum =
    Math.max(
      ...reports.leadStatus.map(
        getRowCount,
      ),
      1,
    );

  const leadSourceMaximum =
    Math.max(
      ...reports.leadSource.map(
        getRowCount,
      ),
      1,
    );

  const activityMaximum =
    Math.max(
      ...reports.activities.map(
        getRowCount,
      ),
      1,
    );

  const taskMaximum =
    Math.max(
      ...reports.tasks.map(
        getRowCount,
      ),
      1,
    );

  const quotationMaximum =
    Math.max(
      ...reports.quotations.map(
        getRowCount,
      ),
      1,
    );

  const productMaximum =
    Math.max(
      ...reports.products.map(
        getRowCount,
      ),
      1,
    );

  const acceptedLeads =
    reports.leadStatus.find(
      (row) =>
        String(
          row.status ||
            row.label ||
            row.name,
        ).toUpperCase() ===
        "QUALIFIED",
    );

  const completedTasks =
    reports.tasks.find(
      (row) =>
        String(
          row.status ||
            row.label ||
            row.name,
        ).toUpperCase() ===
        "COMPLETED",
    );

  const acceptedQuotations =
    reports.quotations.find(
      (row) =>
        String(
          row.status ||
            row.label ||
            row.name,
        ).toUpperCase() ===
        "ACCEPTED",
    );

  const calculatedQualifiedLeads =
    acceptedLeads
      ? getRowCount(acceptedLeads)
      : 0;

  const calculatedCompletedTasks =
    completedTasks
      ? getRowCount(completedTasks)
      : 0;

  const calculatedAcceptedQuotations =
    acceptedQuotations
      ? getRowCount(
          acceptedQuotations,
        )
      : 0;

  const summaryCards = useMemo(
    () => [
      {
        label: "Companies",
        value: dashboard.companies,
        icon: Users,
        description:
          "Customer organizations",
      },
      {
        label: "Contacts",
        value: dashboard.contacts,
        icon: UserCircleIcon,
        description:
          "People in your CRM",
      },
      {
        label: "Leads",
        value: dashboard.leads,
        icon: Target,
        description:
          "Current lead records",
      },
      {
        label: "Opportunities",
        value:
          dashboard.opportunities ??
          opportunityTotal,
        icon: TrendingUp,
        description:
          "Sales opportunities",
      },
      {
        label: "Activities",
        value:
          dashboard.activities ??
          activityTotal,
        icon: Activity,
        description:
          "Logged CRM activities",
      },
      {
        label: "Tasks",
        value:
          dashboard.tasks ??
          taskTotal,
        icon: ClipboardList,
        description:
          "Tracked tasks",
      },
      {
        label: "Products",
        value:
          dashboard.products ??
          productTotal,
        icon: Package,
        description:
          "Products and services",
      },
      {
        label: "Quotations",
        value:
          dashboard.quotations ??
          quotationTotal,
        icon: FileText,
        description:
          "Customer quotations",
      },
    ],
    [
      dashboard,
      opportunityTotal,
      activityTotal,
      taskTotal,
      productTotal,
      quotationTotal,
    ],
  );

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
                Reports
              </h1>

              <p className="text-xs text-slate-500">
                CRM performance and business insights
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              loadReports(true)
            }
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </header>

      <main className="space-y-6 p-4 sm:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Business Reports
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor sales activity, leads, tasks,
            quotations, and your CRM database.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading reports...
            </p>
          </div>
        ) : (
          <>
            <section>
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900">
                  CRM Overview
                </h3>

                <p className="text-xs text-slate-500">
                  Current records across your CRM
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map(
                  (card) => {
                    const Icon =
                      card.icon;

                    return (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-slate-500">
                              {card.label}
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                              {formatNumber(
                                card.value,
                              )}
                            </p>
                          </div>

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Icon
                              size={20}
                            />
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          {card.description}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ReportPanel
                title="Opportunities by Stage"
                description="Distribution of your sales pipeline"
                icon={TrendingUp}
              >
                {reports.opportunities.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.opportunities.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    opportunityMaximum,
                                  )}%`,
                                }}
                              />
                            </div>

                            {getRowValue(
                              row,
                            ) > 0 && (
                              <p className="mt-1 text-xs text-slate-400">
                                {formatCurrency(
                                  getRowValue(
                                    row,
                                  ),
                                )}
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Lead Status"
                description="Current lead distribution"
                icon={Target}
              >
                {reports.leadStatus.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.leadStatus.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    leadStatusMaximum,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Lead Sources"
                description="Where your leads are coming from"
                icon={Users}
              >
                {reports.leadSource.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.leadSource.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-violet-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    leadSourceMaximum,
                                  )}%`,
                                }}
                              />
                            </div>

                            {leadSourceTotal >
                              0 && (
                              <p className="mt-1 text-xs text-slate-400">
                                {percentage(
                                  count,
                                  leadSourceTotal,
                                )}
                                % of leads
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Activities"
                description="Logged CRM activities"
                icon={Activity}
              >
                {reports.activities.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.activities.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-orange-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    activityMaximum,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ReportPanel
                title="Tasks"
                description="Task status distribution"
                icon={ClipboardList}
              >
                {reports.tasks.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.tasks.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-cyan-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    taskMaximum,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Quotations"
                description="Quotation status distribution"
                icon={FileText}
              >
                {reports.quotations.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.quotations.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    quotationMaximum,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Products"
                description="Product category distribution"
                icon={Package}
              >
                {reports.products.length ===
                0 ? (
                  <EmptyReport />
                ) : (
                  <div className="space-y-4">
                    {reports.products.map(
                      (
                        row,
                        index,
                      ) => {
                        const count =
                          getRowCount(
                            row,
                          );

                        return (
                          <div
                            key={`${getRowLabel(
                              row,
                            )}-${index}`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">
                                {formatLabel(
                                  getRowLabel(
                                    row,
                                  ),
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {formatNumber(
                                  count,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-pink-500"
                                style={{
                                  width: `${barWidth(
                                    count,
                                    productMaximum,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </ReportPanel>

              <ReportPanel
                title="Sales Snapshot"
                description="Key commercial metrics"
                icon={BarChart3}
              >
                <div className="space-y-4">
                  <MetricRow
                    label="Pipeline Value"
                    value={formatCurrency(
                      dashboard.pipelineValue ??
                        opportunityValue,
                    )}
                  />

                  <MetricRow
                    label="Closed Won Value"
                    value={formatCurrency(
                      dashboard.closedWonValue ??
                        0,
                    )}
                  />

                  <MetricRow
                    label="Open Opportunities"
                    value={formatNumber(
                      dashboard.openOpportunities ??
                        opportunityTotal,
                    )}
                  />

                  <MetricRow
                    label="Qualified Leads"
                    value={formatNumber(
                      dashboard.leads !==
                        undefined
                        ? calculatedQualifiedLeads
                        : 0,
                    )}
                  />

                  <MetricRow
                    label="Completed Tasks"
                    value={formatNumber(
                      dashboard.completedTasks ??
                        calculatedCompletedTasks,
                    )}
                  />

                  <MetricRow
                    label="Accepted Quotations"
                    value={formatNumber(
                      calculatedAcceptedQuotations,
                    )}
                  />
                </div>
              </ReportPanel>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <QuickMetric
                icon={Target}
                label="Lead Records"
                value={formatNumber(
                  dashboard.leads ??
                    leadStatusTotal,
                )}
                description="Total leads currently tracked"
              />

              <QuickMetric
                icon={CheckCircle2}
                label="Completed Tasks"
                value={formatNumber(
                  dashboard.completedTasks ??
                    calculatedCompletedTasks,
                )}
                description="Tasks marked completed"
              />

              <QuickMetric
                icon={FileText}
                label="Quotation Records"
                value={formatNumber(
                  dashboard.quotations ??
                    quotationTotal,
                )}
                description="Customer quotations created"
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ReportPanel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={19} />
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
      <BarChart3
        size={24}
        className="mx-auto text-slate-300"
      />

      <p className="mt-2 text-sm text-slate-400">
        No report data available yet.
      </p>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function QuickMetric({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function UserCircleIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Users
      size={size}
      className={className}
    />
  );
}
