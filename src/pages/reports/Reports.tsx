import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope, Smile, HeartPulse, Package, FileText, ClipboardList,
  TrendingUp, Activity, AlertTriangle, CheckCircle, Users, Download,
  Printer, FileSpreadsheet, Banknote, ScrollText, CalendarDays,
  Pill, Share2, RefreshCw, CalendarClock, ArrowDownToLine, ArrowUpFromLine,
  Ban, Gauge, ClipboardCheck, ArrowLeftRight, type LucideIcon,
} from 'lucide-react';
import { ExpenseCategory, RequestType } from '../../types';
import { printHtml } from '../../lib/print';
import * as R from '../../lib/reportHtml';

// ---------- CSV helpers ----------
function escapeCsv(value: string | number | undefined | null): string {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: (string | number | undefined | null)[][]): void {
  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const categoryLabels: Record<ExpenseCategory, string> = {
  medicines: 'Medicines', equipment: 'Equipment', supplies: 'Supplies', services: 'Services', other: 'Other',
};

const requestTypeLabels: Record<RequestType, string> = {
  medical: 'Medical', dental: 'Dental', medicine: 'Medicine',
};

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-400', processing: 'bg-sky-400', pending: 'bg-amber-400', rejected: 'bg-rose-400',
};

// ---------- Report card component ----------
interface ReportCardProps {
  id?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  onGenerate: () => void;
}

