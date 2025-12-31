
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole, Invoice, Project, ClientProfile } from '../types';

const SalesView: React.FC = () => {
  const { projects, invoices, clients, user, generateInvoice, payInvoice, updateInvoiceStatus } = useApp();
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});

  const getCurrencySymbol = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'रु';
    if (project.currency === 'NPR') return 'रु';
    if (project.currency === 'USD') return '$';
    if (project.currency === 'INR') return '₹';
    if (project.currency === 'EUR') return '€';
    if (project.currency === 'GBP') return '£';
    return project.currency || 'रु';
  };

  const handlePay = (invId: string) => {
    const amount = parseFloat(paymentAmounts[invId]);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount to pay.");
      return;
    }
    payInvoice(invId, amount);
    setPaymentAmounts(prev => ({ ...prev, [invId]: '' }));
  };

  const isInternal = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN;

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-black">Billing & Finance</h2>
          <p className="text-gray-500 font-medium">
            {isInternal ? "Track project revenue and manage client invoicing" : "Review your invoices and manage your payments"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Internal ONLY: Billing Trigger Section */}
          {isInternal && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gray-50/50 font-bold text-black">Project Billing Control</div>
              <div className="divide-y divide-gray-100">
                {projects.map(p => (
                  <div key={p.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-black">{p.name}</h4>
                      <p className="text-xs text-gray-500">Budget: {getCurrencySymbol(p.id)}{p.budget.toLocaleString()}</p>
                    </div>
                    <button onClick={() => generateInvoice(p.id)} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition-all border border-green-100">
                      Generate Invoice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-black">Workspace Invoices</h3>
              <ICONS.TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Paid</th>
                    <th className="px-6 py-4">Remaining</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.length > 0 ? invoices.map(inv => {
                    const project = projects.find(p => p.id === inv.projectId);
                    const symbol = getCurrencySymbol(inv.projectId);
                    const remaining = inv.amount - inv.paidAmount;
                    
                    return (
                      <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${inv.status === 'REJECTED' ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-6 py-4 font-bold text-black">{inv.id}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{project?.name || 'Project'}</td>
                        <td className="px-6 py-4 font-black text-black">{symbol}{inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">{symbol}{inv.paidAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-red-500">{symbol}{remaining.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                            inv.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {!isInternal && inv.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number"
                                  placeholder="Amt"
                                  className="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-black font-bold outline-none focus:ring-1 focus:ring-green-500"
                                  value={paymentAmounts[inv.id] || ''}
                                  onChange={e => setPaymentAmounts({ ...paymentAmounts, [inv.id]: e.target.value })}
                                />
                                <button 
                                  onClick={() => handlePay(inv.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded font-bold text-[10px] hover:bg-green-700"
                                >
                                  PAY
                                </button>
                              </div>
                            )}

                            {isInternal && inv.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => updateInvoiceStatus(inv.id, 'PAID')}
                                  title="Mark as Paid"
                                  className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                >
                                  <ICONS.Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => updateInvoiceStatus(inv.id, 'REJECTED')}
                                  title="Reject Invoice"
                                  className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                  <ICONS.Plus className="w-4 h-4 rotate-45" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 italic font-medium">No invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Pending Total</h4>
                <div className="text-3xl font-black">
                  रु{invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + (i.amount - i.paidAmount), 0).toLocaleString()}
                </div>
                <p className="text-[10px] mt-2 opacity-40">Accounts Receivable</p>
             </div>
             <div className="absolute -bottom-6 -right-6 opacity-10"><ICONS.TrendingUp className="w-32 h-32" /></div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
             <h4 className="font-bold text-black mb-4 flex items-center gap-2">
                <ICONS.CheckCircle2 className="w-4 h-4 text-green-500" /> Revenue
             </h4>
             <div className="text-2xl font-black text-black mb-1">
                रु{invoices.filter(i => i.status === 'PAID' || i.paidAmount > 0).reduce((sum, i) => sum + i.paidAmount, 0).toLocaleString()}
             </div>
             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total Collected</p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <ICONS.AlertCircle className="w-4 h-4 text-orange-500" />
              <h5 className="text-[10px] font-black text-orange-700 uppercase">Billing Note</h5>
            </div>
            <p className="text-[10px] text-orange-600 leading-relaxed font-medium">
              Clients can make partial payments. Invoices are automatically marked as PAID once the full amount is settled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
