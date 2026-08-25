import type {
  User, HealthRecord, Request, Medicine, Expense,
  MedicineDispensing, PatientVisit, Referral, FollowUp,
  MedicalSupply, StockTransaction, Purchase,
} from '../types';

const SCHOOL = 'Saint Francis College Guihulngan, Negros Oriental, Incorporated';
const SCHOOL_ADDR = 'Bateria, Guihulngan City, Negros Oriental';

function escapeHtml(s: string | undefined | null): string {
  return (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

function fmtDate(d = new Date()): string {
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtTime(d = new Date()): string {
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function fmtPeso(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface ReportMeta {
  title: string;
  subtitle?: string;
  preparedBy: string;
  docIdPrefix: string;
}

function shell(meta: ReportMeta, bodyContent: string): string {
  const reportDate = fmtDate();
  const reportTime = fmtTime();
  const docId = `${meta.docIdPrefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${escapeHtml(meta.title)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color:#1e293b; line-height:1.6; font-size:11pt; }
  .header { text-align:center; border-bottom:3px double #0d9488; padding-bottom:14px; margin-bottom:18px; }
  .header h1 { font-size:17pt; color:#0f172a; letter-spacing:0.5px; }
  .header h2 { font-size:12pt; color:#0d9488; margin-top:4px; font-weight:600; }
  .header .school { font-size:9pt; color:#64748b; margin-top:6px; }
  .doc-info { display:flex; justify-content:space-between; font-size:9pt; color:#475569; margin-bottom:18px; padding:8px 12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; }
  .section { margin-bottom:20px; page-break-inside:avoid; }
  .section-title { font-size:11pt; font-weight:700; color:#0f172a; border-left:4px solid #0d9488; padding-left:10px; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px; }
  table { width:100%; border-collapse:collapse; font-size:10pt; }
  th { background:#0d9488; color:#fff; padding:7px 10px; text-align:left; font-weight:600; font-size:9pt; text-transform:uppercase; letter-spacing:0.3px; }
  td { padding:6px 10px; border-bottom:1px solid #e2e8f0; }
  tr:nth-child(even) td { background:#f8fafc; }
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:8px; }
  .summary-card { border:1px solid #e2e8f0; border-radius:6px; padding:12px; text-align:center; }
  .summary-card .label { font-size:8pt; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
  .summary-card .value { font-size:18pt; font-weight:700; color:#0f172a; margin-top:4px; }
  .summary-card.teal { border-top:3px solid #0d9488; }
  .summary-card.sky { border-top:3px solid #0ea5e9; }
  .summary-card.emerald { border-top:3px solid #059669; }
  .summary-card.rose { border-top:3px solid #e11d48; }
  .summary-card.amber { border-top:3px solid #d97706; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .empty { text-align:center; color:#94a3b8; padding:20px; font-style:italic; }
  .signature-block { margin-top:40px; display:flex; justify-content:space-between; page-break-inside:avoid; }
  .sig-line { width:240px; text-align:center; }
  .sig-line .line { border-top:1px solid #1e293b; margin-bottom:4px; margin-top:50px; }
  .sig-line .name { font-weight:600; font-size:10pt; }
  .sig-line .title { font-size:9pt; color:#64748b; }
  .footer { margin-top:28px; padding-top:12px; border-top:1px solid #cbd5e1; font-size:8pt; color:#94a3b8; text-align:center; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:8pt; font-weight:600; }
  .bar-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .bar-label { width:120px; font-size:9pt; color:#475569; }
  .bar-track { flex:1; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden; }
  .bar-fill { height:100%; background:#0d9488; border-radius:4px; }
  .bar-val { width:30px; text-align:right; font-size:9pt; font-weight:700; color:#1e293b; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
  <div class="header">
    <h1>HEALTH SYS SFCG</h1>
    <h2>${escapeHtml(meta.title)}</h2>
    ${meta.subtitle ? `<p class="school">${escapeHtml(meta.subtitle)}</p>` : ''}
    <div class="school">${SCHOOL}<br/>${SCHOOL_ADDR}</div>
  </div>
  <div class="doc-info">
    <span><strong>Report Date:</strong> ${reportDate} at ${reportTime}</span>
    <span><strong>Prepared By:</strong> ${escapeHtml(meta.preparedBy)}</span>
    <span><strong>Document ID:</strong> ${docId}</span>
  </div>
  ${bodyContent}
  <div class="signature-block">
    <div class="sig-line"><div class="line"></div><div class="name">${escapeHtml(meta.preparedBy)}</div><div class="title">Prepared By</div></div>
    <div class="sig-line"><div class="line"></div><div class="name">Date: ${reportDate}</div><div class="title">Date of Issuance</div></div>
  </div>
  <div class="footer">Generated electronically by HEALTH SYS SFCG on ${reportDate} at ${reportTime}.<br/>Confidential — For internal administrative use only. ${SCHOOL}.</div>
</body></html>`;
}

function summaryCards(cards: { label: string; value: string | number; color: string }[]): string {
  return `<div class="summary-grid">${cards.map((c) =>
    `<div class="summary-card ${c.color}"><div class="label">${escapeHtml(c.label)}</div><div class="value">${escapeHtml(String(c.value))}</div></div>`
  ).join('')}</div>`;
}

function barChart(items: { label: string; count: number }[], max?: number): string {
  if (items.length === 0) return '<p class="empty">No data available</p>';
  const m = max ?? Math.max(...items.map((i) => i.count), 1);
  return items.map((i) =>
    `<div class="bar-row"><span class="bar-label">${escapeHtml(i.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${(i.count / m) * 100}%"></div></div><span class="bar-val">${i.count}</span></div>`
  ).join('');
}

function table(headers: string[], rows: (string | number)[][]): string {
  if (rows.length === 0) return `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody><tr><td colspan="${headers.length}" class="empty">No records found</td></tr></tbody></table>`;
  return `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) =>
    `<tr>${r.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`
  ).join('')}</tbody></table>`;
}

// ============== MEDICAL REPORTS ==============

export function medicalConsultationReport(data: { requests: Request[]; users: User[]; preparedBy: string }): string {
  const medical = data.requests.filter((r) => r.type === 'medical');
  const byStatus = ['pending', 'processing', 'approved', 'rejected', 'released', 'forwarded'].map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1), count: medical.filter((r) => r.status === s).length,
  }));
  const byRole = ['student', 'staff', 'faculty', 'employee'].map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    count: medical.filter((r) => { const u = data.users.find((u) => u.id === r.userId); return u?.role === role; }).length,
  })).filter((r) => r.count > 0);

  const body = `
    ${summaryCards([
      { label: 'Total Consultations', value: medical.length, color: 'teal' },
      { label: 'Approved', value: medical.filter((r) => r.status === 'approved' || r.status === 'released').length, color: 'emerald' },
      { label: 'Pending', value: medical.filter((r) => r.status === 'pending').length, color: 'amber' },
      { label: 'Rejected', value: medical.filter((r) => r.status === 'rejected').length, color: 'rose' },
    ])}
    <div class="section"><div class="section-title">Consultations by Status</div>${barChart(byStatus)}</div>
    <div class="section"><div class="section-title">Consultations by User Category</div>${barChart(byRole)}</div>
    <div class="section"><div class="section-title">Recent Consultation Requests</div>${table(
      ['Patient', 'Description', 'Status', 'Submitted', 'Reviewed By'],
      medical.slice(0, 20).map((r) => [r.userName, r.description, r.status, r.submittedAt, r.reviewedBy ?? '—'])
    )}</div>`;
  return shell({ title: 'Medical Consultation Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-CONS' }, body);
}

