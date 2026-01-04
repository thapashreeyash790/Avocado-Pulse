
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole, Invoice, Project, ClientProfile, Expense, Estimate } from '../types';

const SalesView: React.FC = () => {
  const {
    projects, invoices, clients, user, generateInvoice, payInvoice, updateInvoiceStatus,
    expenses, addExpense, estimates, addEstimate, convertEstimateToInvoice,
    deleteInvoice, deleteEstimate, deleteExpense
  } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'estimates' | 'expenses'>('invoices');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddEstimate, setShowAddEstimate] = useState(false);

  const getCurrencySymbol = (projectId?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'रु';
    const cur = project.currency;
    if (cur === 'NPR') return 'रु';
    if (cur === 'USD') return '$';
    if (cur === 'INR') return '₹';
    if (cur === 'EUR') return '€';
    if (cur === 'GBP') return '£';
    return cur || 'रु';
  };

  const isInternal = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Financial Suite</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Manage Invoices, Professional Estimates, and Project Expenses</p>
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {(['invoices', 'estimates', 'expenses'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'invoices' && (
            <div className="space-y-8">
              {isInternal && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 font-bold text-black dark:text-white border-l-4 border-indigo-600">Draft Invoicing from Active Projects</div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {projects.filter(p => p.status !== 'ARCHIVED').map(p => (
                      <div key={p.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div>
                          <h4 className="font-bold text-black dark:text-white">{p.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Available Budget: {getCurrencySymbol(p.id)}{p.budget.toLocaleString()}</p>
                        </div>
                        {invoices.some(inv => inv.projectId === p.id && inv.status !== 'PAID') ? (
                          <button disabled className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed">
                            Pending Invoice
                          </button>
                        ) : (
                          <button onClick={() => generateInvoice(p.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
                            Generate Invoice
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-black dark:text-white">Outstanding Invoices</h3>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">Action Required</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Remaining</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {invoices.filter(inv => inv.status !== 'PAID').map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-black dark:text-white">{inv.id}</td>
                          <td className="px-6 py-4 font-black text-black dark:text-white">{getCurrencySymbol(inv.projectId)}{inv.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 font-semibold text-red-500">{getCurrencySymbol(inv.projectId)}{(inv.amount - inv.paidAmount).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {isInternal && (
                              <>
                                <button onClick={() => updateInvoiceStatus(inv.id, 'PAID')} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"><ICONS.Check className="w-4 h-4" /></button>
                                <button onClick={() => deleteInvoice(inv.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><ICONS.X className="w-4 h-4" /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {invoices.filter(inv => inv.status !== 'PAID').length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No outstanding invoices. Good job!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-black dark:text-white opacity-60">Settled History</h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">Paid</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Paid Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {invoices.filter(inv => inv.status === 'PAID').map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors opacity-70 hover:opacity-100">
                          <td className="px-6 py-4 font-bold text-black dark:text-white">{inv.id}</td>
                          <td className="px-6 py-4 font-black text-black dark:text-white">{getCurrencySymbol(inv.projectId)}{inv.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 font-medium text-gray-500 dark:text-slate-400">{new Date().toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                              PAID
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {isInternal && (
                              <button onClick={() => deleteInvoice(inv.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><ICONS.X className="w-4 h-4" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {invoices.filter(inv => inv.status === 'PAID').length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No payment history yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'estimates' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setShowAddEstimate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">New Estimate</button>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {estimates.map(est => (
                        <tr key={est.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-black dark:text-white">{clients.find(c => c.id === est.clientId)?.name}</td>
                          <td className="px-6 py-4 font-black text-black dark:text-white">रु{est.total.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${est.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                              est.status === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                              {est.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                            {isInternal && (
                              <>
                                {est.status === 'ACCEPTED' && (
                                  <button onClick={() => convertEstimateToInvoice(est.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black hover:bg-green-100">Convert to Invoice</button>
                                )}
                                <button onClick={() => deleteEstimate(est.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><ICONS.X className="w-4 h-4" /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {estimates.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">No estimates yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setShowAddExpense(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">Record Expense</button>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {expenses.map(ex => (
                        <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-black dark:text-white">{ex.title}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-medium">{ex.category}</td>
                          <td className="px-6 py-4 font-black text-black dark:text-white">रु{ex.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ex.status === 'REIMBURSED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                              {ex.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isInternal && (
                              <button onClick={() => deleteExpense(ex.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><ICONS.X className="w-4 h-4" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">No expenses recorded.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Total Revenue</h4>
            <div className="text-3xl font-black">रु{invoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</div>
            <p className="text-[10px] mt-2 opacity-50">From Paid Invoices</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-red-500 uppercase block mb-1">Unpaid Bill (Outstanding)</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                रु{invoices.filter(i => i.status !== 'PAID').reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount || 0)), 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Est. Value (Potential)</span>
              <span className="text-lg font-bold text-black dark:text-white">
                रु{estimates.filter(e => e.status === 'DRAFT' || e.status === 'SENT').reduce((sum, e) => sum + e.total, 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Unbilled Expenses</span>
              <span className="text-lg font-bold text-black dark:text-white">रु{expenses.filter(ex => !ex.billed).reduce((sum, ex) => sum + ex.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} projects={projects} onSave={addExpense} />}
      {showAddEstimate && <AddEstimateModal onClose={() => setShowAddEstimate(false)} clients={clients} projects={projects} onSave={addEstimate} />}
    </div>
  );
};

const AddExpenseModal = ({ onClose, projects, onSave }: any) => {
  const [form, setForm] = useState({ title: '', amount: '', category: 'Software', projectId: '', status: 'PENDING' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, amount: parseFloat(form.amount || '0') }); onClose(); }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-black dark:text-white mb-6">Record New Expense</h3>
        <div className="space-y-4">
          <input required placeholder="Expense Title" className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm outline-none text-black dark:text-white" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input required type="number" placeholder="Amount (रु)" className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm outline-none text-black dark:text-white" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <select className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm outline-none text-black dark:text-white" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
            <option value="">Select Project...</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm outline-none text-black dark:text-white" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option>Software</option>
            <option>Travel</option>
            <option>Consulting</option>
            <option>Hardware</option>
            <option>Office</option>
          </select>
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
          <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100">Save Expense</button>
        </div>
      </form>
    </div>
  );
};

const AddEstimateModal = ({ onClose, clients, projects, onSave }: any) => {
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  const updateItem = (idx: number, field: string, value: any) => {
    const next = [...items];
    const item = { ...next[idx], [field]: value };
    item.amount = item.quantity * item.unitPrice;
    next[idx] = item;
    setItems(next);
  };

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h3 className="text-2xl font-bold text-black dark:text-white mb-8">Draft Professional Estimate</h3>
        <div className="space-y-6">
          <select required className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm outline-none text-black dark:text-white" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">Select Target Client...</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
          </select>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Items</label>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                <input placeholder="Item Description" className="col-span-6 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-black dark:text-white" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                <input type="number" placeholder="Qty" className="col-span-2 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-black dark:text-white" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} />
                <input type="number" placeholder="Price" className="col-span-2 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-black dark:text-white" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} />
                <div className="col-span-2 text-right font-bold text-emerald-600">रु{item.amount.toLocaleString()}</div>
              </div>
            ))}
            <button onClick={addItem} className="text-xs font-bold text-indigo-600 hover:underline">+ Add Line Item</button>
          </div>

          <div className="flex justify-end pt-6 border-t dark:border-slate-800 font-black text-2xl text-black dark:text-white">
            Total: रु{total.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Discard</button>
          <button onClick={() => { onSave({ clientId, items, total, date: new Date().toISOString(), status: 'DRAFT' }); onClose(); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100">Finalize Estimate</button>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
