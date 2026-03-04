import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CommunicationLog } from '../types/log';
import { listLogs } from '../data/logsRepo';
import { listCustomers } from '../data/customersRepo';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelFilter = 'all' | 'email' | 'sms';

// ─── Shared style helpers ─────────────────────────────────────────────────────

const thCls = 'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const tdCls = 'px-5 py-3.5 text-sm';

// ─── Sub-component: Expanded row details ─────────────────────────────────────

function ExpandedDetails({
  log,
  nameMap,
}: {
  log: CommunicationLog;
  nameMap: Map<string, string>;
}) {
  return (
    <tr>
      <td colSpan={5} className="bg-slate-50 px-5 pb-4 pt-0">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-100">
              <tr>
                {['Recipient', 'Status', 'Error'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {log.results.map((r) => (
                <tr key={r.recipientId} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                    {nameMap.get(r.recipientId) ?? r.recipientId}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        r.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                          : 'bg-red-50 text-red-600 ring-red-500/20'
                      }`}
                    >
                      {r.status === 'success' ? 'Delivered' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-400">
                    {r.error ?? <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const allLogs = listLogs();
    setLogs(allLogs);
    const customers = listCustomers('1');
    setNameMap(new Map(customers.map((c) => [c.id, c.name])));
    setReady(true);
  }, []);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (channelFilter !== 'all' && log.channel !== channelFilter) return false;
      if (q && !log.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, search, channelFilter]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  const CHANNEL_FILTERS: { label: string; value: ChannelFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
  ];

  return (
    <div
      className={`mx-auto max-w-4xl space-y-6 transition-opacity duration-150 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Communication Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          A history of all mock messages sent from this device.
        </p>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by message…"
          className="h-9 w-64 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        />

        {/* Channel filter */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          {CHANNEL_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setChannelFilter(value)}
              className={[
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                channelFilter === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredLogs.length > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Logs table */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20">
          {logs.length === 0 ? (
            <>
              <p className="text-sm font-medium text-slate-600">No logs yet</p>
              <p className="mt-1 text-xs text-slate-400">Send a message to see the history here.</p>
              <Link
                to="/"
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Go to Contacts
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-600">No results</p>
              <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filter.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Time', 'Channel', 'Recipients', 'Status', 'Message'].map((h) => (
                  <th key={h} className={thCls}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const successCount = log.results.filter((r) => r.status === 'success').length;
                const failCount = log.results.filter((r) => r.status === 'failed').length;

                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => toggleExpand(log.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      {/* Time */}
                      <td className={`${tdCls} whitespace-nowrap text-slate-500`}>
                        {formatDate(log.createdAt)}
                      </td>

                      {/* Channel */}
                      <td className={tdCls}>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            log.channel === 'email'
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                              : 'bg-violet-50 text-violet-700 ring-violet-600/20'
                          }`}
                        >
                          {log.channel === 'email' ? 'Email' : 'SMS'}
                        </span>
                      </td>

                      {/* Recipients count */}
                      <td className={`${tdCls} text-slate-700`}>
                        {log.recipientIds.length}
                      </td>

                      {/* Status summary */}
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          {successCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {successCount}
                            </span>
                          )}
                          {failCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {failCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Message preview + chevron */}
                      <td className={`${tdCls} max-w-xs`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-slate-700">{log.message}</span>
                          <svg
                            className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <ExpandedDetails log={log} nameMap={nameMap} />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
