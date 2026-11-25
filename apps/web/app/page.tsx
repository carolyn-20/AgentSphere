'use client';

import { useState } from 'react';

const nav = [
  'Overview',
  'Agents',
  'Workflows',
  'Knowledge',
  'Tools',
  'Executions',
  'Approvals',
  'Usage & Billing',
  'Audit log',
  'Settings',
] as const;

type Page = (typeof nav)[number];
type SectionPage = Exclude<Page, 'Overview'>;

const sectionViews: Record<
  SectionPage,
  {
    description: string;
    columns: string[];
    rows: string[][];
    action?: string;
  }
> = {
  Agents: {
    description: 'Create, configure, and monitor workspace agents.',
    columns: ['Agent', 'Status', 'Prompt version', 'Last updated'],
    rows: [
      ['Support Assistant', 'Active', 'v3 · Published', '2 minutes ago'],
      ['Invoice Reviewer', 'Active', 'v2 · Published', '18 minutes ago'],
      ['Lead Qualifier', 'Draft', 'v1 · Unpublished', 'Yesterday'],
    ],
    action: 'Create agent',
  },
  Workflows: {
    description: 'Design and manage multi-step automations.',
    columns: ['Workflow', 'Status', 'Steps', 'Last updated'],
    rows: [
      ['Invoice review', 'Enabled', '4 steps', 'Today'],
      ['Support escalation', 'Draft', '6 steps', 'Yesterday'],
      ['Lead enrichment', 'Enabled', '3 steps', 'Nov 22'],
    ],
    action: 'Create workflow',
  },
  Knowledge: {
    description: 'Manage documents available to your agents.',
    columns: ['Document', 'Status', 'Chunks', 'Added'],
    rows: [
      ['Support handbook.pdf', 'Ready', '184', '2 hours ago'],
      ['Product catalog.csv', 'Processing', '—', '10 minutes ago'],
      ['Billing policies.docx', 'Ready', '42', 'Nov 23'],
    ],
    action: 'Add document',
  },
  Tools: {
    description: 'Configure the tools agents can use.',
    columns: ['Tool', 'Status', 'Description', ''],
    rows: [
      ['CRM lookup', 'Disabled', 'Read-only contact search', ''],
      ['Ticket search', 'Enabled', 'Search support tickets', ''],
      ['Slack message', 'Approval required', 'Post to a team channel', ''],
    ],
    action: 'Add tool',
  },
  Executions: {
    description: 'Review recent agent runs and their outcomes.',
    columns: ['Agent', 'Status', 'Started', 'Tokens'],
    rows: [
      ['Support Assistant', 'Succeeded', '09:42', '1,240'],
      ['Invoice Reviewer', 'Waiting approval', '09:39', '860'],
      ['Lead Qualifier', 'Failed · timeout', '09:31', '430'],
    ],
  },
  Approvals: {
    description: 'Review protected actions before they are executed.',
    columns: ['Requested action', 'Agent', 'Requested', 'Status'],
    rows: [
      ['Review invoice #1042', 'Invoice Reviewer', '18 minutes ago', 'Pending'],
      ['Send customer reply', 'Support Assistant', '4 minutes ago', 'Pending'],
    ],
  },
  'Usage & Billing': {
    description: 'Monitor workspace usage and plan details.',
    columns: ['Metric', 'Current', 'Details', ''],
    rows: [
      ['Monthly tokens', '68,000 / 100,000', '68% of allowance', ''],
      ['Current plan', 'Free', 'No billing configured', ''],
      ['Estimated spend', '$0.00', 'Simulation only', ''],
    ],
  },
  'Audit log': {
    description: 'Track important changes made in this workspace.',
    columns: ['Event', 'Actor', 'Resource', 'Time'],
    rows: [
      ['Agent updated', 'Alex Morgan', 'Support Assistant', '09:42'],
      ['Approval requested', 'System', 'Invoice Reviewer', '09:39'],
      ['Tool disabled', 'Alex Morgan', 'CRM lookup', 'Yesterday'],
    ],
  },
  Settings: {
    description: 'Manage workspace preferences and access controls.',
    columns: ['Setting', 'Current value', 'Details', ''],
    rows: [
      ['Workspace profile', 'Acme Workspace', 'Workspace name and details', ''],
      ['Members and roles', '4 members', 'Manage workspace access', ''],
      ['Security', 'MFA optional', 'Review security policies', ''],
      ['Provider keys', 'Not configured', 'Connect a model provider', ''],
    ],
  },
};