export function dailyTreatmentReport(data: { visits: PatientVisit[]; preparedBy: string; date?: string }): string {
  const date = data.date ?? todayStr();
  const dayVisits = data.visits.filter((v) => v.visitDate === date && v.serviceType === 'medical');
  const body = `
    ${summaryCards([
      { label: "Today's Visits", value: dayVisits.length, color: 'teal' },
      { label: 'Completed', value: dayVisits.filter((v) => v.status === 'completed').length, color: 'emerald' },
      { label: 'Follow-ups', value: dayVisits.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'Pending', value: dayVisits.filter((v) => v.status === 'pending').length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Daily Treatment Records — ${escapeHtml(date)}</div>${table(
      ['Patient', 'Chief Complaint', 'Diagnosis', 'Treatment', 'Medicine', 'Status'],
      dayVisits.map((v) => [v.patientName, v.chiefComplaint, v.diagnosis || '—', v.treatmentProvided || '—', v.medicineName || '—', v.status])
    )}</div>`;
  return shell({ title: 'Daily Treatment Report', subtitle: `Service Date: ${date}`, preparedBy: data.preparedBy, docIdPrefix: 'MED-DAILY' }, body);
}

export function medicalHistoryReport(data: { records: HealthRecord[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Total Records', value: data.records.length, color: 'teal' },
      { label: 'With Allergies', value: data.records.filter((r) => r.allergies.length > 0).length, color: 'rose' },
      { label: 'With Conditions', value: data.records.filter((r) => r.conditions.length > 0).length, color: 'amber' },
      { label: 'Archived', value: data.records.filter((r) => r.archived).length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Patient Medical History</div>${table(
      ['Patient', 'Blood Type', 'Allergies', 'Conditions', 'Medications', 'Last Checkup'],
      data.records.slice(0, 50).map((r) => [r.userName, r.bloodType, r.allergies.join(', ') || 'None', r.conditions.join(', ') || 'None', r.medications.join(', ') || 'None', r.lastCheckup])
    )}</div>`;
  return shell({ title: 'Medical History Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-HIST' }, body);
}

export function patientVisitReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Total Visits', value: data.visits.length, color: 'teal' },
      { label: 'Medical', value: data.visits.filter((v) => v.serviceType === 'medical').length, color: 'sky' },
      { label: 'Dental', value: data.visits.filter((v) => v.serviceType === 'dental').length, color: 'amber' },
      { label: 'Physical', value: data.visits.filter((v) => v.serviceType === 'physical').length, color: 'rose' },
    ])}
    <div class="section"><div class="section-title">All Patient Visits</div>${table(
      ['Patient', 'Service', 'Date', 'Chief Complaint', 'Diagnosis', 'Status'],
      data.visits.slice(0, 50).map((v) => [v.patientName, v.serviceType, v.visitDate, v.chiefComplaint, v.diagnosis || '—', v.status])
    )}</div>`;
  return shell({ title: 'Patient Visit Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-VISIT' }, body);
}

export function firstAidReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const faVisits = data.visits.filter((v) => v.firstAidTreatment && v.firstAidTreatment.trim());
  const body = `
    ${summaryCards([
      { label: 'First Aid Cases', value: faVisits.length, color: 'rose' },
      { label: 'Medical', value: faVisits.filter((v) => v.serviceType === 'medical').length, color: 'teal' },
      { label: 'With Medicine', value: faVisits.filter((v) => v.medicineName).length, color: 'sky' },
      { label: 'Follow-ups', value: faVisits.filter((v) => v.status === 'follow_up').length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">First Aid Treatment Records</div>${table(
      ['Patient', 'Date', 'Chief Complaint', 'First Aid Treatment', 'Assessment', 'Recorded By'],
      faVisits.slice(0, 50).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.firstAidTreatment, v.assessment || '—', v.recordedBy])
    )}</div>`;
  return shell({ title: 'First Aid Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-FA' }, body);
}

export function medicineIssuanceReport(data: { dispensing: MedicineDispensing[]; preparedBy: string }): string {
  const totalQty = data.dispensing.reduce((s, d) => s + d.quantity, 0);
  const body = `
    ${summaryCards([
      { label: 'Total Issuances', value: data.dispensing.length, color: 'teal' },
      { label: 'Total Units', value: totalQty, color: 'sky' },
      { label: 'Unique Medicines', value: new Set(data.dispensing.map((d) => d.medicineId)).size, color: 'emerald' },
      { label: 'Unique Patients', value: new Set(data.dispensing.map((d) => d.patientId)).size, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Medicine Issuance Log</div>${table(
      ['Medicine', 'Patient', 'Quantity', 'Unit', 'Reason', 'Dispensed By', 'Date'],
      data.dispensing.slice(0, 50).map((d) => [d.medicineName, d.patientName, d.quantity, d.unit, d.reason, d.dispensedBy, d.dispensedAt])
    )}</div>`;
  return shell({ title: 'Medicine Issuance Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-ISS' }, body);
}

export function referralReport(data: { referrals: Referral[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Total Referrals', value: data.referrals.length, color: 'teal' },
      { label: 'Pending', value: data.referrals.filter((r) => r.status === 'pending').length, color: 'amber' },
      { label: 'Forwarded', value: data.referrals.filter((r) => r.status === 'forwarded').length, color: 'sky' },
      { label: 'Completed', value: data.referrals.filter((r) => r.status === 'completed').length, color: 'emerald' },
    ])}
    <div class="section"><div class="section-title">Referral Records</div>${table(
      ['Patient', 'Referred To', 'Reason', 'Date', 'Status', 'Result', 'Referred By'],
      data.referrals.slice(0, 50).map((r) => [r.patientName, r.referredTo, r.referralReason, r.referralDate, r.status, r.result || '—', r.referredBy])
    )}</div>`;
  return shell({ title: 'Referral Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-REF' }, body);
}

export function followUpReport(data: { followUps: FollowUp[]; preparedBy: string }): string {
  const today = todayStr();
  const body = `
    ${summaryCards([
      { label: 'Total Follow-ups', value: data.followUps.length, color: 'teal' },
      { label: 'Upcoming', value: data.followUps.filter((f) => f.scheduledDate >= today && f.status !== 'completed' && f.status !== 'cancelled').length, color: 'sky' },
      { label: 'Overdue', value: data.followUps.filter((f) => f.scheduledDate < today && (f.status === 'pending' || f.status === 'scheduled')).length, color: 'rose' },
      { label: 'Completed', value: data.followUps.filter((f) => f.status === 'completed').length, color: 'emerald' },
    ])}
    <div class="section"><div class="section-title">Follow-up Records</div>${table(
      ['Patient', 'Reason', 'Scheduled Date', 'Status', 'Result', 'Created By'],
      data.followUps.slice(0, 50).map((f) => [f.patientName, f.reason || '—', f.scheduledDate, f.status, f.result || '—', f.createdBy])
    )}</div>`;
  return shell({ title: 'Follow-up Report', preparedBy: data.preparedBy, docIdPrefix: 'MED-FU' }, body);
}

// ============== DENTAL REPORTS ==============

export function dentalExaminationReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const dental = data.visits.filter((v) => v.serviceType === 'dental');
  const body = `
    ${summaryCards([
      { label: 'Dental Exams', value: dental.length, color: 'teal' },
      { label: 'Completed', value: dental.filter((v) => v.status === 'completed').length, color: 'emerald' },
      { label: 'Follow-ups', value: dental.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'Pending', value: dental.filter((v) => v.status === 'pending').length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Dental Examination Records</div>${table(
      ['Patient', 'Date', 'Chief Complaint', 'Diagnosis', 'Treatment', 'Status'],
      dental.slice(0, 50).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.diagnosis || '—', v.treatmentProvided || '—', v.status])
    )}</div>`;
  return shell({ title: 'Dental Examination Report', preparedBy: data.preparedBy, docIdPrefix: 'DEN-EXAM' }, body);
}

export function dentalTreatmentReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const dental = data.visits.filter((v) => v.serviceType === 'dental' && v.treatmentProvided);
  const body = `
    ${summaryCards([
      { label: 'Treatments', value: dental.length, color: 'teal' },
      { label: 'With Medicine', value: dental.filter((v) => v.medicineName).length, color: 'sky' },
      { label: 'Follow-ups', value: dental.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'Completed', value: dental.filter((v) => v.status === 'completed').length, color: 'emerald' },
    ])}
    <div class="section"><div class="section-title">Dental Treatment Records</div>${table(
      ['Patient', 'Date', 'Treatment Provided', 'Medicine', 'Instructions', 'Recorded By'],
      dental.slice(0, 50).map((v) => [v.patientName, v.visitDate, v.treatmentProvided, v.medicineName || '—', v.instructions || '—', v.recordedBy])
    )}</div>`;
  return shell({ title: 'Dental Treatment Report', preparedBy: data.preparedBy, docIdPrefix: 'DEN-TX' }, body);
}

export function dentalProcedureReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const dental = data.visits.filter((v) => v.serviceType === 'dental');
  const body = `
    ${summaryCards([
      { label: 'Total Procedures', value: dental.length, color: 'teal' },
      { label: 'With First Aid', value: dental.filter((v) => v.firstAidTreatment).length, color: 'rose' },
      { label: 'With Medicine', value: dental.filter((v) => v.medicineName).length, color: 'sky' },
      { label: 'Completed', value: dental.filter((v) => v.status === 'completed').length, color: 'emerald' },
    ])}
    <div class="section"><div class="section-title">Dental Procedure Details</div>${table(
      ['Patient', 'Date', 'Chief Complaint', 'Assessment', 'Procedure/Treatment', 'Medicine', 'Remarks'],
      dental.slice(0, 50).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.assessment || '—', v.treatmentProvided || '—', v.medicineName || '—', v.remarks || '—'])
    )}</div>`;
  return shell({ title: 'Dental Procedure Report', preparedBy: data.preparedBy, docIdPrefix: 'DEN-PROC' }, body);
}

export function dentalSummaryReport(data: { visits: PatientVisit[]; records: HealthRecord[]; preparedBy: string }): string {
  const dental = data.visits.filter((v) => v.serviceType === 'dental');
  const withDentalStatus = data.records.filter((r) => r.dentalStatus);
  const body = `
    ${summaryCards([
      { label: 'Dental Visits', value: dental.length, color: 'teal' },
      { label: 'Dental Records', value: withDentalStatus.length, color: 'sky' },
      { label: 'Good Status', value: withDentalStatus.filter((r) => r.dentalStatus?.toLowerCase().includes('good')).length, color: 'emerald' },
      { label: 'Needs Follow-up', value: withDentalStatus.filter((r) => r.dentalStatus?.toLowerCase().includes('follow')).length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Dental Status Summary</div>${table(
      ['Patient', 'Dental Status', 'Last Checkup'],
      withDentalStatus.slice(0, 50).map((r) => [r.userName, r.dentalStatus ?? '—', r.lastCheckup])
    )}</div>
    <div class="section"><div class="section-title">Recent Dental Visits</div>${table(
      ['Patient', 'Date', 'Complaint', 'Diagnosis', 'Status'],
      dental.slice(0, 20).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.diagnosis || '—', v.status])
    )}</div>`;
  return shell({ title: 'Dental Summary Report', preparedBy: data.preparedBy, docIdPrefix: 'DEN-SUM' }, body);
}

// ============== PHYSICAL EXAMINATION REPORTS ==============

export function physicalExamReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const physical = data.visits.filter((v) => v.serviceType === 'physical');
  const body = `
    ${summaryCards([
      { label: 'Physical Exams', value: physical.length, color: 'teal' },
      { label: 'Completed', value: physical.filter((v) => v.status === 'completed').length, color: 'emerald' },
      { label: 'Follow-ups', value: physical.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'Pending', value: physical.filter((v) => v.status === 'pending').length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Physical Examination Records</div>${table(
      ['Patient', 'Date', 'Chief Complaint', 'Assessment', 'Diagnosis', 'Status'],
      physical.slice(0, 50).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.assessment || '—', v.diagnosis || '—', v.status])
    )}</div>`;
  return shell({ title: 'Physical Examination Report', preparedBy: data.preparedBy, docIdPrefix: 'PHY-EXAM' }, body);
}

export function vitalSignsReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const withVitals = data.visits.filter((v) => v.temperature || v.bloodPressure || v.heartRate || v.respiratoryRate || v.weight || v.height || v.oxygenSat);
  const body = `
    ${summaryCards([
      { label: 'Records with Vitals', value: withVitals.length, color: 'teal' },
      { label: 'With BP', value: withVitals.filter((v) => v.bloodPressure).length, color: 'sky' },
      { label: 'With Temp', value: withVitals.filter((v) => v.temperature).length, color: 'amber' },
      { label: 'With O2 Sat', value: withVitals.filter((v) => v.oxygenSat).length, color: 'rose' },
    ])}
    <div class="section"><div class="section-title">Vital Signs Records</div>${table(
      ['Patient', 'Date', 'Temp', 'BP', 'HR', 'RR', 'Weight', 'Height', 'O2 Sat'],
      withVitals.slice(0, 50).map((v) => [v.patientName, v.visitDate, v.temperature || '—', v.bloodPressure || '—', v.heartRate || '—', v.respiratoryRate || '—', v.weight || '—', v.height || '—', v.oxygenSat || '—'])
    )}</div>`;
  return shell({ title: 'Vital Signs Report', preparedBy: data.preparedBy, docIdPrefix: 'PHY-VS' }, body);
}

export function medicalScreeningReport(data: { records: HealthRecord[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Total Screened', value: data.records.length, color: 'teal' },
      { label: 'With Conditions', value: data.records.filter((r) => r.conditions.length > 0).length, color: 'amber' },
      { label: 'With Allergies', value: data.records.filter((r) => r.allergies.length > 0).length, color: 'rose' },
      { label: 'On Medication', value: data.records.filter((r) => r.medications.length > 0).length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Medical Screening Results</div>${table(
      ['Patient', 'Blood Type', 'Height', 'Weight', 'BMI', 'Vision', 'Allergies', 'Conditions'],
      data.records.slice(0, 50).map((r) => [r.userName, r.bloodType, r.height, r.weight, r.bmi ?? '—', r.vision ?? '—', r.allergies.join(', ') || 'None', r.conditions.join(', ') || 'None'])
    )}</div>`;
  return shell({ title: 'Medical Screening Report', preparedBy: data.preparedBy, docIdPrefix: 'PHY-SCR' }, body);
}

export function fitnessAssessmentReport(data: { records: HealthRecord[]; preparedBy: string }): string {
  const withBmi = data.records.filter((r) => r.bmi);
  const body = `
    ${summaryCards([
      { label: 'Assessed', value: withBmi.length, color: 'teal' },
      { label: 'Underweight (<18.5)', value: withBmi.filter((r) => parseFloat(r.bmi!) < 18.5).length, color: 'sky' },
      { label: 'Normal (18.5-25)', value: withBmi.filter((r) => { const b = parseFloat(r.bmi!); return b >= 18.5 && b < 25; }).length, color: 'emerald' },
      { label: 'Overweight (25+)', value: withBmi.filter((r) => parseFloat(r.bmi!) >= 25).length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Fitness Assessment Summary</div>${table(
      ['Patient', 'Height', 'Weight', 'BMI', 'Vision', 'Dental Status'],
      withBmi.slice(0, 50).map((r) => [r.userName, r.height, r.weight, r.bmi ?? '—', r.vision ?? '—', r.dentalStatus ?? '—'])
    )}</div>`;
  return shell({ title: 'Fitness Assessment Report', preparedBy: data.preparedBy, docIdPrefix: 'PHY-FIT' }, body);
}

export function furtherEvaluationReport(data: { referrals: Referral[]; followUps: FollowUp[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Active Referrals', value: data.referrals.filter((r) => r.status !== 'completed' && r.status !== 'rejected').length, color: 'rose' },
      { label: 'Pending Follow-ups', value: data.followUps.filter((f) => f.status === 'pending' || f.status === 'scheduled').length, color: 'amber' },
      { label: 'Completed Referrals', value: data.referrals.filter((r) => r.status === 'completed').length, color: 'emerald' },
      { label: 'Completed Follow-ups', value: data.followUps.filter((f) => f.status === 'completed').length, color: 'teal' },
    ])}
    <div class="section"><div class="section-title">Patients Requiring Further Evaluation</div>${table(
      ['Patient', 'Type', 'Detail', 'Date', 'Status'],
      [
        ...data.referrals.filter((r) => r.status !== 'completed').slice(0, 25).map((r) => [r.patientName, 'Referral', r.referredTo, r.referralDate, r.status]),
        ...data.followUps.filter((f) => f.status !== 'completed').slice(0, 25).map((f) => [f.patientName, 'Follow-up', f.reason, f.scheduledDate, f.status]),
      ]
    )}</div>`;
  return shell({ title: 'Further Evaluation Report', preparedBy: data.preparedBy, docIdPrefix: 'PHY-FE' }, body);
}

// ============== INVENTORY REPORTS ==============

export function currentInventoryReport(data: { inventory: Medicine[]; supplies: MedicalSupply[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Medicines', value: data.inventory.length, color: 'teal' },
      { label: 'Supplies', value: data.supplies.length, color: 'sky' },
      { label: 'Total Units', value: [...data.inventory, ...data.supplies].reduce((s, i) => s + i.quantity, 0), color: 'emerald' },
      { label: 'Low Stock', value: [...data.inventory, ...data.supplies].filter((i) => i.quantity <= i.minStock).length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Current Medicine Inventory</div>${table(
      ['Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Expiry', 'Supplier'],
      data.inventory.map((m) => [m.name, m.category, m.quantity, m.unit, m.minStock, m.expiryDate, m.supplier])
    )}</div>
    <div class="section"><div class="section-title">Current Medical Supplies</div>${table(
      ['Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Expiry', 'Supplier'],
      data.supplies.map((s) => [s.name, s.category, s.quantity, s.unit, s.minStock, s.expiryDate, s.supplier])
    )}</div>`;
  return shell({ title: 'Current Inventory Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-CUR' }, body);
}

export function stockInReport(data: { transactions: StockTransaction[]; preparedBy: string }): string {
  const stockIn = data.transactions.filter((t) => t.transactionType === 'stock_in');
  const body = `
    ${summaryCards([
      { label: 'Stock-In Records', value: stockIn.length, color: 'teal' },
      { label: 'Total Units In', value: stockIn.reduce((s, t) => s + t.quantity, 0), color: 'emerald' },
      { label: 'Medicines', value: stockIn.filter((t) => t.itemType === 'medicine').length, color: 'sky' },
      { label: 'Supplies', value: stockIn.filter((t) => t.itemType === 'supply').length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Stock-In Transactions</div>${table(
      ['Item', 'Type', 'Quantity', 'Unit', 'Reason', 'Recorded By', 'Date'],
      stockIn.map((t) => [t.itemName, t.itemType, t.quantity, t.unit, t.reason, t.recordedBy, t.recordedAt])
    )}</div>`;
  return shell({ title: 'Stock-In Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-IN' }, body);
}

export function stockOutReport(data: { transactions: StockTransaction[]; preparedBy: string }): string {
  const stockOut = data.transactions.filter((t) => ['stock_out', 'issuance', 'disposal', 'damage', 'expiry'].includes(t.transactionType));
  const body = `
    ${summaryCards([
      { label: 'Stock-Out Records', value: stockOut.length, color: 'rose' },
      { label: 'Total Units Out', value: stockOut.reduce((s, t) => s + t.quantity, 0), color: 'amber' },
      { label: 'Issuances', value: stockOut.filter((t) => t.transactionType === 'issuance').length, color: 'teal' },
      { label: 'Disposals', value: stockOut.filter((t) => t.transactionType === 'disposal' || t.transactionType === 'damage').length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Stock-Out Transactions</div>${table(
      ['Item', 'Type', 'Txn Type', 'Quantity', 'Unit', 'Reason', 'Date'],
      stockOut.map((t) => [t.itemName, t.itemType, t.transactionType, t.quantity, t.unit, t.reason, t.recordedAt])
    )}</div>`;
  return shell({ title: 'Stock-Out Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-OUT' }, body);
}

export function stockMovementReport(data: { transactions: StockTransaction[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Total Transactions', value: data.transactions.length, color: 'teal' },
      { label: 'Stock In', value: data.transactions.filter((t) => ['stock_in', 'return'].includes(t.transactionType)).length, color: 'emerald' },
      { label: 'Stock Out', value: data.transactions.filter((t) => ['stock_out', 'issuance', 'disposal', 'damage', 'expiry'].includes(t.transactionType)).length, color: 'rose' },
      { label: 'Adjustments', value: data.transactions.filter((t) => t.transactionType === 'adjustment').length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Stock Movement Log</div>${table(
      ['Item', 'Type', 'Transaction', 'Quantity', 'Unit', 'Reason', 'Recorded By', 'Date'],
      data.transactions.slice(0, 80).map((t) => [t.itemName, t.itemType, t.transactionType, t.quantity, t.unit, t.reason, t.recordedBy, t.recordedAt])
    )}</div>`;
  return shell({ title: 'Stock Movement Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-MV' }, body);
}

export function lowStockReport(data: { inventory: Medicine[]; supplies: MedicalSupply[]; preparedBy: string }): string {
  const lowMeds = data.inventory.filter((m) => m.quantity <= m.minStock);
  const lowSupplies = data.supplies.filter((s) => s.quantity <= s.minStock);
  const body = `
    ${summaryCards([
      { label: 'Low Medicines', value: lowMeds.length, color: 'amber' },
      { label: 'Low Supplies', value: lowSupplies.length, color: 'rose' },
      { label: 'Total Low Items', value: lowMeds.length + lowSupplies.length, color: 'teal' },
      { label: 'Need Restock', value: [...lowMeds, ...lowSupplies].filter((i) => i.quantity === 0).length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Low-Stock Medicines</div>${table(
      ['Name', 'Category', 'Current Qty', 'Min Stock', 'Unit', 'Supplier'],
      lowMeds.map((m) => [m.name, m.category, m.quantity, m.minStock, m.unit, m.supplier])
    )}</div>
    <div class="section"><div class="section-title">Low-Stock Supplies</div>${table(
      ['Name', 'Category', 'Current Qty', 'Min Stock', 'Unit', 'Supplier'],
      lowSupplies.map((s) => [s.name, s.category, s.quantity, s.minStock, s.unit, s.supplier])
    )}</div>`;
  return shell({ title: 'Low-Stock Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-LOW' }, body);
}

export function nearExpiryReport(data: { inventory: Medicine[]; supplies: MedicalSupply[]; preparedBy: string }): string {
  const today = new Date();
  const ninetyDays = new Date(today); ninetyDays.setDate(today.getDate() + 90);
  const nearExpiry = (items: (Medicine | MedicalSupply)[]) => items.filter((i) => {
    const exp = new Date(i.expiryDate); return exp >= today && exp <= ninetyDays;
  });
  const nearMeds = nearExpiry(data.inventory);
  const nearSupplies = nearExpiry(data.supplies);
  const body = `
    ${summaryCards([
      { label: 'Near-Expiry Meds', value: nearMeds.length, color: 'amber' },
      { label: 'Near-Expiry Supplies', value: nearSupplies.length, color: 'rose' },
      { label: 'Total', value: nearMeds.length + nearSupplies.length, color: 'teal' },
      { label: 'Within 90 Days', value: nearMeds.length + nearSupplies.length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Medicines Nearing Expiry (Within 90 Days)</div>${table(
      ['Name', 'Category', 'Quantity', 'Expiry Date', 'Supplier'],
      nearMeds.map((m) => [m.name, m.category, m.quantity, m.expiryDate, m.supplier])
    )}</div>
    <div class="section"><div class="section-title">Supplies Nearing Expiry (Within 90 Days)</div>${table(
      ['Name', 'Category', 'Quantity', 'Expiry Date', 'Supplier'],
      nearSupplies.map((s) => [s.name, s.category, s.quantity, s.expiryDate, s.supplier])
    )}</div>`;
  return shell({ title: 'Near-Expiry Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-NE' }, body);
}

export function expiredMedicineReport(data: { inventory: Medicine[]; supplies: MedicalSupply[]; preparedBy: string }): string {
  const today = new Date();
  const expiredMeds = data.inventory.filter((m) => new Date(m.expiryDate) < today);
  const expiredSupplies = data.supplies.filter((s) => new Date(s.expiryDate) < today);
  const body = `
    ${summaryCards([
      { label: 'Expired Medicines', value: expiredMeds.length, color: 'rose' },
      { label: 'Expired Supplies', value: expiredSupplies.length, color: 'amber' },
      { label: 'Total Expired', value: expiredMeds.length + expiredSupplies.length, color: 'teal' },
      { label: 'Need Disposal', value: expiredMeds.length + expiredSupplies.length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Expired Medicines</div>${table(
      ['Name', 'Category', 'Quantity', 'Expiry Date', 'Supplier'],
      expiredMeds.map((m) => [m.name, m.category, m.quantity, m.expiryDate, m.supplier])
    )}</div>
    <div class="section"><div class="section-title">Expired Supplies</div>${table(
      ['Name', 'Category', 'Quantity', 'Expiry Date', 'Supplier'],
      expiredSupplies.map((s) => [s.name, s.category, s.quantity, s.expiryDate, s.supplier])
    )}</div>`;
  return shell({ title: 'Expired Medicine Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-EXP' }, body);
}

export function medicineConsumptionReport(data: { dispensing: MedicineDispensing[]; inventory: Medicine[]; preparedBy: string }): string {
  const consumption: Record<string, number> = {};
  data.dispensing.forEach((d) => { consumption[d.medicineName] = (consumption[d.medicineName] ?? 0) + d.quantity; });
  const ranked = Object.entries(consumption).sort((a, b) => b[1] - a[1]);
  const body = `
    ${summaryCards([
      { label: 'Total Dispensed', value: data.dispensing.reduce((s, d) => s + d.quantity, 0), color: 'teal' },
      { label: 'Dispensing Events', value: data.dispensing.length, color: 'sky' },
      { label: 'Unique Medicines', value: ranked.length, color: 'emerald' },
      { label: 'Inventory Items', value: data.inventory.length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Medicine Consumption Ranking</div>${table(
      ['Rank', 'Medicine', 'Total Dispensed', 'Unit'],
      ranked.map(([name, qty], i) => [i + 1, name, qty, data.dispensing.find((d) => d.medicineName === name)?.unit ?? '—'])
    )}</div>`;
  return shell({ title: 'Medicine Consumption Report', preparedBy: data.preparedBy, docIdPrefix: 'INV-CONS' }, body);
}

// ============== ADMINISTRATIVE REPORTS ==============

export function dailySummaryReport(data: { requests: Request[]; visits: PatientVisit[]; dispensing: MedicineDispensing[]; preparedBy: string }): string {
  const date = todayStr();
  const dayReqs = data.requests.filter((r) => r.submittedAt === date);
  const dayVisits = data.visits.filter((v) => v.visitDate === date);
  const dayDisp = data.dispensing.filter((d) => d.dispensedAt === date);
  const body = `
    ${summaryCards([
      { label: "Today's Requests", value: dayReqs.length, color: 'teal' },
      { label: "Today's Visits", value: dayVisits.length, color: 'sky' },
      { label: "Today's Dispensing", value: dayDisp.length, color: 'emerald' },
      { label: 'Pending Reviews', value: data.requests.filter((r) => r.status === 'pending').length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Today's Activity — ${escapeHtml(date)}</div>${table(
      ['Type', 'Patient', 'Detail', 'Status/Time'],
      [
        ...dayReqs.slice(0, 15).map((r) => ['Request', r.userName, r.type, r.status]),
        ...dayVisits.slice(0, 15).map((v) => ['Visit', v.patientName, v.chiefComplaint, v.status]),
        ...dayDisp.slice(0, 15).map((d) => ['Dispensing', d.patientName, d.medicineName, d.dispensedAt]),
      ]
    )}</div>`;
  return shell({ title: 'Daily Summary Report', subtitle: `Date: ${date}`, preparedBy: data.preparedBy, docIdPrefix: 'ADM-DLY' }, body);
}

export function monthlySummaryReport(data: { requests: Request[]; visits: PatientVisit[]; dispensing: MedicineDispensing[]; expenses: Expense[]; preparedBy: string }): string {
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7);
  const monthReqs = data.requests.filter((r) => r.submittedAt.startsWith(monthStr));
  const monthVisits = data.visits.filter((v) => v.visitDate.startsWith(monthStr));
  const monthDisp = data.dispensing.filter((d) => d.dispensedAt.startsWith(monthStr));
  const monthExp = data.expenses.filter((e) => e.date.startsWith(monthStr));
  const body = `
    ${summaryCards([
      { label: 'Monthly Requests', value: monthReqs.length, color: 'teal' },
      { label: 'Monthly Visits', value: monthVisits.length, color: 'sky' },
      { label: 'Monthly Dispensing', value: monthDisp.length, color: 'emerald' },
      { label: 'Monthly Expenses', value: fmtPeso(monthExp.reduce((s, e) => s + e.amount, 0)), color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Monthly Summary — ${escapeHtml(monthStr)}</div>${table(
      ['Category', 'Count', 'Details'],
      [
        ['Medical Requests', monthReqs.filter((r) => r.type === 'medical').length, ''],
        ['Dental Requests', monthReqs.filter((r) => r.type === 'dental').length, ''],
        ['Medicine Requests', monthReqs.filter((r) => r.type === 'medicine').length, ''],
        ['Medical Visits', monthVisits.filter((v) => v.serviceType === 'medical').length, ''],
        ['Dental Visits', monthVisits.filter((v) => v.serviceType === 'dental').length, ''],
        ['Physical Exams', monthVisits.filter((v) => v.serviceType === 'physical').length, ''],
        ['Medicine Dispensed', monthDisp.length, `${monthDisp.reduce((s, d) => s + d.quantity, 0)} total units`],
        ['Expenses Recorded', monthExp.length, fmtPeso(monthExp.reduce((s, e) => s + e.amount, 0))],
      ]
    )}</div>`;
  return shell({ title: 'Monthly Summary Report', subtitle: `Month: ${monthStr}`, preparedBy: data.preparedBy, docIdPrefix: 'ADM-MON' }, body);
}

export function annualSummaryReport(data: { requests: Request[]; visits: PatientVisit[]; dispensing: MedicineDispensing[]; expenses: Expense[]; referrals: Referral[]; preparedBy: string }): string {
  const year = new Date().getFullYear().toString();
  const yearReqs = data.requests.filter((r) => r.submittedAt.startsWith(year));
  const yearVisits = data.visits.filter((v) => v.visitDate.startsWith(year));
  const yearDisp = data.dispensing.filter((d) => d.dispensedAt.startsWith(year));
  const yearExp = data.expenses.filter((e) => e.date.startsWith(year));
  const yearRef = data.referrals.filter((r) => r.referralDate.startsWith(year));
  const body = `
    ${summaryCards([
      { label: 'Annual Requests', value: yearReqs.length, color: 'teal' },
      { label: 'Annual Visits', value: yearVisits.length, color: 'sky' },
      { label: 'Annual Dispensing', value: yearDisp.length, color: 'emerald' },
      { label: 'Annual Expenses', value: fmtPeso(yearExp.reduce((s, e) => s + e.amount, 0)), color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Annual Summary — ${escapeHtml(year)}</div>${table(
      ['Category', 'Count', 'Additional Info'],
      [
        ['Total Requests', yearReqs.length, `${yearReqs.filter((r) => r.status === 'approved').length} approved`],
        ['Medical Visits', yearVisits.filter((v) => v.serviceType === 'medical').length, ''],
        ['Dental Visits', yearVisits.filter((v) => v.serviceType === 'dental').length, ''],
        ['Physical Exams', yearVisits.filter((v) => v.serviceType === 'physical').length, ''],
        ['Medicine Dispensing', yearDisp.length, `${yearDisp.reduce((s, d) => s + d.quantity, 0)} units`],
        ['Referrals', yearRef.length, `${yearRef.filter((r) => r.status === 'completed').length} completed`],
        ['Total Expenses', yearExp.length, fmtPeso(yearExp.reduce((s, e) => s + e.amount, 0))],
      ]
    )}</div>`;
  return shell({ title: 'Annual Summary Report', subtitle: `Year: ${year}`, preparedBy: data.preparedBy, docIdPrefix: 'ADM-ANN' }, body);
}

export function patientStatisticsReport(data: { users: User[]; records: HealthRecord[]; preparedBy: string }): string {
  const byRole = ['student', 'staff', 'faculty', 'employee'].map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    count: data.users.filter((u) => u.role === role).length,
  }));
  const btDist: Record<string, number> = {};
  data.records.forEach((r) => { btDist[r.bloodType] = (btDist[r.bloodType] ?? 0) + 1; });
  const btItems = Object.entries(btDist).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  const body = `
    ${summaryCards([
      { label: 'Total Users', value: data.users.length, color: 'teal' },
      { label: 'Active', value: data.users.filter((u) => u.status === 'active').length, color: 'emerald' },
      { label: 'Health Records', value: data.records.length, color: 'sky' },
      { label: 'With Conditions', value: data.records.filter((r) => r.conditions.length > 0).length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Users by Category</div>${barChart(byRole)}</div>
    <div class="section"><div class="section-title">Blood Type Distribution</div>${barChart(btItems)}</div>`;
  return shell({ title: 'Patient Statistics Report', preparedBy: data.preparedBy, docIdPrefix: 'ADM-PS' }, body);
}

export function treatmentStatisticsReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const byService = ['medical', 'dental', 'physical', 'medicine'].map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: data.visits.filter((v) => v.serviceType === s).length,
  }));
  const byStatus = ['completed', 'pending', 'follow_up'].map((s) => ({
    label: s === 'follow_up' ? 'Follow-up' : s.charAt(0).toUpperCase() + s.slice(1),
    count: data.visits.filter((v) => v.status === s).length,
  }));
  const body = `
    ${summaryCards([
      { label: 'Total Treatments', value: data.visits.length, color: 'teal' },
      { label: 'Completed', value: data.visits.filter((v) => v.status === 'completed').length, color: 'emerald' },
      { label: 'Follow-ups', value: data.visits.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'With Medicine', value: data.visits.filter((v) => v.medicineName).length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Treatments by Service Type</div>${barChart(byService)}</div>
    <div class="section"><div class="section-title">Treatments by Status</div>${barChart(byStatus)}</div>`;
  return shell({ title: 'Treatment Statistics Report', preparedBy: data.preparedBy, docIdPrefix: 'ADM-TS' }, body);
}

export function dentalStatisticsReport(data: { visits: PatientVisit[]; records: HealthRecord[]; preparedBy: string }): string {
  const dental = data.visits.filter((v) => v.serviceType === 'dental');
  const body = `
    ${summaryCards([
      { label: 'Dental Visits', value: dental.length, color: 'teal' },
      { label: 'Completed', value: dental.filter((v) => v.status === 'completed').length, color: 'emerald' },
      { label: 'Follow-ups', value: dental.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'Dental Records', value: data.records.filter((r) => r.dentalStatus).length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Dental Visit Status Breakdown</div>${barChart(
      ['completed', 'pending', 'follow_up'].map((s) => ({ label: s === 'follow_up' ? 'Follow-up' : s.charAt(0).toUpperCase() + s.slice(1), count: dental.filter((v) => v.status === s).length }))
    )}</div>`;
  return shell({ title: 'Dental Statistics Report', preparedBy: data.preparedBy, docIdPrefix: 'ADM-DS' }, body);
}

export function physicalExamStatisticsReport(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const physical = data.visits.filter((v) => v.serviceType === 'physical');
  const body = `
    ${summaryCards([
      { label: 'Physical Exams', value: physical.length, color: 'teal' },
      { label: 'Completed', value: physical.filter((v) => v.status === 'completed').length, color: 'emerald' },
      { label: 'Follow-ups', value: physical.filter((v) => v.status === 'follow_up').length, color: 'amber' },
      { label: 'With Vitals', value: physical.filter((v) => v.temperature || v.bloodPressure).length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Physical Exam Status Breakdown</div>${barChart(
      ['completed', 'pending', 'follow_up'].map((s) => ({ label: s === 'follow_up' ? 'Follow-up' : s.charAt(0).toUpperCase() + s.slice(1), count: physical.filter((v) => v.status === s).length }))
    )}</div>`;
  return shell({ title: 'Physical Examination Statistics Report', preparedBy: data.preparedBy, docIdPrefix: 'ADM-PES' }, body);
}

export function inventoryStatisticsReport(data: { inventory: Medicine[]; supplies: MedicalSupply[]; transactions: StockTransaction[]; preparedBy: string }): string {
  const today = new Date();
  const body = `
    ${summaryCards([
      { label: 'Total Items', value: data.inventory.length + data.supplies.length, color: 'teal' },
      { label: 'Low Stock', value: [...data.inventory, ...data.supplies].filter((i) => i.quantity <= i.minStock).length, color: 'amber' },
      { label: 'Expired', value: [...data.inventory, ...data.supplies].filter((i) => new Date(i.expiryDate) < today).length, color: 'rose' },
      { label: 'Transactions', value: data.transactions.length, color: 'sky' },
    ])}
    <div class="section"><div class="section-title">Inventory by Category</div>${barChart(
      Object.entries([...data.inventory, ...data.supplies].reduce((acc, i) => { acc[i.category] = (acc[i.category] ?? 0) + 1; return acc; }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))
    )}</div>
    <div class="section"><div class="section-title">Transactions by Type</div>${barChart(
      Object.entries(data.transactions.reduce((acc, t) => { acc[t.transactionType] = (acc[t.transactionType] ?? 0) + 1; return acc; }, {} as Record<string, number>))
        .map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }))
    )}</div>`;
  return shell({ title: 'Inventory Statistics Report', preparedBy: data.preparedBy, docIdPrefix: 'ADM-IS' }, body);
}

// ============== PRINT RECORDS ==============

export function printHealthRecord(data: { record: HealthRecord; dispensing: MedicineDispensing[]; preparedBy: string }): string {
  const r = data.record;
  const disp = data.dispensing.filter((d) => d.patientId === r.userId);
  const body = `
    <div class="section"><div class="section-title">Patient Information</div>${table(
      ['Field', 'Value'],
      [
        ['Name', r.userName],
        ['Role', r.userRole ?? '—'],
        ['Department', r.department ?? '—'],
        ['Student ID', r.studentId ?? '—'],
        ['Employee ID', r.employeeId ?? '—'],
        ['Faculty ID', r.facultyId ?? '—'],
      ]
    )}</div>
    <div class="section"><div class="section-title">Vital Information</div>${table(
      ['Field', 'Value'],
      [
        ['Blood Type', r.bloodType],
        ['Height', r.height],
        ['Weight', r.weight],
        ['BMI', r.bmi ?? '—'],
        ['Vision', r.vision ?? '—'],
        ['Dental Status', r.dentalStatus ?? '—'],
      ]
    )}</div>
    <div class="section"><div class="section-title">Medical Information</div>${table(
      ['Category', 'Details'],
      [
        ['Allergies', r.allergies.join(', ') || 'None'],
        ['Conditions', r.conditions.join(', ') || 'None'],
        ['Medications', r.medications.join(', ') || 'None'],
        ['Last Checkup', r.lastCheckup],
        ['Next Checkup', r.nextCheckup ?? '—'],
        ['Emergency Contact', r.emergencyContact ?? '—'],
        ['Emergency Phone', r.emergencyPhone ?? '—'],
      ]
    )}</div>
    ${r.notes ? `<div class="section"><div class="section-title">Clinical Notes</div><p style="font-size:10pt;padding:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;">${escapeHtml(r.notes)}</p></div>` : ''}
    <div class="section"><div class="section-title">Medicine Dispensing History (${disp.length})</div>${table(
      ['Medicine', 'Quantity', 'Reason', 'Dispensed By', 'Date'],
      disp.map((d) => [d.medicineName, `${d.quantity} ${d.unit}`, d.reason, d.dispensedBy, d.dispensedAt])
    )}</div>`;
  return shell({ title: 'Patient Health Record', subtitle: r.userName, preparedBy: data.preparedBy, docIdPrefix: 'PRT-HR' }, body);
}

export function printTreatmentRecord(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const body = `
    <div class="section"><div class="section-title">Medical Treatment Records</div>${table(
      ['Patient', 'Date', 'Complaint', 'Diagnosis', 'Treatment', 'Medicine', 'Status'],
      data.visits.filter((v) => v.serviceType === 'medical').slice(0, 80).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.diagnosis || '—', v.treatmentProvided || '—', v.medicineName || '—', v.status])
    )}</div>`;
  return shell({ title: 'Medical Treatment Record', preparedBy: data.preparedBy, docIdPrefix: 'PRT-TR' }, body);
}

export function printDentalRecord(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const dental = data.visits.filter((v) => v.serviceType === 'dental');
  const body = `
    <div class="section"><div class="section-title">Dental Examination & Treatment Records</div>${table(
      ['Patient', 'Date', 'Complaint', 'Assessment', 'Diagnosis', 'Treatment', 'Status'],
      dental.slice(0, 80).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.assessment || '—', v.diagnosis || '—', v.treatmentProvided || '—', v.status])
    )}</div>`;
  return shell({ title: 'Dental Examination & Treatment Record', preparedBy: data.preparedBy, docIdPrefix: 'PRT-DR' }, body);
}

export function printPhysicalExamRecord(data: { visits: PatientVisit[]; preparedBy: string }): string {
  const physical = data.visits.filter((v) => v.serviceType === 'physical');
  const body = `
    <div class="section"><div class="section-title">Physical Examination Records</div>${table(
      ['Patient', 'Date', 'Complaint', 'Temp', 'BP', 'HR', 'Assessment', 'Diagnosis', 'Status'],
      physical.slice(0, 80).map((v) => [v.patientName, v.visitDate, v.chiefComplaint, v.temperature || '—', v.bloodPressure || '—', v.heartRate || '—', v.assessment || '—', v.diagnosis || '—', v.status])
    )}</div>`;
  return shell({ title: 'Physical Examination Record', preparedBy: data.preparedBy, docIdPrefix: 'PRT-PER' }, body);
}

export function printReferralFollowUpRecord(data: { referrals: Referral[]; followUps: FollowUp[]; preparedBy: string }): string {
  const body = `
    <div class="section"><div class="section-title">Referral Records</div>${table(
      ['Patient', 'Referred To', 'Reason', 'Date', 'Status', 'Result', 'Referred By'],
      data.referrals.slice(0, 50).map((r) => [r.patientName, r.referredTo, r.referralReason, r.referralDate, r.status, r.result || '—', r.referredBy])
    )}</div>
    <div class="section"><div class="section-title">Follow-up Records</div>${table(
      ['Patient', 'Reason', 'Scheduled Date', 'Status', 'Result', 'Created By'],
      data.followUps.slice(0, 50).map((f) => [f.patientName, f.reason || '—', f.scheduledDate, f.status, f.result || '—', f.createdBy])
    )}</div>`;
  return shell({ title: 'Referral & Follow-up Record', preparedBy: data.preparedBy, docIdPrefix: 'PRT-RF' }, body);
}

export function printMedicineIssuanceRecord(data: { dispensing: MedicineDispensing[]; preparedBy: string }): string {
  const body = `
    <div class="section"><div class="section-title">Medicine Issuance Records</div>${table(
      ['Medicine', 'Patient', 'Quantity', 'Unit', 'Reason', 'Dispensed By', 'Date'],
      data.dispensing.slice(0, 80).map((d) => [d.medicineName, d.patientName, d.quantity, d.unit, d.reason, d.dispensedBy, d.dispensedAt])
    )}</div>`;
  return shell({ title: 'Medicine Issuance Record', preparedBy: data.preparedBy, docIdPrefix: 'PRT-MI' }, body);
}

export function printInventoryPurchaseReport(data: { inventory: Medicine[]; supplies: MedicalSupply[]; purchases: Purchase[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Medicines', value: data.inventory.length, color: 'teal' },
      { label: 'Supplies', value: data.supplies.length, color: 'sky' },
      { label: 'Purchases', value: data.purchases.length, color: 'emerald' },
      { label: 'Total Spent', value: fmtPeso(data.purchases.reduce((s, p) => s + p.totalCost, 0)), color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Inventory Summary</div>${table(
      ['Name', 'Type', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Expiry'],
      [...data.inventory.map((m) => [m.name, 'Medicine', m.category, m.quantity, m.unit, m.minStock, m.expiryDate]),
       ...data.supplies.map((s) => [s.name, 'Supply', s.category, s.quantity, s.unit, s.minStock, s.expiryDate])]
    )}</div>
    <div class="section"><div class="section-title">Purchase Records</div>${table(
      ['Supplier', 'Item', 'Qty', 'Unit Cost', 'Total', 'Date', 'Status'],
      data.purchases.slice(0, 50).map((p) => [p.supplierName, p.itemDescription, p.quantity, fmtPeso(p.unitCost), fmtPeso(p.totalCost), p.purchaseDate, p.status])
    )}</div>`;
  return shell({ title: 'Inventory & Purchase Report', preparedBy: data.preparedBy, docIdPrefix: 'PRT-IP' }, body);
}

export function printHealthDispensarySummary(data: { records: HealthRecord[]; visits: PatientVisit[]; dispensing: MedicineDispensing[]; inventory: Medicine[]; expenses: Expense[]; preparedBy: string }): string {
  const body = `
    ${summaryCards([
      { label: 'Health Records', value: data.records.length, color: 'teal' },
      { label: 'Total Visits', value: data.visits.length, color: 'sky' },
      { label: 'Dispensing', value: data.dispensing.length, color: 'emerald' },
      { label: 'Inventory Items', value: data.inventory.length, color: 'amber' },
    ])}
    <div class="section"><div class="section-title">Visits by Service Type</div>${barChart(
      ['medical', 'dental', 'physical', 'medicine'].map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), count: data.visits.filter((v) => v.serviceType === s).length }))
    )}</div>
    <div class="section"><div class="section-title">Financial Summary</div>${table(
      ['Category', 'Amount'],
      [
        ['Total Expenses', fmtPeso(data.expenses.reduce((s, e) => s + e.amount, 0))],
        ['Liquidated', fmtPeso(data.expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0))],
        ['Pending', fmtPeso(data.expenses.filter((e) => e.status !== 'liquidated').reduce((s, e) => s + e.amount, 0))],
      ]
    )}</div>
    <div class="section"><div class="section-title">Dispensing Summary</div>${table(
      ['Medicine', 'Total Dispensed', 'Unit'],
      Object.entries(data.dispensing.reduce((acc, d) => { acc[d.medicineName] = (acc[d.medicineName] ?? 0) + d.quantity; return acc; }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, qty]) => [name, qty, data.dispensing.find((d) => d.medicineName === name)?.unit ?? '—'])
    )}</div>`;
  return shell({ title: 'Health & Dispensary Summary Report', preparedBy: data.preparedBy, docIdPrefix: 'PRT-HDS' }, body);
}

// ============== MY HEALTH REPORTS (for students/employees/faculty) ==============

export function myHealthReport(data: { record: HealthRecord | null; visits: PatientVisit[]; referrals: Referral[]; followUps: FollowUp[]; dispensing: MedicineDispensing[]; preparedBy: string }): string {
  const r = data.record;
  const myVisits = data.visits;
  const myRef = data.referrals;
  const myFu = data.followUps;
  const myDisp = data.dispensing;

  const infoSection = r ? `
    <div class="section"><div class="section-title">My Health Information</div>${table(
      ['Field', 'Value'],
      [
        ['Blood Type', r.bloodType],
        ['Height', r.height],
        ['Weight', r.weight],
        ['BMI', r.bmi ?? '—'],
        ['Vision', r.vision ?? '—'],
        ['Dental Status', r.dentalStatus ?? '—'],
        ['Allergies', r.allergies.join(', ') || 'None'],
        ['Conditions', r.conditions.join(', ') || 'None'],
        ['Medications', r.medications.join(', ') || 'None'],
        ['Last Checkup', r.lastCheckup],
        ['Next Checkup', r.nextCheckup ?? '—'],
      ]
    )}</div>` : '<div class="section"><div class="section-title">My Health Information</div><p class="empty">No health record on file. Please visit the clinic.</p></div>';

  const body = `
    ${infoSection}
    <div class="section"><div class="section-title">My Treatment History (${myVisits.length})</div>${table(
      ['Date', 'Service', 'Complaint', 'Diagnosis', 'Treatment', 'Status'],
      myVisits.slice(0, 30).map((v) => [v.visitDate, v.serviceType, v.chiefComplaint, v.diagnosis || '—', v.treatmentProvided || '—', v.status])
    )}</div>
    <div class="section"><div class="section-title">My Referrals (${myRef.length})</div>${table(
      ['Referred To', 'Reason', 'Date', 'Status', 'Result'],
      myRef.slice(0, 20).map((r) => [r.referredTo, r.referralReason, r.referralDate, r.status, r.result || '—'])
    )}</div>
    <div class="section"><div class="section-title">My Follow-ups (${myFu.length})</div>${table(
      ['Reason', 'Scheduled Date', 'Status', 'Result'],
      myFu.slice(0, 20).map((f) => [f.reason || '—', f.scheduledDate, f.status, f.result || '—'])
    )}</div>
    <div class="section"><div class="section-title">My Medicine Dispensing (${myDisp.length})</div>${table(
      ['Medicine', 'Quantity', 'Reason', 'Date'],
      myDisp.slice(0, 20).map((d) => [d.medicineName, `${d.quantity} ${d.unit}`, d.reason, d.dispensedAt])
    )}</div>`;
  return shell({ title: 'My Health Report', subtitle: data.preparedBy, preparedBy: data.preparedBy, docIdPrefix: 'MY-HR' }, body);
}
