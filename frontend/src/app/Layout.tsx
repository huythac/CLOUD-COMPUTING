import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/',     label: 'Contacts',           end: true  },
  { to: '/send', label: 'Send Message',        end: false },
  { to: '/logs', label: 'Communication Logs',  end: false },
];

export default function Layout() {
  return (
    <div className="flex h-full bg-slate-50">

      {/* ── Sidebar ── */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* Brand */}
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Address Book Manager</p>
          <p className="mt-0.5 text-xs text-slate-400">SaaS MVP</p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-0.5 p-3 pt-4">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')
              }
            >
              {/* Colour-inheriting icon placeholder */}
              <div className="h-4 w-4 flex-shrink-0 rounded bg-current opacity-40" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky topbar */}
        <header className="sticky top-0 z-10 flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm">
          <span className="text-sm font-semibold text-slate-800">Dashboard</span>
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Search…"
              className="h-8 w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