function SectionView({ active }: { active: SectionPage }) {
  const view = sectionViews[active];

  return (
    <section className="bg-white rounded-xl border p-5">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h2 className="font-semibold">{active}</h2>
          <p className="text-sm text-slate-500 mt-1">{view.description}</p>
        </div>
        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded">
          Demo data
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-slate-400">
              {view.columns.map((column, index) => (
                <th className="px-3 py-3 font-medium" key={`${column}-${index}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row, rowIndex) => (
              <tr className="border-b last:border-0" key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td className="px-3 py-4 text-slate-600" key={`${cell}-${cellIndex}`}>
                    {cell || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Home() {
  const [active, setActive] = useState<Page>('Overview');
  const [agentName, setAgentName] = useState('Support Assistant');
  const [prompt, setPrompt] = useState(
    'You are a helpful support agent. Use approved knowledge and ask for human approval before sensitive actions.',
  );
  const [notice, setNotice] = useState('Workspace ready · Demo data');
  const stats = [
    ['Active agents', '08', '2 published this week'],
    ['Executions today', '1,284', '+12.8% vs yesterday'],
    ['Tokens this month', '2.4M', '68% of monthly allowance'],
    ['Pending approvals', '06', '2 waiting more than 1 hour'],
  ];
  const action = active === 'Overview' ? 'Create agent' : sectionViews[active].action;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-[#111827] text-white p-5 hidden md:block">
        <div className="text-xl font-bold tracking-tight mb-1">✳ AgentSphere</div>
        <div className="text-xs text-slate-400 mb-9">AI OPERATIONS CLOUD</div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
          Workspace
        </div>
        {nav.map((page) => (
          <button
            key={page}
            onClick={() => setActive(page)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 ${
              active === page
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            {page}
          </button>
        ))}
        <div className="absolute bottom-5 text-xs text-slate-500">
          Acme Workspace · Free plan
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="text-sm text-slate-500">
            Workspace / <b className="text-slate-800">{active}</b>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">Docs</span>
            <span className="rounded-full bg-violet-100 text-violet-700 px-3 py-1">
              Owner
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-200 grid place-items-center font-semibold">
              A
            </div>
          </div>
        </header>

        <div className="p-6 md:p-9 max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between gap-4 mb-7">
            <div>
              <div className="text-sm text-slate-500">TUESDAY, NOVEMBER 25, 2026</div>
              <h1 className="text-3xl font-semibold mt-1">{active}</h1>
              <p className="text-slate-500 mt-1">
                {active === 'Overview'
                  ? 'Build, govern and observe your AI workforce.'
                  : sectionViews[active].description}
              </p>
            </div>
            {action && (
              <button
                onClick={() =>
                  setNotice(
                    active === 'Overview'
                      ? 'New agent draft created. Configure and save it below.'
                      : `${action} is a demo action.`,
                  )
                }
                className="bg-brand text-white rounded-lg px-4 py-2.5 text-sm font-medium"
              >
                ＋ {action}
              </button>
            )}
          </div>

          {active === 'Overview' ? (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                {stats.map(([label, value, detail]) => (
                  <div className="bg-white rounded-xl border p-5" key={label}>
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="text-3xl font-semibold mt-2">{value}</div>
                    <div className="text-xs text-emerald-600 mt-2">{detail}</div>
                  </div>
                ))}
              </div>

              <div className="grid xl:grid-cols-3 gap-5">
                <section className="xl:col-span-2 bg-white rounded-xl border p-5">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h2 className="font-semibold">Agent builder</h2>
                      <p className="text-sm text-slate-500">
                        Configure behavior and prompt governance
                      </p>
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                      Draft
                    </span>
                  </div>
                  <label className="text-sm font-medium">Agent name</label>
                  <input
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    className="w-full border rounded-lg p-3 mt-2 mb-4 outline-none focus:ring-2 focus:ring-violet-200"
                  />
                  <label className="text-sm font-medium">System prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={6}
                    className="w-full border rounded-lg p-3 mt-2 font-mono text-sm outline-none focus:ring-2 focus:ring-violet-200"
                  />
                  <div className="flex justify-between mt-4">
                    <span className="text-xs text-slate-400">
                      Prompt version · v3 · Not published
                    </span>
                    <button
                      onClick={() => setNotice(`Saved local draft: ${agentName}`)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Save draft
                    </button>
                  </div>
                </section>

                <section className="bg-white rounded-xl border p-5">
                  <h2 className="font-semibold">Execution activity</h2>
                  <p className="text-sm text-slate-500 mb-5">
                    Latest workspace events
                  </p>
                  {[
                    ['09:42:18', 'Customer support agent', 'Completed', 'green'],
                    ['09:39:04', 'Invoice review', 'Needs approval', 'amber'],
                    ['09:35:51', 'Knowledge sync', 'Completed', 'green'],
                    ['09:31:12', 'Lead qualification', 'Failed · timeout', 'red'],
                    ['09:27:45', 'Customer support agent', 'Completed', 'green'],
                  ].map(([time, name, status, color]) => (
                    <div className="py-3 border-b last:border-0" key={time}>
                      <div className="flex justify-between gap-2">
                        <b className="text-sm">{name}</b>
                        <span
                          className={`text-xs ${
                            color === 'green'
                              ? 'text-emerald-600'
                              : color === 'amber'
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{time} · Today</div>
                    </div>
                  ))}
                </section>

                <section className="xl:col-span-2 bg-white rounded-xl border p-5">
                  <div className="flex justify-between mb-4">
                    <div>
                      <h2 className="font-semibold">Usage overview</h2>
                      <p className="text-sm text-slate-500">
                        Token consumption · current billing period
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">Last 30 days</span>
                  </div>
                  <div className="h-36 flex items-end gap-2">
                    {[35, 48, 42, 62, 55, 70, 58, 82, 66, 75, 91, 68, 80, 60, 86, 72, 96, 76, 84, 65, 90, 72, 82, 94, 68, 78, 88, 72].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-violet-200 hover:bg-violet-500 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Nov 1</span>
                    <span>Nov 15</span>
                    <span>Nov 30</span>
                  </div>
                </section>

                <section className="bg-white rounded-xl border p-5">
                  <h2 className="font-semibold mb-4">Approval queue</h2>
                  <div className="text-3xl font-semibold">
                    06 <span className="text-sm text-slate-400 font-normal">pending</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 mb-4">
                    Human review required before protected actions.
                  </p>
                  <button
                    onClick={() => setActive('Approvals')}
                    className="text-sm text-brand font-medium"
                  >
                    Review requests →
                  </button>
                </section>
              </div>
            </>
          ) : (
            <SectionView active={active} />
          )}

          <div className="mt-5 text-xs text-slate-400">
            {notice}.{' '}
            {active === 'Overview'
              ? 'Dashboard preview uses illustrative metrics; connect the API for live tenant data.'
              : 'This section uses illustrative demo data.'}
          </div>
        </div>
      </main>
    </div>
  );
}
