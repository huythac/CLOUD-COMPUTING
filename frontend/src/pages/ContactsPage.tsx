import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Customer } from '../types/customer';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "../api/customer";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormFields = { name: string; phone: string; email: string; address: string };
type FormErrors = Partial<Record<keyof FormFields, string>>;
const EMPTY: FormFields = { name: '', phone: '', email: '', address: '' };

// ─── Shared style helpers ─────────────────────────────────────────────────────

const btnPrimary =
  'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700';
const btnGhost =
  'rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100';
const thCls =
  'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const tdCls = 'px-5 py-3.5 text-sm';

function inputCls(err: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors',
    err
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20',
  ].join(' ');
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ContactModal({
  initial, onSave, onClose,
}: {
  initial?: Customer;
  onSave: (f: FormFields) => void;
  onClose: () => void;
}) {
  const [fields, setFields] = useState<FormFields>(
    initial
      ? { name: initial.name, phone: initial.phone, email: initial.email ?? '', address: initial.address ?? '' }
      : EMPTY,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  function set(k: keyof FormFields, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!fields.name.trim()) errs.name = 'Name is required.';
    if (!fields.phone.trim()) errs.phone = 'Phone is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(fields);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{initial ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="space-y-4 px-6 py-5">
            {(
              [
                { key: 'name', label: 'Name', req: true, type: 'text', ph: 'Full name' },
                { key: 'phone', label: 'Phone', req: true, type: 'tel', ph: '555-0100' },
                { key: 'email', label: 'Email', req: false, type: 'email', ph: 'optional@example.com' },
                { key: 'address', label: 'Address', req: false, type: 'text', ph: 'Street, City' },
              ] as { key: keyof FormFields; label: string; req: boolean; type: string; ph: string }[]
            ).map(({ key, label, req, type, ph }, i) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {label}{req && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                <input
                  ref={i === 0 ? firstRef : undefined}
                  type={type}
                  value={fields[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph}
                  className={inputCls(!!errors[key])}
                />
                {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
            <button type="submit" className={btnPrimary}>{initial ? 'Save Changes' : 'Add Contact'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const USER_ID = '1';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Customer | null | 'new'>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const data = await getCustomers(Number(USER_ID));
    setCustomers(data);
    setReady(true);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? customers.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q))
      : customers;
  }, [customers, search]);

  const visibleIds = useMemo(() => new Set(filtered.map((c) => c.id)), [filtered]);
  const selVisible = useMemo(() => [...selected].filter((id) => visibleIds.has(id)), [selected, visibleIds]);
  const allSelected = filtered.length > 0 && selVisible.length === filtered.length;

  function reload() {
    loadCustomers();
  }

  function toggleAll() {
    setSelected((prev) => {
      const s = new Set(prev);
      allSelected ? filtered.forEach((c) => s.delete(c.id)) : filtered.forEach((c) => s.add(c.id));
      return s;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function handleSave(fields: FormFields) {
    const payload = {
      userId: Number(USER_ID),
      ...fields,
      email: fields.email || undefined,
      address: fields.address || undefined
    };

    if (modal === "new") {
      await createCustomer(payload);
    } else if (modal) {
      await updateCustomer(Number(modal.id), payload);
    }

    reload();
    setModal(null);
  }

  async function handleDelete(c: Customer) {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;

    await deleteCustomer(Number(c.id));

    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(c.id);
      return s;
    });

    reload();
  }

  function handleSendMessage() {
    localStorage.setItem('selectedCustomerIds', JSON.stringify(selVisible));
    navigate('/send');
  }

  return (
    <>
      <div className={`space-y-5 transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Address Book</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your contacts and mailing lists.</p>
          </div>
          <button onClick={() => setModal('new')} className={btnPrimary}>Add Contact</button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="h-9 w-72 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          />
          <span className="text-sm text-slate-400">
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                {search ? 'No contacts match your search.' : 'No contacts yet — add your first one!'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                  </th>
                  {['Name', 'Email', 'Phone', 'Address', 'Actions'].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-slate-50 ${selected.has(c.id) ? 'bg-blue-50/60' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                    </td>
                    <td className={`${tdCls} font-medium text-slate-900`}>{c.name}</td>
                    <td className={`${tdCls} text-slate-600`}>{c.email ?? <span className="text-slate-300">—</span>}</td>
                    <td className={`${tdCls} text-slate-600`}>{c.phone}</td>
                    <td className={`${tdCls} text-slate-600`}>{c.address ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(c)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selVisible.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-lg">
          <span className="text-sm font-medium text-slate-700">{selVisible.length} selected</span>
          <div className="h-4 w-px bg-slate-200" />
          <button onClick={handleSendMessage} className={btnPrimary.replace('px-4 py-2', 'px-4 py-1.5')}>
            Send Message
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ContactModal
          initial={modal === 'new' ? undefined : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
