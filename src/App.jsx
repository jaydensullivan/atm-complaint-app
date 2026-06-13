import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle, CreditCard, DollarSign, RefreshCw, CheckCircle, Clock,
  Filter, User, Building2, BarChart3, History, AlertTriangle,
} from 'lucide-react';

const ISSUE_TYPES = {
  cash_not_dispensed: { label: 'Cash not dispensed', icon: DollarSign },
  card_not_returned: { label: 'Card not returned', icon: CreditCard },
  currency_not_returned: { label: 'Currency exchange not returned', icon: RefreshCw },
  other: { label: 'Other issue', icon: AlertCircle },
};

const STATUS_CONFIG = {
  new: { label: 'New', badge: 'bg-blue-100 text-blue-800' },
  in_review: { label: 'In review', badge: 'bg-amber-100 text-amber-800' },
  resolved: { label: 'Resolved', badge: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', badge: 'bg-gray-100 text-gray-700' },
};

const PRIORITY_CONFIG = {
  high: { label: 'High', badge: 'bg-red-100 text-red-800', slaHours: 2 },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-800', slaHours: 8 },
  low: { label: 'Low', badge: 'bg-gray-100 text-gray-700', slaHours: 24 },
};

const STORAGE_KEY = 'atm_complaint_tickets_v1';
const COUNTER_KEY = 'atm_complaint_counter_v1';

const DEFAULT_TICKETS = [
  {
    id: 'TCK-1001',
    clientName: 'Aziz Karimov',
    atmId: 'ATM-0452, Amir Temur St.',
    issueType: 'cash_not_dispensed',
    amount: '500,000 UZS',
    cardLast4: '4321',
    transactionTime: '2026-06-12T14:30',
    description: 'I tried to withdraw 500,000 UZS but the machine showed an error and did not give me any cash. My account was debited.',
    status: 'in_review',
    priority: 'high',
    createdAt: '2026-06-12T14:45',
    notes: 'Contacted client, checking transaction logs with processing center.',
    history: [
      { time: '2026-06-12T14:45', text: 'Ticket created by client' },
      { time: '2026-06-12T15:10', text: 'Assigned to support agent, status set to In review' },
      { time: '2026-06-12T16:00', text: 'Priority set to High (debited without dispensing cash)' },
    ],
  },
  {
    id: 'TCK-1002',
    clientName: 'Dilnoza Yusupova',
    atmId: 'ATM-0118, Chilonzor Branch',
    issueType: 'card_not_returned',
    amount: '',
    cardLast4: '8890',
    transactionTime: '2026-06-13T09:10',
    description: 'The ATM kept my card after a balance inquiry. Screen went black and never returned the card.',
    status: 'new',
    priority: 'medium',
    createdAt: '2026-06-13T09:20',
    notes: '',
    history: [
      { time: '2026-06-13T09:20', text: 'Ticket created by client' },
    ],
  },
];

function loadTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tickets', e);
  }
  return DEFAULT_TICKETS;
}

function loadCounter() {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) return parseInt(raw, 10);
  } catch (e) {
    console.error('Failed to load counter', e);
  }
  return 1003;
}

function nowIso() {
  return new Date().toISOString().slice(0, 16);
}

function hoursSince(isoTime) {
  const diffMs = Date.now() - new Date(isoTime).getTime();
  return diffMs / (1000 * 60 * 60);
}

