"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  category?: string | null;
  unitPrice?: string | number | null;
  costPrice?: string | number | null;
  currency?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  category: string;
  unitPrice: string;
  costPrice: string;
  currency: string;
  isActive: boolean;
};

const categories = [
  "SOFTWARE",
  "HARDWARE",
  "SERVICE",
  "SUBSCRIPTION",
  "OTHER",
];

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  description: "",
  category: "OTHER",
  unitPrice: "",
  costPrice: "",
  currency: "NGN",
  isActive: true,
};

function formatLabel(value?: string | null) {
  if (!value) return "Other";

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

function categoryClass(category?: string | null) {
  switch (category) {
    case "SOFTWARE":
      return "bg-blue-50 text-blue-700";
    case "HARDWARE":
      return "bg-purple-50 text-purple-700";
    case "SERVICE":
      return "bg-emerald-50 text-emerald-700";
    case "SUBSCRIPTION":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    loadProducts();
  }, [router]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      setProducts(data);
    } catch (err: any) {
      console.error("Products error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "OTHER",
      unitPrice:
        product.unitPrice !== null &&
        product.unitPrice !== undefined
          ? String(product.unitPrice)
          : "",
      costPrice:
        product.costPrice !== null &&
        product.costPrice !== undefined
          ? String(product.costPrice)
          : "",
      currency: product.currency || "NGN",
      isActive: product.isActive !== false,
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
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
      setError("Product name is required.");
      return;
    }

    if (!form.unitPrice) {
      setError("Unit price is required.");
      return;
    }

    if (Number(form.unitPrice) < 0) {
      setError("Unit price cannot be negative.");
      return;
    }

    if (
      form.costPrice &&
      Number(form.costPrice) < 0
    ) {
      setError("Cost price cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description:
          form.description.trim() || undefined,
        category: form.category,
        unitPrice: form.unitPrice,
        costPrice:
          form.costPrice || undefined,
        currency: form.currency.trim() || "NGN",
        isActive: form.isActive,
      };

      if (editingProduct) {
        await api.patch(
          `/products/${editingProduct.id}`,
          payload,
        );
      } else {
        await api.post("/products", payload);
      }

      closeModal();
      await loadProducts();
    } catch (err: any) {
      console.error("Save product error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/products/${product.id}`);

      await loadProducts();
    } catch (err: any) {
      console.error("Delete product error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete product.",
      );
    }
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        [
          product.name,
          product.sku,
          product.description,
          product.category,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(term),
          );

      const matchesCategory =
        categoryFilter === "ALL" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE"
          ? product.isActive !== false
          : product.isActive === false);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);

  const activeCount = products.filter(
    (product) => product.isActive !== false,
  ).length;

  const inactiveCount = products.filter(
    (product) => product.isActive === false,
  ).length;

  const totalProducts = products.length;

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
                Products
              </h1>

              <p className="text-xs text-slate-500">
                Manage your products and services
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Add Product
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Total Products
              </p>

              <Package
                size={20}
                className="text-blue-600"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Products
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive Products
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Product Catalogue
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}{" "}
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
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {formatLabel(category)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
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
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Package size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search ||
              categoryFilter !== "ALL" ||
              statusFilter !== "ALL"
                ? "No products found"
                : "No products yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search ||
              categoryFilter !== "ALL" ||
              statusFilter !== "ALL"
                ? "Try changing your search or filters."
                : "Create your first product or service to build your catalogue."}
            </p>

            {!search &&
              categoryFilter === "ALL" &&
              statusFilter === "ALL" && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Add Product
                </button>
              )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Package size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {product.name}
                      </h3>

                      <p className="truncate text-xs text-slate-500">
                        {product.sku
                          ? `SKU: ${product.sku}`
                          : "No SKU"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        openEditModal(product)
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      title="Edit product"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() =>
                        deleteProduct(product)
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-2xl font-bold text-slate-900">
                    {formatAmount(
                      product.unitPrice,
                      product.currency || "NGN",
                    )}
                  </p>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass(
                      product.category,
                    )}`}
                  >
                    {formatLabel(product.category)}
                  </span>
                </div>

                {product.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>
                )}

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  {product.costPrice !== null &&
                    product.costPrice !== undefined && (
                      <p>
                        <span className="font-medium text-slate-800">
                          Cost price:
                        </span>{" "}
                        {formatAmount(
                          product.costPrice,
                          product.currency || "NGN",
                        )}
                      </p>
                    )}

                  <p>
                    <span className="font-medium text-slate-800">
                      Status:
                    </span>{" "}
                    <span
                      className={
                        product.isActive !== false
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }
                    >
                      {product.isActive !== false
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    onClick={() =>
                      openEditModal(product)
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View / Edit product
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingProduct
                    ? "Update product information"
                    : "Add a product or service to your catalogue"}
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
                    Product Name *
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
                    maxLength={200}
                    placeholder="e.g. SolarWinds Network Monitoring"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SKU
                  </label>

                  <input
                    value={form.sku}
                    onChange={(event) =>
                      updateField(
                        "sku",
                        event.target.value,
                      )
                    }
                    maxLength={100}
                    placeholder="e.g. SW-NPM-001"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {formatLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Unit Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(event) =>
                      updateField(
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
                    Cost Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) =>
                      updateField(
                        "costPrice",
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

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        updateField(
                          "isActive",
                          event.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        Active product
                      </span>

                      <span className="block text-xs text-slate-500">
                        Available for use in the CRM
                      </span>
                    </span>
                  </label>
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
                    placeholder="Describe the product or service..."
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
                    : editingProduct
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
