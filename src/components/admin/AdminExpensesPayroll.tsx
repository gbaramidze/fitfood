'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { AdminExpense, AdminSalary, ExpenseCategory, EmployeeRole } from '@/types/admin';

export const AdminExpensesPayroll: React.FC = () => {
  const { 
    expenses, 
    salaries, 
    totalExpenses,
    totalPayroll,
    addExpense, 
    deleteExpense, 
    addSalaryRecord, 
    updateSalaryRecord, 
    markSalaryPaid, 
    deleteSalaryRecord 
  } = useAdmin();

  const [subTab, setSubTab] = useState<'expenses' | 'salaries'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('rent');
  const [expAmount, setExpAmount] = useState<number>(500);
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expPaymentMethod, setExpPaymentMethod] = useState<'bank' | 'cash' | 'card'>('bank');
  const [expNotes, setExpNotes] = useState('');

  // Salary form
  const [salName, setSalName] = useState('');
  const [salRole, setSalRole] = useState<EmployeeRole>('cook');
  const [salPhone, setSalPhone] = useState('+995 5');
  const [salMonthly, setSalMonthly] = useState<number>(1800);
  const [salShifts, setSalShifts] = useState<number>(24);
  const [salBonus, setSalBonus] = useState<number>(0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;

    addExpense({
      title: expTitle,
      category: expCategory,
      amount: Number(expAmount),
      date: expDate,
      pointId: 'hq',
      paymentMethod: expPaymentMethod,
      notes: expNotes,
    });

    setIsExpenseModalOpen(false);
    setExpTitle('');
  };

  const handleCreateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salName.trim()) return;

    addSalaryRecord({
      employeeName: salName,
      role: salRole,
      phone: salPhone,
      monthlySalary: Number(salMonthly),
      shiftsCount: Number(salShifts),
      bonus: Number(salBonus),
      deductions: 0,
      paymentStatus: 'pending',
    });

    setIsSalaryModalOpen(false);
    setSalName('');
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">ხარჯები & ხელფასები (OpEx / ფოტი)</h1>
          <p className="admin-page-subtitle">
            საოპერაციო ხარჯები (იჯარა, კომუნალურები, შეფუთვა, რეკლამა) და პერსონალის ხელფასები
          </p>
        </div>
        <div className="admin-hero-actions">
          <button onClick={() => setIsExpenseModalOpen(true)} className="admin-btn-primary">
            + ხარჯის დამატება
          </button>
          <button onClick={() => setIsSalaryModalOpen(true)} className="admin-btn-secondary">
            + თანამშრომლის დამატება
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">საოპერაციო ხარჯები (OpEx)</span>
            <span className="kpi-icon">📉</span>
          </div>
          <div className="kpi-value text-warning">{totalExpenses.toLocaleString()} ₾</div>
          <div className="kpi-footer-note">{expenses.length} გადახდა</div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">შრომის ანაზღაურება (ფოტი)</span>
            <span className="kpi-icon">👥</span>
          </div>
          <div className="kpi-value text-success">{totalPayroll.toLocaleString()} ₾</div>
          <div className="kpi-footer-note">{salaries.length} თანამშრომელი</div>
        </div>
      </div>

      {/* Subtab Toggle */}
      <div className="admin-subtabs-nav">
        <button
          onClick={() => setSubTab('expenses')}
          className={`admin-subtab-btn ${subTab === 'expenses' ? 'active' : ''}`}
        >
          💸 საოპერაციო ხარჯები ({expenses.length})
        </button>
        <button
          onClick={() => setSubTab('salaries')}
          className={`admin-subtab-btn ${subTab === 'salaries' ? 'active' : ''}`}
        >
          👥 ხელფასების უწყისი ({salaries.length})
        </button>
      </div>

      {/* Expenses Table */}
      {subTab === 'expenses' && (
        <div className="admin-card">
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>ხარჯის დასახელება</th>
                  <th>კატეგორია</th>
                  <th>თანხა (GEL)</th>
                  <th>თარიღი</th>
                  <th>გადახდის მეთოდი</th>
                  <th>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>💸</div>
                      <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '2px' }}>ხარჯები არ არის დაფიქსირებული</div>
                      <div style={{ fontSize: '12px' }}>დააჭირეთ «+ ხარჯის დამატება»-ს საოპერაციო ხარჯის შესაყვანად.</div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <b>{exp.title}</b>
                        {exp.notes && <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>{exp.notes}</div>}
                      </td>
                      <td>
                        <span className="table-badge badge-blue">
                          {exp.category === 'rent' ? 'იჯარა' :
                           exp.category === 'utilities' ? 'კომუნალური' :
                           exp.category === 'packaging' ? 'შეფუთვა' :
                           exp.category === 'marketing' ? 'რეკლამა' :
                           exp.category === 'logistics' ? 'საწვავი/ტრანსპორტი' : 'სხვა'}
                        </span>
                      </td>
                      <td><b className="text-warning">-{exp.amount.toLocaleString()} ₾</b></td>
                      <td>{exp.date}</td>
                      <td>
                        {exp.paymentMethod === 'bank' ? 'საბანკო გადარიცხვა' : exp.paymentMethod === 'card' ? 'ბარათი' : 'ნაღდი'}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            if (confirm(`წაიშალოს ხარჯი «${exp.title}»?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="btn-dish-delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaries Table */}
      {subTab === 'salaries' && (
        <div className="admin-card">
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>თანამშრომელი / პოზიცია</th>
                  <th>ტელეფონი</th>
                  <th>განაკვეთი (GEL)</th>
                  <th>ცვლა</th>
                  <th>ბონუსი</th>
                  <th>გასაცემი თანხა</th>
                  <th>სტატუსი</th>
                  <th>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#9CA3AF' }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>👥</div>
                      <div style={{ color: '#F9FAFB', fontWeight: 700, marginBottom: '2px' }}>ხელფასების უწყისი ცარიელია</div>
                      <div style={{ fontSize: '12px' }}>დააჭირეთ «+ თანამშრომლის დამატება»-ს შტატის შესავსებად.</div>
                    </td>
                  </tr>
                ) : (
                  salaries.map((sal) => {
                    const isPaid = sal.paymentStatus === 'paid';

                    return (
                      <tr key={sal.id}>
                      <td>
                        <b>{sal.employeeName}</b>
                        <div style={{ fontSize: '11px', color: '#10B981' }}>
                          {sal.role === 'chef' ? 'მთავარი შეფი' :
                           sal.role === 'cook' ? 'მზარეული' :
                           sal.role === 'packer' ? 'დამფასოებელი' :
                           sal.role === 'courier' ? 'კურიერი' : 'დიეტოლოგი'}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#94A3B8' }}>{sal.phone}</td>
                      <td><b>{sal.monthlySalary.toLocaleString()} ₾</b></td>
                      <td>{sal.shiftsCount || '24'} ცვლა</td>
                      <td>+{sal.bonus || 0} ₾</td>
                      <td><b className="text-success" style={{ fontSize: '14px' }}>{sal.totalToPay.toLocaleString()} ₾</b></td>
                      <td>
                        <span className={`table-badge ${isPaid ? 'badge-green' : 'badge-orange'}`}>
                          {isPaid ? `✓ გაცემულია (${sal.lastPaidDate || '30.09'})` : '⏳ მოლოდინში'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                if (confirm(`დადასტურდეს ხელფასის გაცემა ${sal.totalToPay} ₾ თანამშრომელზე: ${sal.employeeName}?`)) {
                                  markSalaryPaid(sal.id);
                                }
                              }}
                              className="admin-mini-btn btn-success"
                            >
                              💸 გაცემა
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`წაიშალოს თანამშრომელი «${sal.employeeName}»?`)) {
                                deleteSalaryRecord(sal.id);
                              }
                            }}
                            className="btn-dish-delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Expense */}
      {isExpenseModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="admin-modal-header">
              <h2>ხარჯის დაფიქსირება</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleCreateExpense} className="admin-modal-form">
              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">ხარჯის დასახელება *</label>
                  <input
                    type="text"
                    required
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="მაგ: კონტეინერების შეძენა (5000 ცალი)"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">კატეგორია</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="admin-select-input"
                  >
                    <option value="rent">იჯარა</option>
                    <option value="utilities">კომუნალური (დენი/გაზი)</option>
                    <option value="packaging">შეფუთვა და კონტეინერები</option>
                    <option value="marketing">რეკლამა & მარკეტინგი</option>
                    <option value="logistics">საწვავი & ტრანსპორტი</option>
                    <option value="ingredients">პროდუქტების შესყიდვა</option>
                    <option value="other">სხვა ხარჯი</option>
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">თანხა (GEL ₾) *</label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">თარიღი</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">გადახდის მეთოდი</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                    className="admin-select-input"
                  >
                    <option value="bank">საბანკო გადარიცხვა (ბ/ნ)</option>
                    <option value="card">კორპორატიული ბარათი</option>
                    <option value="cash">ნაღდი ფული</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="admin-btn-secondary">
                  გაუქმება
                </button>
                <button type="submit" className="admin-btn-primary">
                  💾 შენახვა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Salary */}
      {isSalaryModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div className="admin-modal-header">
              <h2>თანამშრომლის დამატება</h2>
              <button onClick={() => setIsSalaryModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleCreateSalary} className="admin-modal-form">
              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">სახელი და გვარი *</label>
                  <input
                    type="text"
                    required
                    value={salName}
                    onChange={(e) => setSalName(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">პოზიცია</label>
                  <select
                    value={salRole}
                    onChange={(e) => setSalRole(e.target.value as EmployeeRole)}
                    className="admin-select-input"
                  >
                    <option value="chef">მთავარი შეფი</option>
                    <option value="cook">ცხელი საამქროს მზარეული</option>
                    <option value="packer">დამფასოებელი</option>
                    <option value="courier">კურიერი</option>
                    <option value="nutritionist">დიეტოლოგი</option>
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">ტელეფონი</label>
                  <input
                    type="text"
                    value={salPhone}
                    onChange={(e) => setSalPhone(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">თვიური ხელფასი (GEL ₾) *</label>
                  <input
                    type="number"
                    required
                    value={salMonthly}
                    onChange={(e) => setSalMonthly(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">ცვლების რაოდენობა</label>
                  <input
                    type="number"
                    value={salShifts}
                    onChange={(e) => setSalShifts(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="admin-btn-secondary">
                  გაუქმება
                </button>
                <button type="submit" className="admin-btn-primary">
                  ✨ დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