function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function ATMComplaintApp() {
  const [view, setView] = useState('client'); // 'client' | 'employee' | 'analytics'
  const [tickets, setTickets] = useState(loadTickets);
  const counterRef = React.useRef(loadCounter());

  const [form, setForm] = useState({
    clientName: '',
    atmId: '',
    issueType: 'cash_not_dispensed',
    amount: '',
    cardLast4: '',
    transactionTime: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets', e);
    }
  }, [tickets]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const id = `TCK-${counterRef.current++}`;
    try {
      localStorage.setItem(COUNTER_KEY, String(counterRef.current));
    } catch (err) {
      console.error('Failed to save counter', err);
    }
    const createdAt = nowIso();
    const newTicket = {
      id,
      ...form,
      status: 'new',
      priority: 'medium',
      createdAt,
      notes: '',
      history: [{ time: createdAt, text: 'Ticket created by client' }],
    };
    setTickets([newTicket, ...tickets]);
    setSubmitted(true);
    setForm({
      clientName: '',
      atmId: '',
      issueType: 'cash_not_dispensed',
      amount: '',
      cardLast4: '',
      transactionTime: '',
      description: '',
    });
    setTimeout(() => setSubmitted(false), 4000);
  }

  function addHistoryEntry(ticket, text) {
    return {
      ...ticket,
      history: [...(ticket.history || []), { time: nowIso(), text }],
    };
  }

  function updateTicketStatus(id, status) {
    setTickets(tickets.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, status };
      return addHistoryEntry(updated, `Status changed to "${STATUS_CONFIG[status].label}"`);
    }));
  }

  function updateTicketPriority(id, priority) {
    setTickets(tickets.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, priority };
      return addHistoryEntry(updated, `Priority changed to "${PRIORITY_CONFIG[priority].label}"`);
    }));
  }

  function updateTicketNotes(id, notes) {
    setTickets(tickets.map(t => (t.id === id ? { ...t, notes } : t)));
  }

  function commitNoteToHistory(id) {
    setTickets(tickets.map(t => {
      if (t.id !== id) return t;
      if (!t.notes) return t;
      return addHistoryEntry(t, `Note added: "${t.notes}"`);
    }));
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  const stats = useMemo(() => {
    const counts = { new: 0, in_review: 0, resolved: 0, closed: 0 };
    let breached = 0;
    let resolvedDurations = [];
    tickets.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
      const slaHours = PRIORITY_CONFIG[t.priority]?.slaHours || 24;
      const ageHours = hoursSince(t.createdAt);
      if ((t.status === 'new' || t.status === 'in_review') && ageHours > slaHours) {
        breached++;
      }
      if (t.status === 'resolved' || t.status === 'closed') {
        const resolvedEvent = (t.history || []).find(h => h.text.includes('Resolved') || h.text.includes('Closed'));
        if (resolvedEvent) {
          const dur = (new Date(resolvedEvent.time).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
          if (dur >= 0) resolvedDurations.push(dur);
        }
      }
    });
    const avgResolution = resolvedDurations.length
      ? resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length
      : null;

    const byIssueType = {};
    Object.keys(ISSUE_TYPES).forEach(k => { byIssueType[k] = 0; });
    tickets.forEach(t => { byIssueType[t.issueType] = (byIssueType[t.issueType] || 0) + 1; });

    const byAtm = {};
    tickets.forEach(t => { byAtm[t.atmId] = (byAtm[t.atmId] || 0) + 1; });
    const topAtms = Object.entries(byAtm).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { counts, breached, avgResolution, byIssueType, topAtms, total: tickets.length };
  }, [tickets]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-700" />
            <span className="text-lg font-medium text-gray-900">ATM Service Desk</span>
          </div>
          <div className="flex gap-2">
            <NavButton active={view === 'client'} onClick={() => setView('client')} icon={User} label="Client view" />
            <NavButton active={view === 'employee'} onClick={() => setView('employee')} icon={Building2} label="Employee dashboard" />
            <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} icon={BarChart3} label="Analytics" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {view === 'client' && (
          <ClientForm form={form} onChange={handleChange} onSubmit={handleSubmit} submitted={submitted} />
        )}
        {view === 'employee' && (
          <EmployeeDashboard
            tickets={filteredTickets}
            allCount={tickets.length}
            counts={stats.counts}
            filter={filter}
            setFilter={setFilter}
            selectedTicket={selectedTicket}
            setSelectedTicketId={setSelectedTicketId}
            updateTicketStatus={updateTicketStatus}
            updateTicketPriority={updateTicketPriority}
            updateTicketNotes={updateTicketNotes}
            commitNoteToHistory={commitNoteToHistory}
          />
        )}
        {view === 'analytics' && <AnalyticsView stats={stats} />}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4 inline mr-1" /> {label}
    </button>
  );
}

function ClientForm({ form, onChange, onSubmit, submitted }) {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-medium text-gray-900 mb-1">Report an ATM issue</h1>
      <p className="text-sm text-gray-500 mb-6">
        Let us know what happened and a bank representative will review your case.
      </p>

      {submitted && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Your complaint has been submitted. Our team will contact you shortly.
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your full name</label>
          <input
            required
            name="clientName"
            value={form.clientName}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Aziz Karimov"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ATM location / ID</label>
          <input
            required
            name="atmId"
            value={form.atmId}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. ATM-0452, Amir Temur St."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type of issue</label>
          <select
            name="issueType"
            value={form.issueType}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ISSUE_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount involved</label>
            <input
              name="amount"
              value={form.amount}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 500,000 UZS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card last 4 digits</label>
            <input
              name="cardLast4"
              maxLength={4}
              value={form.cardLast4}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 4321"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date and time of transaction</label>
          <input
            required
            type="datetime-local"
            name="transactionTime"
            value={form.transactionTime}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Describe what happened</label>
          <textarea
            required
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Please provide as much detail as possible..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-800 transition"
        >
          Submit complaint
        </button>
      </form>
    </div>
  );
}

