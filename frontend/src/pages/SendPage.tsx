import { getCustomers } from "../api/customer";
import { fetchAPI } from "../api/api";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCustomers } from '../data/customersRepo';

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = 'email' | 'sms';

type SendResult = {
  recipientId: string;
  name: string;
  status: 'success' | 'failed';
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem('selectedCustomerIds');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const thCls = 'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SendPage() {
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [_nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [channel, setChannel] = useState<Channel>('email');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [sent, setSent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ids = loadIds();
    setRecipientIds(ids);
    if (ids.length > 0) {
      const customers = listCustomers('1');
      setNameMap(new Map(customers.map((c) => [c.id, c.name])));
    }
    setReady(true);
  }, []);

  const canSend = recipientIds.length > 0 && message.trim().length > 0 && !sent;

  async function handleSend() {

    const customers = await getCustomers(1);

    const results: SendResult[] = [];

    for (const id of recipientIds) {

      const customer = customers.find((c: any) => String(c.id) === id);

      try {

        await fetchAPI("/send", {
          method: "POST",
          body: JSON.stringify({
            userId: 1,
            customerId: Number(id),
            type: channel.toUpperCase(),
            to: channel === "email" ? customer?.email : customer?.phone,
            subject: "Cloud Message",
            message
          })
        });

        results.push({
          recipientId: id,
          name: customer?.name || id,
          status: "success"
        });

      } catch {

        results.push({
          recipientId: id,
          name: customer?.name || id,
          status: "failed"
        });

      }
    }

    setResults(results);
    setSent(true);
  }
  function handleClear() {
    localStorage.removeItem('selectedCustomerIds');
    setRecipientIds([]);
    setNameMap(new Map());
    setResults(null);
    setSent(false);
  }

  const successCount = results?.filter((r) => r.status === 'success').length ?? 0;
  const failCount = results?.filter((r) => r.status === 'failed').length ?? 0;

  return (
    <div className={`mx-auto max-w-2xl space-y-6 transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Send Message</h1>
          <p className="mt-1 text-sm text-slate-500">Compose and send a mock message to your recipients.</p>
        </div>
        <Link to="/" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
          ← Back to Contacts
        </Link>
      </div>

      {/* Recipients banner */}
      <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${recipientIds.length === 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
        }`}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${recipientIds.length === 0 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <span className="text-sm font-medium text-slate-700">
            {recipientIds.length === 0
              ? 'No recipients selected'
              : `${recipientIds.length} recipient${recipientIds.length !== 1 ? 's' : ''} selected`}
          </span>
        </div>
        {recipientIds.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
          >
            Clear recipients
          </button>
        )}
      </div>

      {/* Composer card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Compose</h2>
        </div>

        <div className="space-y-5 p-6">
          {/* Channel toggle */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Channel</p>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(['email', 'sms'] as Channel[]).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={[
                    'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                    channel === ch ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {ch === 'email' ? 'Email' : 'SMS'}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Message
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sent}
              placeholder={channel === 'email' ? 'Write your email body…' : 'Write your SMS (160 chars recommended)…'}
              className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {channel === 'sms' && message.length > 0 && (
              <p className={`mt-1 text-right text-xs ${message.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                {message.length} / 160
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">
            {sent ? 'Message sent. Log saved.' : 'Messages are sent via cloud communication service.'}
          </p>
          <div className="flex gap-2">
            {sent && (
              <button
                onClick={() => { setMessage(''); setResults(null); setSent(false); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Send Another
              </button>
            )}
            <button
              disabled={!canSend}
              onClick={handleSend}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send Now
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4">
            <span className="text-sm font-semibold text-slate-900">Results</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{successCount} delivered
            </span>
            {failCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />{failCount} failed
              </span>
            )}
          </div>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Recipient', 'Status', 'Error'].map((h) => <th key={h} className={thCls}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.recipientId} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${r.status === 'success'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                      : 'bg-red-50 text-red-600 ring-red-500/20'
                      }`}>
                      {r.status === 'success' ? 'Delivered' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">
                    {r.error ?? <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