function ReportCard({ title, description, icon: Icon, color, bg, border, onGenerate }: ReportCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border ${border} shadow-sm flex flex-col gap-3 transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 ${bg} rounded-xl shrink-0`}><Icon size={18} className={color} /></div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 leading-snug mt-0.5">{description}</p>
        </div>
      </div>
      <button onClick={onGenerate}
        className="mt-auto flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
        <Printer size={14} /> Generate &amp; Print
      </button>
    </div>
  );
}

// ---------- Section wrapper ----------
function ReportSection({ title, icon: Icon, color, children }: { title: string; icon: LucideIcon; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={color} />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export default function Reports() {
  const { currentUser } = useAuth();
  const {
    users, healthRecords, requests, inventory, expenses, auditLogs,
    dispensingHistory, patientVisits, referrals, followUps,
    medicalSupplies, stockTransactions, purchases,
  } = useData();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'health_officer';
  const isStaff = currentUser.role === 'staff';
  const isRegularUser = ['student', 'faculty', 'employee'].includes(currentUser.role);
  const canManageReports = isAdmin || isOfficer || isStaff;

  // ---------- Shared metrics ----------
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const totalRequests = requests.length;
  const approvedRequests = requests.filter((r) => r.status === 'approved' || r.status === 'released').length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
  const lowStockCount = inventory.filter((m) => m.quantity <= m.minStock).length;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const liquidatedExpenses = expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0);

  const requestsByType = (Object.keys(requestTypeLabels) as RequestType[]).map((type) => ({
    type, label: requestTypeLabels[type], count: requests.filter((r) => r.type === type).length,
  })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  const maxRequestCount = Math.max(...requestsByType.map((r) => r.count), 1);

  const requestsByStatus = ['pending', 'processing', 'approved', 'rejected'].map((status) => ({
    status, label: status.charAt(0).toUpperCase() + status.slice(1), count: requests.filter((r) => r.status === status).length,
  }));
  const maxStatusCount = Math.max(...requestsByStatus.map((r) => r.count), 1);

  const expensesByCategory = (Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => ({
    cat, label: categoryLabels[cat], total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
  const maxExpense = Math.max(...expensesByCategory.map((e) => e.total), 1); void maxExpense;

  const bloodTypeMap: Record<string, number> = {};
  healthRecords.forEach((r) => { bloodTypeMap[r.bloodType] = (bloodTypeMap[r.bloodType] || 0) + 1; });
  const bloodTypeDist = Object.entries(bloodTypeMap).sort((a, b) => b[1] - a[1]);
  const maxBT = Math.max(...bloodTypeDist.map((b) => b[1]), 1);
  const topMedicines = [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const today = new Date();
  const ninetyDays = new Date(today); ninetyDays.setDate(today.getDate() + 90);
  void ninetyDays;

  const csvDate = today.toISOString().slice(0, 10);
  const fmtPeso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  // ---------- CSV exports ----------
  const exportUsersCsv = () => {
    downloadCsv(`users_${csvDate}.csv`, [
      ['ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Created At'],
      ...users.map((u) => [u.id, u.name, u.email, u.role, u.department ?? '', u.status, u.createdAt]),
    ]);
  };
  const exportHealthRecordsCsv = () => {
    downloadCsv(`health_records_${csvDate}.csv`, [
      ['ID', 'User Name', 'Blood Type', 'Allergies', 'Conditions', 'Medications', 'Last Checkup'],
      ...healthRecords.map((r) => [r.id, r.userName, r.bloodType, r.allergies.join('; '), r.conditions.join('; '), r.medications.join('; '), r.lastCheckup]),
    ]);
  };
  const exportRequestsCsv = () => {
    downloadCsv(`service_requests_${csvDate}.csv`, [
      ['ID', 'User Name', 'Type', 'Status', 'Submitted At'],
      ...requests.map((r) => [r.id, r.userName, r.type, r.status, r.submittedAt]),
    ]);
  };
  const exportInventoryCsv = () => {
    downloadCsv(`medicine_inventory_${csvDate}.csv`, [
      ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Expiry Date', 'Supplier'],
      ...inventory.map((m) => [m.id, m.name, m.category, m.quantity, m.unit, m.minStock, m.expiryDate, m.supplier]),
    ]);
  };
  const exportExpensesCsv = () => {
    downloadCsv(`expenses_${csvDate}.csv`, [
      ['ID', 'Description', 'Amount', 'Category', 'Date', 'Status'],
      ...expenses.map((e) => [e.id, e.description, e.amount, e.category, e.date, e.status]),
    ]);
  };
  const exportVisitsCsv = () => {
    downloadCsv(`patient_visits_${csvDate}.csv`, [
      ['ID', 'Patient', 'Service', 'Date', 'Complaint', 'Diagnosis', 'Status'],
      ...patientVisits.map((v) => [v.id, v.patientName, v.serviceType, v.visitDate, v.chiefComplaint, v.diagnosis, v.status]),
    ]);
  };
  const exportDispensingCsv = () => {
    downloadCsv(`dispensing_${csvDate}.csv`, [
      ['ID', 'Medicine', 'Patient', 'Quantity', 'Unit', 'Date'],
      ...dispensingHistory.map((d) => [d.id, d.medicineName, d.patientName, d.quantity, d.unit, d.dispensedAt]),
    ]);
  };
  const exportAuditLogsCsv = () => {
    downloadCsv(`audit_logs_${csvDate}.csv`, [
      ['ID', 'User Name', 'Action', 'Module', 'Timestamp'],
      ...auditLogs.map((l) => [l.id, l.userName, l.action, l.module, l.timestamp]),
    ]);
  };

  // ---------- Report generators ----------
  const pb = currentUser.name;
  const gen = (fn: () => string) => () => printHtml(fn());

  // My health data for regular users
  const myRecord = healthRecords.find((r) => r.userId === currentUser.id) ?? null;
  const myVisits = patientVisits.filter((v) => v.patientId === currentUser.id);
  const myReferrals = referrals.filter((r) => r.patientId === currentUser.id);
  const myFollowUps = followUps.filter((f) => f.patientId === currentUser.id);
  const myDispensing = dispensingHistory.filter((d) => d.patientId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Reports &amp; Notifications</h2>
            <p className="text-teal-100 text-sm mt-1">
              {isAdmin ? 'Generate administrative, medical, dental, physical exam, and inventory reports' :
               isOfficer ? 'Generate medical, dental, physical exam, and inventory reports' :
               isStaff ? 'Generate authorized reports and view statistics' :
               'View your health reports and permitted documents'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl">
            <FileText size={16} />
            <span className="text-sm font-medium">{canManageReports ? 'Report Center' : 'My Reports'}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: activeUsers, sub: `of ${users.length} total`, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Health Records', value: healthRecords.filter((r) => !r.archived).length, sub: `of ${healthRecords.length} total`, icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Approval Rate', value: `${approvalRate}%`, sub: `${approvedRequests} approved`, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Low Stock Items', value: lowStockCount, sub: `of ${inventory.length} items`, icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <div className={`p-2.5 ${bg} rounded-xl`}><Icon size={18} className={color} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* ============ ADMIN: Full report suite ============ */}
      {isAdmin && (
        <>
          {/* CSV Export */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileSpreadsheet size={18} className="text-emerald-500" />
              <div>
                <h3 className="font-semibold text-slate-800">Export Data as CSV</h3>
                <p className="text-xs text-slate-400">Download spreadsheet files for record-keeping or external analysis</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Users', sub: `${users.length} records`, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', action: exportUsersCsv },
                { label: 'Health Records', sub: `${healthRecords.length} records`, icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50', action: exportHealthRecordsCsv },
                { label: 'Service Requests', sub: `${requests.length} records`, icon: ClipboardList, color: 'text-sky-600', bg: 'bg-sky-50', action: exportRequestsCsv },
                { label: 'Patient Visits', sub: `${patientVisits.length} records`, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50', action: exportVisitsCsv },
                { label: 'Medicine Inventory', sub: `${inventory.length} records`, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', action: exportInventoryCsv },
                { label: 'Dispensing', sub: `${dispensingHistory.length} records`, icon: Pill, color: 'text-teal-600', bg: 'bg-teal-50', action: exportDispensingCsv },
                { label: 'Expenses', sub: `${expenses.length} records`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', action: exportExpensesCsv },
                { label: 'Audit Logs', sub: `${auditLogs.length} records`, icon: ScrollText, color: 'text-slate-600', bg: 'bg-slate-100', action: exportAuditLogsCsv },
              ].map(({ label, sub, icon: Icon, color, bg, action }) => (
                <button key={label} onClick={action}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white transition-all hover:shadow-md text-left group">
                  <div className={`p-2.5 ${bg} rounded-lg shrink-0`}><Icon size={18} className={color} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                  <Download size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Medical Reports */}
          <ReportSection title="Medical Reports" icon={Stethoscope} color="text-teal-500">
            <ReportCard id="6.1" title="Medical Consultation Report" description="Breakdown of consultation requests by type, status, and user role" icon={Stethoscope} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicalConsultationReport({ requests, users, preparedBy: pb }))} />
            <ReportCard id="6.2" title="Daily Treatment Report" description="Today's medical treatment visits and patient summary" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.dailyTreatmentReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.3" title="Medical History Report" description="All patient medical histories with allergies, conditions, and medications" icon={FileText} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.medicalHistoryReport({ records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.4" title="Patient Visit Report" description="All patient visits across all service types" icon={ClipboardList} color="text-violet-600" bg="bg-violet-50" border="border-violet-100" onGenerate={gen(() => R.patientVisitReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.5" title="First Aid Report" description="Records of first aid treatments administered" icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.firstAidReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.6" title="Medicine Issuance Report" description="All medicine dispensing records with quantities and reasons" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicineIssuanceReport({ dispensing: dispensingHistory, preparedBy: pb }))} />
            <ReportCard id="6.7" title="Referral Report" description="All patient referrals to external facilities" icon={Share2} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.referralReport({ referrals, preparedBy: pb }))} />
            <ReportCard id="6.8" title="Follow-up Report" description="All patient follow-up schedules and outcomes" icon={RefreshCw} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.followUpReport({ followUps, preparedBy: pb }))} />
          </ReportSection>

          {/* Dental Reports */}
          <ReportSection title="Dental Reports" icon={Smile} color="text-amber-500">
            <ReportCard id="6.9" title="Dental Examination Report" description="All dental examination visits and findings" icon={Smile} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.dentalExaminationReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.10" title="Dental Treatment Report" description="Dental treatments provided with medicine details" icon={Activity} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.dentalTreatmentReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.11" title="Dental Procedure Report" description="Detailed dental procedures with assessments and remarks" icon={ClipboardCheck} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.dentalProcedureReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.12" title="Dental Summary" description="Overview of dental status across all patient records" icon={FileText} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.dentalSummaryReport({ visits: patientVisits, records: healthRecords, preparedBy: pb }))} />
          </ReportSection>

          {/* Physical Examination Reports */}
          <ReportSection title="Physical Examination Reports" icon={HeartPulse} color="text-rose-500">
            <ReportCard id="6.13" title="Physical Examination Report" description="All physical examination visits and assessments" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.physicalExamReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.14" title="Vital Signs Report" description="All recorded vital signs (BP, temp, HR, O2 sat, etc.)" icon={Gauge} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.vitalSignsReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.15" title="Medical Screening Report" description="Screening results with blood type, BMI, vision, and dental status" icon={ClipboardCheck} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicalScreeningReport({ records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.16" title="Fitness Assessment Report" description="BMI-based fitness assessments for all patients" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.fitnessAssessmentReport({ records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.17" title="Further Evaluation Report" description="Patients requiring further evaluation via referrals or follow-ups" icon={Share2} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.furtherEvaluationReport({ referrals, followUps, preparedBy: pb }))} />
          </ReportSection>

          {/* Inventory Reports */}
          <ReportSection title="Inventory Reports" icon={Package} color="text-sky-500">
            <ReportCard id="6.18" title="Current Inventory Report" description="Full listing of all medicines and supplies with stock levels" icon={Package} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.currentInventoryReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.19" title="Stock-In Report" description="All stock-in transactions with quantities and reasons" icon={ArrowDownToLine} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.stockInReport({ transactions: stockTransactions, preparedBy: pb }))} />
            <ReportCard id="6.20" title="Stock-Out Report" description="All stock-out, issuance, disposal, and damage transactions" icon={ArrowUpFromLine} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.stockOutReport({ transactions: stockTransactions, preparedBy: pb }))} />
            <ReportCard id="6.21" title="Stock Movement Report" description="Complete stock movement log across all transaction types" icon={ArrowLeftRight} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.stockMovementReport({ transactions: stockTransactions, preparedBy: pb }))} />
            <ReportCard id="6.22" title="Low-Stock Report" description="Items at or below minimum stock requiring restocking" icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.lowStockReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.23" title="Near-Expiry Report" description="Items expiring within 90 days" icon={CalendarClock} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.nearExpiryReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.24" title="Expired Medicine Report" description="All expired medicines and supplies needing disposal" icon={Ban} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.expiredMedicineReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.25" title="Medicine Consumption Report" description="Ranking of most dispensed medicines by quantity" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicineConsumptionReport({ dispensing: dispensingHistory, inventory, preparedBy: pb }))} />
          </ReportSection>

          {/* Administrative Reports */}
          <ReportSection title="Administrative Reports" icon={FileText} color="text-slate-500">
            <ReportCard id="6.26" title="Daily Summary" description="Today's activity across requests, visits, and dispensing" icon={CalendarDays} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.dailySummaryReport({ requests, visits: patientVisits, dispensing: dispensingHistory, preparedBy: pb }))} />
            <ReportCard id="6.27" title="Monthly Summary" description="Current month's activity and expense summary" icon={CalendarDays} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.monthlySummaryReport({ requests, visits: patientVisits, dispensing: dispensingHistory, expenses, preparedBy: pb }))} />
            <ReportCard id="6.28" title="Annual Summary" description="Full year summary of all activities and finances" icon={CalendarDays} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.annualSummaryReport({ requests, visits: patientVisits, dispensing: dispensingHistory, expenses, referrals, preparedBy: pb }))} />
            <ReportCard id="6.29" title="Patient Statistics" description="User demographics and blood type distribution" icon={Users} color="text-violet-600" bg="bg-violet-50" border="border-violet-100" onGenerate={gen(() => R.patientStatisticsReport({ users, records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.30" title="Treatment Statistics" description="Treatment breakdown by service type and status" icon={TrendingUp} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.treatmentStatisticsReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.31" title="Dental Statistics" description="Dental visit breakdown and status analysis" icon={Smile} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.dentalStatisticsReport({ visits: patientVisits, records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.32" title="Physical Exam Statistics" description="Physical examination visit analysis" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.physicalExamStatisticsReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.33" title="Inventory Statistics" description="Inventory distribution and transaction analysis" icon={Package} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.inventoryStatisticsReport({ inventory, supplies: medicalSupplies, transactions: stockTransactions, preparedBy: pb }))} />
          </ReportSection>

          {/* Print Records */}
          <ReportSection title="Print Records" icon={Printer} color="text-slate-500">
            <ReportCard id="6.34" title="Print Student/Employee Health Record" description="Print individual patient health records" icon={FileText} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.printHealthRecord({ record: healthRecords[0] ?? { id: '', userId: '', userName: 'No records', bloodType: '—', allergies: [], conditions: [], medications: [], height: '', weight: '', lastCheckup: '', notes: '', createdAt: '', updatedAt: '' }, dispensing: dispensingHistory, preparedBy: pb }))} />
            <ReportCard id="6.35" title="Print Medical Treatment Record" description="Print all medical treatment records" icon={Stethoscope} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.printTreatmentRecord({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.36" title="Print Dental Examination & Treatment" description="Print all dental examination and treatment records" icon={Smile} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.printDentalRecord({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.37" title="Print Physical Examination Record" description="Print all physical examination records" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.printPhysicalExamRecord({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.38" title="Print Referral & Follow-up Record" description="Print all referral and follow-up records" icon={Share2} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.printReferralFollowUpRecord({ referrals, followUps, preparedBy: pb }))} />
            <ReportCard id="6.39" title="Print Medicine Issuance Record" description="Print all medicine dispensing records" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.printMedicineIssuanceRecord({ dispensing: dispensingHistory, preparedBy: pb }))} />
            <ReportCard id="6.40" title="Print Inventory & Purchase Report" description="Print complete inventory and purchase records" icon={Package} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.printInventoryPurchaseReport({ inventory, supplies: medicalSupplies, purchases, preparedBy: pb }))} />
            <ReportCard id="6.41" title="Print Health & Dispensary Summary" description="Print comprehensive health and dispensary summary" icon={FileText} color="text-violet-600" bg="bg-violet-50" border="border-violet-100" onGenerate={gen(() => R.printHealthDispensarySummary({ records: healthRecords, visits: patientVisits, dispensing: dispensingHistory, inventory, expenses, preparedBy: pb }))} />
          </ReportSection>
        </>
      )}

      {/* ============ HEALTH OFFICER: Medical, Dental, Physical, Inventory reports ============ */}
      {isOfficer && (
        <>
          <ReportSection title="Medical Reports" icon={Stethoscope} color="text-teal-500">
            <ReportCard id="6.1" title="Medical Consultation Report" description="Breakdown of consultation requests by type, status, and user role" icon={Stethoscope} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicalConsultationReport({ requests, users, preparedBy: pb }))} />
            <ReportCard id="6.2" title="Daily Treatment Report" description="Today's medical treatment visits and patient summary" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.dailyTreatmentReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.3" title="Medical History Report" description="All patient medical histories with allergies and conditions" icon={FileText} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.medicalHistoryReport({ records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.4" title="Patient Visit Report" description="All patient visits across all service types" icon={ClipboardList} color="text-violet-600" bg="bg-violet-50" border="border-violet-100" onGenerate={gen(() => R.patientVisitReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.5" title="First Aid Report" description="Records of first aid treatments administered" icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.firstAidReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.6" title="Medicine Issuance Report" description="All medicine dispensing records" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicineIssuanceReport({ dispensing: dispensingHistory, preparedBy: pb }))} />
            <ReportCard id="6.7" title="Referral Report" description="All patient referrals to external facilities" icon={Share2} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.referralReport({ referrals, preparedBy: pb }))} />
            <ReportCard id="6.8" title="Follow-up Report" description="All patient follow-up schedules and outcomes" icon={RefreshCw} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.followUpReport({ followUps, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Dental Reports" icon={Smile} color="text-amber-500">
            <ReportCard id="6.9" title="Dental Examination Report" description="All dental examination visits and findings" icon={Smile} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.dentalExaminationReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.10" title="Dental Treatment Report" description="Dental treatments provided with medicine details" icon={Activity} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.dentalTreatmentReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.11" title="Dental Procedure Report" description="Detailed dental procedures with assessments" icon={ClipboardCheck} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.dentalProcedureReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.12" title="Dental Summary" description="Overview of dental status across all records" icon={FileText} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.dentalSummaryReport({ visits: patientVisits, records: healthRecords, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Physical Examination Reports" icon={HeartPulse} color="text-rose-500">
            <ReportCard id="6.13" title="Physical Examination Report" description="All physical examination visits and assessments" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.physicalExamReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.14" title="Vital Signs Report" description="All recorded vital signs (BP, temp, HR, O2 sat)" icon={Gauge} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.vitalSignsReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.15" title="Medical Screening Report" description="Screening results with blood type, BMI, vision" icon={ClipboardCheck} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicalScreeningReport({ records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.16" title="Fitness Assessment Report" description="BMI-based fitness assessments" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.fitnessAssessmentReport({ records: healthRecords, preparedBy: pb }))} />
            <ReportCard id="6.17" title="Further Evaluation Report" description="Patients requiring further evaluation" icon={Share2} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.furtherEvaluationReport({ referrals, followUps, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Inventory Reports" icon={Package} color="text-sky-500">
            <ReportCard id="6.18" title="Current Inventory Report" description="Full listing of all medicines and supplies" icon={Package} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.currentInventoryReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.22" title="Low-Stock Report" description="Items at or below minimum stock" icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.lowStockReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.23" title="Near-Expiry Report" description="Items expiring within 90 days" icon={CalendarClock} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.nearExpiryReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.24" title="Expired Medicine Report" description="All expired medicines and supplies" icon={Ban} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.expiredMedicineReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard id="6.25" title="Medicine Consumption Report" description="Most dispensed medicines by quantity" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicineConsumptionReport({ dispensing: dispensingHistory, inventory, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Print Records" icon={Printer} color="text-slate-500">
            <ReportCard id="6.35" title="Print Medical Treatment Record" description="Print all medical treatment records" icon={Stethoscope} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.printTreatmentRecord({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.36" title="Print Dental Examination & Treatment" description="Print all dental records" icon={Smile} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.printDentalRecord({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.37" title="Print Physical Examination Record" description="Print all physical exam records" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.printPhysicalExamRecord({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard id="6.39" title="Print Medicine Issuance Record" description="Print all dispensing records" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.printMedicineIssuanceRecord({ dispensing: dispensingHistory, preparedBy: pb }))} />
          </ReportSection>
        </>
      )}

      {/* ============ STAFF: Authorized reports ============ */}
      {isStaff && (
        <>
          <ReportSection title="Authorized Medical Reports" icon={Stethoscope} color="text-teal-500">
            <ReportCard id="6.45" title="Medical Consultation Report" description="Breakdown of consultation requests" icon={Stethoscope} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicalConsultationReport({ requests, users, preparedBy: pb }))} />
            <ReportCard title="Daily Treatment Report" description="Today's medical treatment visits" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.dailyTreatmentReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard title="Medicine Issuance Report" description="All medicine dispensing records" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.medicineIssuanceReport({ dispensing: dispensingHistory, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Authorized Dental Reports" icon={Smile} color="text-amber-500">
            <ReportCard id="6.46" title="Dental Examination Report" description="All dental examination visits" icon={Smile} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.dentalExaminationReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard title="Dental Treatment Report" description="Dental treatments provided" icon={Activity} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.dentalTreatmentReport({ visits: patientVisits, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Authorized Physical Exam Reports" icon={HeartPulse} color="text-rose-500">
            <ReportCard id="6.47" title="Physical Examination Report" description="All physical examination visits" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" onGenerate={gen(() => R.physicalExamReport({ visits: patientVisits, preparedBy: pb }))} />
            <ReportCard title="Vital Signs Report" description="All recorded vital signs" icon={Gauge} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.vitalSignsReport({ visits: patientVisits, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Authorized Inventory Reports" icon={Package} color="text-sky-500">
            <ReportCard id="6.48" title="Current Inventory Report" description="Full listing of medicines and supplies" icon={Package} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.currentInventoryReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
            <ReportCard title="Stock Movement Report" description="Complete stock movement log" icon={ArrowLeftRight} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.stockMovementReport({ transactions: stockTransactions, preparedBy: pb }))} />
            <ReportCard title="Low-Stock Report" description="Items at or below minimum stock" icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" onGenerate={gen(() => R.lowStockReport({ inventory, supplies: medicalSupplies, preparedBy: pb }))} />
          </ReportSection>

          <ReportSection title="Print Authorized Records" icon={Printer} color="text-slate-500">
            <ReportCard id="6.49" title="Print Medicine Issuance Record" description="Print all dispensing records" icon={Pill} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.printMedicineIssuanceRecord({ dispensing: dispensingHistory, preparedBy: pb }))} />
            <ReportCard title="Print Inventory & Purchase Report" description="Print inventory and purchase records" icon={Package} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.printInventoryPurchaseReport({ inventory, supplies: medicalSupplies, purchases, preparedBy: pb }))} />
          </ReportSection>
        </>
      )}

      {/* ============ REGULAR USERS: Own health reports ============ */}
      {isRegularUser && (
        <>
          <ReportSection title="My Health Reports" icon={FileText} color="text-teal-500">
            <ReportCard id="6.73" title="My Health Report" description="View your complete health record, treatment history, referrals, follow-ups, and dispensing" icon={FileText} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" onGenerate={gen(() => R.myHealthReport({ record: myRecord, visits: myVisits, referrals: myReferrals, followUps: myFollowUps, dispensing: myDispensing, preparedBy: pb }))} />
            <ReportCard id="6.74" title="My Treatment Information" description="View your treatment and visit history" icon={Stethoscope} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" onGenerate={gen(() => R.patientVisitReport({ visits: myVisits, preparedBy: pb }))} />
            <ReportCard id="6.75" title="My Referrals & Follow-ups" description="View your referral and follow-up records" icon={Share2} color="text-sky-600" bg="bg-sky-50" border="border-sky-100" onGenerate={gen(() => R.printReferralFollowUpRecord({ referrals: myReferrals, followUps: myFollowUps, preparedBy: pb }))} />
          </ReportSection>

          {/* My health summary card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <HeartPulse size={18} className="text-teal-500" />
              <h3 className="font-semibold text-slate-800">My Health Summary</h3>
            </div>
            {myRecord ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-100">
                  <p className="text-xs text-rose-400 font-medium">Blood Type</p>
                  <p className="text-xl font-bold text-rose-700 mt-1">{myRecord.bloodType}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Last Checkup</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{myRecord.lastCheckup}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                  <p className="text-xs text-amber-400 font-medium">Allergies</p>
                  <p className="text-sm font-bold text-amber-700 mt-1">{myRecord.allergies.length > 0 ? `${myRecord.allergies.length} known` : 'None'}</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-100">
                  <p className="text-xs text-teal-400 font-medium">My Visits</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">{myVisits.length}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No health record on file.</p>
                <p className="text-slate-400 text-xs mt-1">Visit the clinic to create your health record.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ Shared analytics charts ============ */}
      {canManageReports && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList size={16} className="text-teal-500" />
                <h3 className="font-semibold text-slate-800">Requests by Type</h3>
              </div>
              {requestsByType.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No request data.</p>
              ) : (
                <div className="space-y-3">
                  {requestsByType.map(({ type, label, count }) => (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className="font-bold text-slate-800">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-teal-400 h-2 rounded-full transition-all" style={{ width: `${(count / maxRequestCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity size={16} className="text-sky-500" />
                <h3 className="font-semibold text-slate-800">Requests by Status</h3>
              </div>
              <div className="space-y-3">
                {requestsByStatus.map(({ status, label, count }) => (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 font-medium">{label}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${statusColors[status]} h-2 rounded-full transition-all`} style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blood type & top medicines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText size={16} className="text-rose-500" />
                <h3 className="font-semibold text-slate-800">Blood Type Distribution</h3>
              </div>
              {bloodTypeDist.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No health record data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {bloodTypeDist.map(([bt, count]) => (
                    <div key={bt} className="text-center">
                      <div className="relative mx-auto mb-2" style={{ width: 56, height: 56 }}>
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f43f5e" strokeWidth="4"
                            strokeDasharray={`${(count / maxBT) * 100} 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">{count}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">{bt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package size={16} className="text-teal-500" />
                <h3 className="font-semibold text-slate-800">Top Medicine Stock</h3>
              </div>
              <div className="space-y-3">
                {topMedicines.map((m) => {
                  const isLow = m.quantity <= m.minStock;
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`shrink-0 p-1.5 rounded-lg ${isLow ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        {isLow ? <AlertTriangle size={12} className="text-rose-500" /> : <CheckCircle size={12} className="text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs font-medium text-slate-700 truncate">{m.name}</span>
                          <span className={`text-xs font-bold ${isLow ? 'text-rose-500' : 'text-slate-700'}`}>{m.quantity}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`${isLow ? 'bg-rose-400' : 'bg-emerald-400'} h-1.5 rounded-full`}
                            style={{ width: `${Math.min((m.quantity / (m.minStock * 5)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ Admin-only financial overview ============ */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-teal-500" />
            <h3 className="font-semibold text-slate-800">Financial Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Total Budget Used</p>
              <p className="text-2xl font-bold text-slate-800">{fmtPeso(totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Liquidated</p>
              <p className="text-2xl font-bold text-emerald-600">{fmtPeso(liquidatedExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Pending Liquidation</p>
              <p className="text-2xl font-bold text-amber-600">{fmtPeso(totalExpenses - liquidatedExpenses)}</p>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Liquidation Progress</span>
              <span>{totalExpenses > 0 ? Math.round((liquidatedExpenses / totalExpenses) * 100) : 0}% complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-teal-400 to-teal-500 h-3 rounded-full transition-all shadow-sm shadow-teal-200"
                style={{ width: `${totalExpenses > 0 ? (liquidatedExpenses / totalExpenses) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
