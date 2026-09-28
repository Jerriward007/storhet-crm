"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getUser } from "../../../lib/auth";

type Contact = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  company?: {
    id: string;
    name: string;
  } | null;
};

type Company = {
  id: string;
  name: string;
};

type ContactForm = {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  notes: string;
};

const emptyForm: ContactForm = {
  companyId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  notes: "",
};

export default function ContactsPage() {
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);

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

      const [contactsResponse, companiesResponse] = await Promise.all([
        api.get("/contacts"),
        api.get("/companies"),
      ]);

      const contactsData = Array.isArray(contactsResponse.data)
        ? contactsResponse.data
        : contactsResponse.data?.data || [];

      const companiesData = Array.isArray(companiesResponse.data)
        ? companiesResponse.data
        : companiesResponse.data?.data || [];

      setContacts(contactsData);
      setCompanies(companiesData);
    } catch (err: any) {
      console.error("Contacts error:", err);

      if (err?.response?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load contacts.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingContact(null);

    setForm({
      ...emptyForm,
      companyId: companies[0]?.id || "",
    });

    setError("");
    setShowModal(true);
  }

  function openEditModal(contact: Contact) {
    setEditingContact(contact);

    setForm({
      companyId: contact.companyId || contact.company?.id || "",
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      jobTitle: contact.jobTitle || "",
      notes: contact.notes || "",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingContact(null);
    setForm(emptyForm);
  }

  function updateField(
    field: keyof ContactForm,
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

    if (!form.companyId) {
      setError("Please select a company.");
      return;
    }

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        companyId: form.companyId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editingContact) {
        await api.patch(
          `/contacts/${editingContact.id}`,
          payload,
        );
      } else {
        await api.post("/contacts", payload);
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error("Save contact error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save contact.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveContact(contact: Contact) {
    const confirmed = window.confirm(
      `Archive "${contact.firstName} ${contact.lastName}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/contacts/${contact.id}`);

      await loadData();
    } catch (err: any) {
      console.error("Archive contact error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to archive contact.",
      );
    }
  }

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return contacts;

    return contacts.filter((contact) => {
      const companyName =
        contact.company?.name ||
        companies.find(
          (company) => company.id === contact.companyId,
        )?.name ||
        "";

      return [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.jobTitle,
        companyName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term),
        );
    });
  }, [contacts, companies, search]);

  function getCompanyName(contact: Contact) {
    return (
      contact.company?.name ||
      companies.find(
        (company) => company.id === contact.companyId,
      )?.name ||
      "Company not specified"
    );
  }

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
                Contacts
              </h1>

              <p className="text-xs text-slate-500">
                Manage people connected to your companies
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Add Contact
            </span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              All Contacts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {contacts.length}{" "}
              {contacts.length === 1
                ? "contact"
                : "contacts"}{" "}
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
              placeholder="Search contacts..."
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
              Loading contacts...
            </p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search
                ? "No contacts found"
                : "No contacts yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Add your first contact to start building your customer database."}
            </p>

            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Contact
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <UserRound size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {contact.firstName}{" "}
                        {contact.lastName}
                      </h3>

                      <p className="truncate text-xs text-slate-500">
                        {contact.jobTitle ||
                          "Job title not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        openEditModal(contact)
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      title="Edit contact"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() =>
                        archiveContact(contact)
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Archive contact"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-xs font-medium text-slate-500">
                    Company
                  </p>

                  <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
                    {getCompanyName(contact)}
                  </p>
                </div>

                <div className="mt-4 space-y-2.5">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail
                        size={15}
                        className="text-slate-400"
                      />

                      <span className="truncate">
                        {contact.email}
                      </span>
                    </div>
                  )}

                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone
                        size={15}
                        className="text-slate-400"
                      />

                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    onClick={() =>
                      openEditModal(contact)
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View / Edit contact
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
                  {editingContact
                    ? "Edit Contact"
                    : "Add Contact"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editingContact
                    ? "Update contact information"
                    : "Create a new contact record"}
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
                    Company *
                  </label>

                  <select
                    value={form.companyId}
                    onChange={(event) =>
                      updateField(
                        "companyId",
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Select a company
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

                  {companies.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      You need to create a company before
                      adding a contact.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First Name *
                  </label>

                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      updateField(
                        "firstName",
                        event.target.value,
                      )
                    }
                    required
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
                      updateField(
                        "lastName",
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Doe"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="+234..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job Title
                  </label>

                  <input
                    value={form.jobTitle}
                    onChange={(event) =>
                      updateField(
                        "jobTitle",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Managing Director"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Additional notes..."
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
                  disabled={saving || companies.length === 0}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingContact
                      ? "Save Changes"
                      : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
