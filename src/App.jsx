import React, { useState } from 'react';
import { AlertCircle, CreditCard, DollarSign, RefreshCw, CheckCircle, Clock, Filter, User, Building2 } from 'lucide-react';

const ISSUE_TYPES = {
  cash_not_dispensed: { label: 'Cash not dispensed', icon: DollarSign },
  card_not_returned: { label: 'Card not returned', icon: CreditCard },
  currency_not_returned: { label: 'Currency exchange not returned', icon: RefreshCw },
  other: { label: 'Other issue', icon: AlertCircle },
};

const STATUS_CONFIG = {
  new: { label: 'New', color: 'c-blue' },
  in_review: { label: 'In review', color: 'c-amber' },
  resolved: { label: 'Resolved', color: 'c-green' },
  closed: { label: 'Closed', color: 'c-gray' },
};

let ticketIdCounter = 1001;

function generateId() {
  return `TCK-${ticketIdCounter++}`;
}

export default function ATMComplaintApp() {
  const [view, setView] = useState('client'); // 'client' or 'employee'
  const [tickets, setTickets] = useState([
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
      createdAt: '2026-06-12T14:45',
      notes: 'Contacted client, checking transaction logs with processing center.',
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
      createdAt: '2026-06-13T09:20',
      notes: '',
    },
  ]);

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
  const [selectedTicket, setSelectedTicket] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newTicket = {
      id: generateId(),
      ...form,
      status: 'new',
      createdAt: new Date().toISOString().slice(0, 16),
      notes: '',
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

  function updateTicketStatus(id, status) {
    setTickets(tickets.map(t => (t.id === id ? { ...t, status } : t)));
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  }

  function updateTicketNotes(id, notes) {
    setTickets(tickets.map(t => (t.id === id ? { ...t, notes } : t)));
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket({ ...selectedTicket, notes });
    }
  }

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const stats = {
    new: tickets.filter(t => t.status === 'new').length,
    in_review: tickets.filter(t => t.status === 'in_review').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-700" />
            <span className="text-lg font-medium text-gray-900">ATM Service Desk</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('client')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === 'client' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4 inline mr-1" /> Client view
            </button>
            <button
              onClick={() => setView('employee')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === 'employee' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-1" /> Employee dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {view === 'client' ? (
          <ClientForm form={form} onChange={handleChange} onSubmit={handleSubmit} submitted={submitted} />
        ) : (
          <EmployeeDashboard
            tickets={filteredTickets}
            allCount={tickets.length}
            stats={stats}
            filter={filter}
            setFilter={setFilter}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            updateTicketStatus={updateTicketStatus}updateTicketNotes={updateTicketNotes}
          />
        )}
      </div>
    </div>
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
  tickets, allCount, stats, filter, setFilter, selectedTicket, setSelectedTicket, updateTicketStatus, updateTicketNotes,
}) {
  return (
    <div>
      <h1 className="text-2xl font-medium text-gray-900 mb-1">Complaint tickets</h1>
      <p className="text-sm text-gray-500 mb-6">Review and resolve client-reported ATM issues.</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{cfg.label}</p>
            <p className="text-2xl font-medium text-gray-900">{stats[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
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
            {cfg.label} ({stats[key] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Ticket list */}
        <div className="col-span-2 space-y-2">
          {tickets.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">No tickets in this category.</div>
          )}
          {tickets.map(ticket => {
            const Issue = ISSUE_TYPES[ticket.issueType]?.icon || AlertCircle;
            const isSelected = selectedTicket?.id === ticket.id;
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full text-left bg-white border rounded-xl p-3 hover:border-blue-400 transition ${
                  isSelected ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">{ticket.id}</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex items-center gap-2">
                  <Issue className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {ISSUE_TYPES[ticket.issueType]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{ticket.clientName} · {ticket.atmId}</p>
              </button>
            );
          })}
        </div>

        {/* Ticket detail */}
        <div className="col-span-3">
          {selectedTicket ? (<TicketDetail
              ticket={selectedTicket}
              updateStatus={updateTicketStatus}
              updateNotes={updateTicketNotes}
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
  const colorMap = {
    new: 'bg-blue-100 text-blue-800',
    in_review: 'bg-amber-100 text-amber-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[status]}`}>
      {cfg.label}
    </span>
  );
}

function TicketDetail({ ticket, updateStatus, updateNotes }) {
  const Issue = ISSUE_TYPES[ticket.issueType]?.icon || AlertCircle;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Issue className="w-5 h-5 text-blue-700" />
          <h2 className="text-base font-medium text-gray-900">{ISSUE_TYPES[ticket.issueType]?.label}</h2>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

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
          rows={3}
          placeholder="Add resolution notes, escalation info, etc."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
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