function EmployeeDashboard({
  tickets, allCount, counts, filter, setFilter, selectedTicket, setSelectedTicketId,
  updateTicketStatus, updateTicketPriority, updateTicketNotes, commitNoteToHistory,
}) {
  return (
    <div>
      <h1 className="text-2xl font-medium text-gray-900 mb-1">Complaint tickets</h1>
      <p className="text-sm text-gray-500 mb-6">Review and resolve client-reported ATM issues.</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{cfg.label}</p>
            <p className="text-2xl font-medium text-gray-900">{counts[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All ({allCount})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {cfg.label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 space-y-2">
          {tickets.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">No tickets in this category.</div>
          )}
          {tickets.map(ticket => {
            const Issue = ISSUE_TYPES[ticket.issueType]?.icon || AlertCircle;
            const isSelected = selectedTicket?.id === ticket.id;
            const slaHours = PRIORITY_CONFIG[ticket.priority]?.slaHours || 24;
            const ageHours = hoursSince(ticket.createdAt);
            const isActive = ticket.status === 'new' || ticket.status === 'in_review';
            const breached = isActive && ageHours > slaHours;

            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`w-full text-left bg-white border rounded-xl p-3 hover:border-blue-400 transition ${
                  isSelected ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">{ticket.id}</span>
                  <div className="flex items-center gap-1">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Issue className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {ISSUE_TYPES[ticket.issueType]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{ticket.clientName} · {ticket.atmId}</p>
                {isActive && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${breached ? 'text-red-700' : 'text-gray-500'}`}>
                    {breached ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>
                      {breached
                        ? `SLA breached, open ${formatDuration(ageHours)} (limit ${slaHours}h)`
                        : `Open ${formatDuration(ageHours)} of ${slaHours}h SLA`}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="col-span-3">
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              updateStatus={updateTicketStatus}
              updatePriority={updateTicketPriority}
              updateNotes={updateTicketNotes}
              commitNoteToHistory={commitNoteToHistory}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400 h-full flex items-center justify-center">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

function TicketDetail({ ticket, updateStatus, updatePriority, updateNotes, commitNoteToHistory }) {
  const Issue = ISSUE_TYPES[ticket.issueType]?.icon || AlertCircle;
  const slaHours = PRIORITY_CONFIG[ticket.priority]?.slaHours || 24;
  const ageHours = hoursSince(ticket.createdAt);
  const isActive = ticket.status === 'new' || ticket.status === 'in_review';
  const breached = isActive && ageHours > slaHours;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Issue className="w-5 h-5 text-blue-700" />
          <h2 className="text-base font-medium text-gray-900">{ISSUE_TYPES[ticket.issueType]?.label}</h2>
        </div>
        <div className="flex items-center gap-1">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {isActive && (
        <div className={`flex items-center gap-2 mb-4 text-sm rounded-lg px-3 py-2 ${
          breached ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-600'
        }`}>
          {breached ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
          <span>
            {breached
              ? `SLA breached — open for ${formatDuration(ageHours)}, limit was ${slaHours}h`
              : `Open for ${formatDuration(ageHours)} of ${slaHours}h SLA target`}
          </span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
        <Field label="Ticket ID" value={ticket.id} />
        <Field label="Client" value={ticket.clientName} />
        <Field label="ATM" value={ticket.atmId} />
        <Field label="Card last 4" value={ticket.cardLast4 || '—'} />
        <Field label="Amount" value={ticket.amount || '—'} />
        <Field label="Transaction time" value={ticket.transactionTime?.replace('T', ' ') || '—'} />
      </dl>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
        <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 leading-relaxed">{ticket.description}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-1">Internal notes</p>
        <textarea
          value={ticket.notes}
          onChange={e => updateNotes(ticket.id, e.target.value)}
          onBlur={() => commitNoteToHistory(ticket.id)}
          rows={3}
          placeholder="Add resolution notes, escalation info, etc."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Priority</p>
        <div className="flex gap-2">
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => updatePriority(ticket.id, key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                ticket.priority === key
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {cfg.label} ({cfg.slaHours}h SLA)
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Update status</p>
        <div className="flex gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => updateStatus(ticket.id, key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                ticket.status === key
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> Audit log
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(ticket.history || []).slice().reverse().map((entry, idx) => (
            <div key={idx} className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
              <p className="text-gray-700">{entry.text}</p>
              <p className="text-gray-400">{entry.time?.replace('T', ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}

function AnalyticsView({ stats }) {
  const maxIssueCount = Math.max(1, ...Object.values(stats.byIssueType));
  const maxAtmCount = Math.max(1, ...stats.topAtms.map(([, c]) => c));

  return (
    <div>
      <h1 className="text-2xl font-medium text-gray-900 mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Operational overview of ATM complaint handling.</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total tickets" value={stats.total} />
        <MetricCard label="Open tickets" value={stats.counts.new + stats.counts.in_review} />
        <MetricCard
          label="SLA breaches"
          value={stats.breached}
          accent={stats.breached > 0 ? 'text-red-700' : undefined}
        />
        <MetricCard
          label="Avg. resolution time"
          value={stats.avgResolution !== null ? formatDuration(stats.avgResolution) : '—'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Tickets by issue type</h3>
          <div className="space-y-3">
            {Object.entries(ISSUE_TYPES).map(([key, val]) => {
              const count = stats.byIssueType[key] || 0;
              const pct = (count / maxIssueCount) * 100;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{val.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Top ATMs by complaint volume</h3>
          {stats.topAtms.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topAtms.map(([atmId, count]) => {
                const pct = (count / maxAtmCount) * 100;
                return (
                  <div key={atmId}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate pr-2">{atmId}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Status breakdown</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="text-center">
              <p className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${cfg.badge}`}>
                {cfg.label}
              </p>
              <p className="text-2xl font-medium text-gray-900">{stats.counts[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-medium ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
