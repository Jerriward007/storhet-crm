"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type QuotationItem = {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discount?: string | number | null;
  tax?: string | number | null;
  product?: {
    id: string;
    name: string;
  } | null;
};

type Quotation = {
  id: string;
  quotationNumber?: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  currency?: string | null;
  tax?: string | number | null;
  discount?: string | number | null;
  subtotal?: string | number | null;
  total?: string | number | null;
  validUntil?: string | null;
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
  items?: QuotationItem[];
  createdAt?: string;
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

type Product = {
  id: string;
  name: string;
  unitPrice?: string | number | null;
  currency?: string | null;
};

type FormItem = {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
};

type QuotationForm = {
  companyId: string;
  contactId: string;
  title: string;
  description: string;
  status: string;
  currency: string;
  tax: string;
  discount: string;
  validUntil: string;
  notes: string;
};

const statuses = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
];

const emptyForm: QuotationForm = {
  companyId: "",
  contactId: "",
  title: "",
  description: "",
  status: "DRAFT",
  currency: "NGN",
  tax: "",
  discount: "",
  validUntil: "",
  notes: "",
};

const emptyItem: FormItem = {
  productId: "",
  description: "",
  quantity: "1",
  unitPrice: "",
  discount: "",
  tax: "",
};

function formatLabel(value?: string | null) {
  if (!value) return "Draft";

  return value
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
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "â€”";
  }

  const value = Number(amount);

  if (Number.isNaN(value)) {
    return String(amount);
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-NG")}`;
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";
    case "SENT":
      return "bg-blue-50 text-blue-700";
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "EXPIRED":
      return "bg-orange-50 text-orange-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function formatDate(date?: string | null) {
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

export default function QuotationsPage() {
  const router = useRouter();

  const [quotations, setQuotations] = useState<Quotation[]>(
    [],
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingQuotation, setEditingQuotation] =
    useState<Quotation | null>(null);

  const [form, setForm] =
    useState<QuotationForm>(emptyForm);

  const [items, setItems] = useState<FormItem[]>([
    { ...emptyItem },
  ]);

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
        api.get("/quotations"),
        api.get("/companies"),
        api.get("/contacts"),
        api.get("/products"),
      ]);

      const quotationsResult = results[0];
      const companiesResult = results[1];
      const contactsResult = results[2];
      const productsResult = results[3];

      if (quotationsResult.status === "rejected") {
        if (
          quotationsResult.reason?.response?.status === 401
        ) {
          router.replace("/login");
          return;
        }

        throw quotationsResult.reason;
      }

      setQuotations(
        getArray(quotationsResult.value.data),
      );

      if (companiesResult.status === "fulfilled") {
        setCompanies(getArray(companiesResult.value.data));
      }

      if (contactsResult.status === "fulfilled") {
        setContacts(getArray(contactsResult.value.data));
      }

      if (productsResult.status === "fulfilled") {
        setProducts(getArray(productsResult.value.data));
      }
    } catch (err: any) {
      console.error("Quotations error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load quotations.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingQuotation(null);
    setForm(emptyForm);
    setItems([{ ...emptyItem }]);
    setError("");
    setShowModal(true);
  }

  function openEditModal(
    quotation: Quotation,
  ) {
    setEditingQuotation(quotation);

    setForm({
      companyId: quotation.company?.id || "",
      contactId: quotation.contact?.id || "",
      title: quotation.title || "",
      description: quotation.description || "",
      status: quotation.status || "DRAFT",
      currency: quotation.currency || "NGN",
      tax:
        quotation.tax !== null &&
        quotation.tax !== undefined
          ? String(quotation.tax)
          : "",
      discount:
        quotation.discount !== null &&
        quotation.discount !== undefined
          ? String(quotation.discount)
          : "",
      validUntil: quotation.validUntil
        ? quotation.validUntil.slice(0, 10)
        : "",
      notes: quotation.notes || "",
    });

    const quotationItems =
      quotation.items || [];

    setItems(
      quotationItems.length > 0
        ? quotationItems.map((item) => ({
            productId: item.productId || "",
            description: item.description || "",
            quantity: String(item.quantity ?? "1"),
            unitPrice: String(item.unitPrice ?? ""),
            discount:
              item.discount !== null &&
              item.discount !== undefined
                ? String(item.discount)
                : "",
            tax:
              item.tax !== null &&
              item.tax !== undefined
                ? String(item.tax)
                : "",
          }))
        : [{ ...emptyItem }],
    );

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingQuotation(null);
    setForm(emptyForm);
    setItems([{ ...emptyItem }]);
  }

  function updateForm(
    field: keyof QuotationForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateItem(
    index: number,
    field: keyof FormItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function handleProductChange(
    index: number,
    productId: string,
  ) {
    const product = products.find(
      (item) => item.id === productId,
    );

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              description:
                product?.name || item.description,
              unitPrice:
                product?.unitPrice !== null &&
                product?.unitPrice !== undefined
                  ? String(product.unitPrice)
                  : item.unitPrice,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { ...emptyItem },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      setError(
        "A quotation must contain at least one item.",
      );
      return;
    }

    setItems((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    );
  }

  const calculatedSubtotal = items.reduce(
    (sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(
        item.unitPrice || 0,
      );
      const discount = Number(
        item.discount || 0,
      );
      const tax = Number(item.tax || 0);

      const lineBase =
        quantity * unitPrice;

      const lineAfterDiscount =
        lineBase - discount;

      return (
        sum +
        lineAfterDiscount +
        tax
      );
    },
    0,
  );

  const calculatedTotal =
    calculatedSubtotal -
    Number(form.discount || 0) +
    Number(form.tax || 0);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Quotation title is required.");
      return;
    }

    if (items.length === 0) {
      setError(
        "A quotation must contain at least one item.",
      );
      return;
    }

    for (const item of items) {
      if (!item.description.trim()) {
        setError(
          "Every quotation item needs a description.",
        );
        return;
      }

      if (
        !item.quantity ||
        Number(item.quantity) <= 0
      ) {
        setError(
          "Every quotation item must have a quantity greater than zero.",
        );
        return;
      }

      if (
        !item.unitPrice ||
        Number(item.unitPrice) < 0
      ) {
        setError(
          "Every quotation item must have a valid unit price.",
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        companyId:
          form.companyId || undefined,
        contactId:
          form.contactId || undefined,
        title: form.title.trim(),
        description:
          form.description.trim() || undefined,
        status: form.status,
        currency:
          form.currency.trim() || "NGN",
        tax: form.tax || undefined,
        discount:
          form.discount || undefined,
        validUntil:
          form.validUntil || undefined,
        notes:
          form.notes.trim() || undefined,
        items: items.map((item) => ({
          productId:
            item.productId || undefined,
          description:
            item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount:
            item.discount || undefined,
          tax: item.tax || undefined,
        })),
      };

      if (editingQuotation) {
        await api.patch(
          `/quotations/${editingQuotation.id}`,
          payload,
        );
      } else {
        await api.post(
          "/quotations",
          payload,
        );
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error(
        "Save quotation error:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to save quotation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuotation(
    quotation: Quotation,
  ) {
    const confirmed = window.confirm(
      `Delete "${quotation.title}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/quotations/${quotation.id}`,
      );

      await loadData();
    } catch (err: any) {
      console.error(
        "Delete quotation error:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete quotation.",
      );
    }
  }

  const filteredQuotations = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return quotations.filter((quotation) => {
      const contactName =
        quotation.contact
          ? `${quotation.contact.firstName} ${quotation.contact.lastName}`
          : "";

      const matchesSearch =
        !term ||
        [
          quotation.title,
          quotation.quotationNumber,
          quotation.description,
          quotation.status,
          quotation.company?.name,
          contactName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(term),
          );

      const matchesStatus =
        statusFilter === "ALL" ||
        quotation.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    quotations,
    search,
    statusFilter,
  ]);

  const acceptedCount = quotations.filter(
    (quotation) =>
      quotation.status === "ACCEPTED",
  ).length;

  const sentCount = quotations.filter(
    (quotation) =>
      quotation.status === "SENT",
  ).length;

  const draftCount = quotations.filter(
    (quotation) =>
      quotation.status === "DRAFT",
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
                Quotations
              </h1>

              <p className="text-xs text-slate-500">
                Create and manage customer quotations
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              New Quotation
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Draft Quotations
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {draftCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Sent Quotations
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {sentCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Accepted Quotations
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {acceptedCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Quotation Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {quotations.length}{" "}
                {quotations.length === 1
                  ? "quotation"
                  : "quotations"}{" "}
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
                placeholder="Search quotations..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">
                All Statuses
              </option>

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
        </div>

        {error && !showModal && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading quotations...
            </p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search ||
              statusFilter !== "ALL"
                ? "No quotations found"
                : "No quotations yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search ||
              statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Create your first quotation to start preparing customer offers."}
            </p>

            {!search &&
              statusFilter === "ALL" && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  New Quotation
                </button>
              )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredQuotations.map(
              (quotation) => (
                <div
                  key={quotation.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {quotation.title}
                        </h3>

                        <p className="truncate text-xs text-slate-500">
                          {quotation.quotationNumber ||
                            "Quotation"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          openEditModal(
                            quotation,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        title="Edit quotation"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() =>
                          deleteQuotation(
                            quotation,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete quotation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        quotation.status,
                      )}`}
                    >
                      {formatLabel(
                        quotation.status,
                      )}
                    </span>

                    {quotation.company && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {quotation.company.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatAmount(
                        quotation.total,
                        quotation.currency ||
                          "NGN",
                      )}
                    </p>

                    {quotation.subtotal !==
                      null &&
                      quotation.subtotal !==
                        undefined && (
                        <p className="mt-1 text-xs text-slate-500">
                          Subtotal:{" "}
                          {formatAmount(
                            quotation.subtotal,
                            quotation.currency ||
                              "NGN",
                          )}
                        </p>
                      )}
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    {quotation.contact && (
                      <p>
                        <span className="font-medium text-slate-800">
                          Contact:
                        </span>{" "}
                        {
                          quotation.contact
                            .firstName
                        }{" "}
                        {
                          quotation.contact
                            .lastName
                        }
                      </p>
                    )}

                    <p>
                      <span className="font-medium text-slate-800">
                        Valid until:
                      </span>{" "}
                      {formatDate(
                        quotation.validUntil,
                      )}
                    </p>

                    <p>
                      <span className="font-medium text-slate-800">
                        Items:
                      </span>{" "}
                      {quotation.items?.length ??
                        0}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <button
                      onClick={() =>
                        openEditModal(
                          quotation,
                        )
                      }
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View / Edit quotation
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
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingQuotation
                    ? "Edit Quotation"
                    : "New Quotation"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingQuotation
                    ? "Update quotation details and items"
                    : "Prepare a quotation for your customer"}
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
              className="space-y-6 p-5"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Quotation Title *
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value,
                      )
                    }
                    required
                    maxLength={200}
                    placeholder="e.g. Network Monitoring Solution"
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
                      updateForm(
                        "companyId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      No company
                    </option>

                    {companies.map(
                      (company) => (
                        <option
                          key={company.id}
                          value={company.id}
                        >
                          {company.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Contact
                  </label>

                  <select
                    value={form.contactId}
                    onChange={(event) =>
                      updateForm(
                        "contactId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      No contact
                    </option>

                    {contacts.map(
                      (contact) => (
                        <option
                          key={contact.id}
                          value={contact.id}
                        >
                          {contact.firstName}{" "}
                          {contact.lastName}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {statuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatLabel(status)}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Currency
                  </label>

                  <input
                    value={form.currency}
                    onChange={(event) =>
                      updateForm(
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
                    Valid Until
                  </label>

                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(event) =>
                      updateForm(
                        "validUntil",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Overall Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(event) =>
                      updateForm(
                        "discount",
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Overall Tax
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax}
                    onChange={(event) =>
                      updateForm(
                        "tax",
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Describe this quotation..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Quotation Items
                    </h3>

                    <p className="text-xs text-slate-500">
                      Add the products or services included in this quotation.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">
                          Item {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(index)
                          }
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Product
                          </label>

                          <select
                            value={item.productId}
                            onChange={(event) =>
                              handleProductChange(
                                index,
                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          >
                            <option value="">
                              Custom item
                            </option>

                            {products.map(
                              (product) => (
                                <option
                                  key={product.id}
                                  value={product.id}
                                >
                                  {product.name}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Quantity *
                          </label>

                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "quantity",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Description *
                          </label>

                          <input
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                            required
                            maxLength={500}
                            placeholder="Product or service description"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Unit Price *
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "unitPrice",
                                event.target.value,
                              )
                            }
                            required
                            placeholder="0.00"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Item Discount
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "discount",
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Item Tax
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.tax}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "tax",
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-end">
                  <div className="w-full max-w-sm space-y-2 rounded-xl bg-white p-4">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Calculated subtotal</span>
                      <span className="font-medium text-slate-900">
                        {formatAmount(
                          calculatedSubtotal,
                          form.currency ||
                            "NGN",
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Overall discount</span>
                      <span className="font-medium text-slate-900">
                        -
                        {formatAmount(
                          form.discount || 0,
                          form.currency ||
                            "NGN",
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Overall tax</span>
                      <span className="font-medium text-slate-900">
                        {formatAmount(
                          form.tax || 0,
                          form.currency ||
                            "NGN",
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="font-semibold text-slate-900">
                        Estimated Total
                      </span>

                      <span className="font-bold text-slate-900">
                        {formatAmount(
                          calculatedTotal,
                          form.currency ||
                            "NGN",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateForm(
                      "notes",
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Additional quotation notes..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
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
                    : editingQuotation
                      ? "Save Changes"
                      : "Create Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
