import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLogs } from "../api/log";
import { getCustomers } from "../api/customer";
import { useAuth } from "../contexts/AuthContext";

type ChannelFilter = "all" | "email" | "sms";

const thCls =
  "px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
const tdCls = "px-5 py-3.5 text-sm";

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] =
    useState<ChannelFilter>("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const logs = await getLogs();
      setLogs(logs);

      const customers = await getCustomers(Number(user!.id));
      setNameMap(
        new Map(customers.map((c: any) => [String(c.id), c.name]))
      );

      setReady(true);
    }
    load();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (
        channelFilter !== "all" &&
        log.type.toLowerCase() !== channelFilter
      )
        return false;

      if (q && !log.message.toLowerCase().includes(q)) return false;

      return true;
    });
  }, [logs, search, channelFilter]);

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  return (
    <div
      className={`mx-auto max-w-4xl space-y-6 transition-opacity ${ready ? "opacity-100" : "opacity-0"
        }`}
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Communication Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          History of real cloud messages.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search message..."
          className="h-9 w-64 rounded-lg border px-3 text-sm"
        />

        <div className="inline-flex rounded-lg border bg-slate-100 p-0.5">
          {["all", "email", "sms"].map((f) => (
            <button
              key={f}
              onClick={() =>
                setChannelFilter(f as ChannelFilter)
              }
              className={`px-3 py-1.5 text-sm rounded-md ${channelFilter === f
                ? "bg-white shadow"
                : "text-slate-500"
                }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-xl border p-16 text-center bg-white">
          <p className="text-sm text-slate-500">No logs</p>
          <Link
            to="/"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go send message
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                {["Time", "Channel", "Customer", "Status", "Message"].map(
                  (h) => (
                    <th key={h} className={thCls}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className={tdCls}>
                    {formatDate(log.createdAt)}
                  </td>

                  <td className={tdCls}>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${log.type === "EMAIL"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-violet-50 text-violet-700"
                        }`}
                    >
                      {log.type}
                    </span>
                  </td>

                  <td className={tdCls}>
                    {nameMap.get(String(log.customerId)) ||
                      log.customerId}
                  </td>

                  <td className={tdCls}>
                    <span
                      className={`text-xs font-medium ${log.status === "SENT"
                        ? "text-emerald-600"
                        : "text-red-500"
                        }`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className={`${tdCls} max-w-xs truncate`}>
                    {log.message}
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