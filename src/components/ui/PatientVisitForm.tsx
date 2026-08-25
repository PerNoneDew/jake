import { useState } from 'react';
import { Activity, Stethoscope, Smile, HeartPulse, Pill, Thermometer, Droplet, Gauge, Wind, Weight, Ruler, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { PatientVisit, ServiceType, User, Medicine } from '../../types';
import PatientSearch from './PatientSearch';
import Modal from './Modal';

type FormState = {
  patientId: string;
  patientName: string;
  patientRole?: string;
  department?: string;
  chiefComplaint: string;
  symptoms: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
  height: string;
  oxygenSat: string;
  assessment: string;
  diagnosis: string;
  treatmentProvided: string;
  firstAidTreatment: string;
  medicineName: string;
  medicineId: string;
  dosage: string;
  quantity: number;
  unit: string;
  instructions: string;
  remarks: string;
};

const emptyForm: FormState = {
  patientId: '', patientName: '', patientRole: '', department: '',
  chiefComplaint: '', symptoms: '', temperature: '', bloodPressure: '', heartRate: '', respiratoryRate: '',
  weight: '', height: '', oxygenSat: '', assessment: '', diagnosis: '', treatmentProvided: '', firstAidTreatment: '',
  medicineName: '', medicineId: '', dosage: '', quantity: 0, unit: '', instructions: '', remarks: '',
};

interface PatientVisitFormProps {
  serviceType: ServiceType;
  isOpen: boolean;
  onClose: () => void;
  editVisit?: PatientVisit | null;
}

export default function PatientVisitForm({ serviceType, isOpen, onClose, editVisit }: PatientVisitFormProps) {
  const { currentUser } = useAuth();
  const { users, inventory, persistPatientVisit, persistMedicine } = useData();
  const { runWithFeedback } = useFeedback();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  const patients = users.filter((u) => ['student', 'staff', 'faculty', 'employee'].includes(u.role));

  const handlePatientSelect = (patient: User | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setForm((prev) => ({ ...prev, patientId: patient.id, patientName: patient.name, patientRole: patient.role, department: patient.department ?? '' }));
    } else {
      setForm((prev) => ({ ...prev, patientId: '', patientName: '', patientRole: '', department: '' }));
    }
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setForm((prev) => ({ ...prev, medicineName: medicine.name, medicineId: medicine.id, unit: medicine.unit }));
  };

  const handleSave = async () => {
    if (!form.patientId || !form.chiefComplaint.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    const visit: PatientVisit = {
      id: editVisit?.id ?? `pv${Date.now()}`,
      patientId: form.patientId,
      patientName: form.patientName,
      patientRole: form.patientRole as PatientVisit['patientRole'],
      department: form.department || undefined,
      serviceType,
      visitDate: editVisit?.visitDate ?? now,
      chiefComplaint: form.chiefComplaint,
      symptoms: form.symptoms,
      temperature: form.temperature || undefined,
      bloodPressure: form.bloodPressure || undefined,
      heartRate: form.heartRate || undefined,
      respiratoryRate: form.respiratoryRate || undefined,
      weight: form.weight || undefined,
      height: form.height || undefined,
      oxygenSat: form.oxygenSat || undefined,
      assessment: form.assessment,
      diagnosis: form.diagnosis,
      treatmentProvided: form.treatmentProvided,
      firstAidTreatment: form.firstAidTreatment,
      medicineName: form.medicineName,
      medicineId: form.medicineId || undefined,
      dosage: form.dosage,
      quantity: form.quantity,
      unit: form.unit,
      instructions: form.instructions,
      remarks: form.remarks,
      recordedBy: currentUser?.name ?? '',
      status: 'completed',
      createdAt: editVisit?.createdAt ?? now,
      updatedAt: now,
    };

    await runWithFeedback(
      async () => {
        await persistPatientVisit(visit);
        if (form.medicineId && form.quantity > 0) {
          const med = inventory.find((m) => m.id === form.medicineId);
          if (med && med.quantity >= form.quantity) {
            await persistMedicine({ ...med, quantity: med.quantity - form.quantity, lastUpdated: now });
          }
        }
      },
      {
        loadingTitle: editVisit ? 'Saving visit...' : 'Recording visit...',
        successTitle: editVisit ? 'Visit updated' : 'Visit recorded',
        successMessage: `Patient visit for ${form.patientName} has been ${editVisit ? 'updated' : 'recorded'}.`,
        autoCloseMs: 1800,
      },
    );
    setForm(emptyForm);
    setSelectedPatient(null);
    onClose();
  };

  const serviceLabel: Record<ServiceType, string> = {
    medical: 'Medical Treatment',
    dental: 'Dental Examination',
    physical: 'Physical Examination',
    medicine: 'Medicine Issuance',
  };

  const serviceIcon: Record<ServiceType, React.ElementType> = {
    medical: Stethoscope,
    dental: Smile,
    physical: HeartPulse,
    medicine: Pill,
  };

  const Icon = serviceIcon[serviceType];
  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${editVisit ? 'Edit' : 'Record'} ${serviceLabel[serviceType]}`} size="xl">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
          <div className="p-2 rounded-lg bg-white"><Icon size={18} className="text-teal-600" /></div>
          <div>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Service Type</p>
            <p className="font-bold text-teal-800">{serviceLabel[serviceType]}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Patient</label>
          <PatientSearch patients={patients} selectedId={form.patientId} onSelect={handlePatientSelect} />
        </div>

        {selectedPatient && (
          <>
            <Section title="Chief Complaint & Symptoms" icon={Activity}>
              <div className="space-y-3">
                <Field label="Chief Complaint *">
                  <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} rows={2} className={inputCls} placeholder="Patient's main complaint..." />
                </Field>
                <Field label="Symptoms">
                  <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={2} className={inputCls} placeholder="Associated symptoms..." />
                </Field>
              </div>
            </Section>

            <Section title="Vital Signs" icon={Thermometer}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <VitalField icon={Thermometer} label="Temp (°C)" value={form.temperature} onChange={(v) => setForm({ ...form, temperature: v })} />
                <VitalField icon={Droplet} label="BP (mmHg)" value={form.bloodPressure} onChange={(v) => setForm({ ...form, bloodPressure: v })} />
                <VitalField icon={Activity} label="HR (bpm)" value={form.heartRate} onChange={(v) => setForm({ ...form, heartRate: v })} />
                <VitalField icon={Wind} label="RR (bpm)" value={form.respiratoryRate} onChange={(v) => setForm({ ...form, respiratoryRate: v })} />
                <VitalField icon={Weight} label="Weight (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />
                <VitalField icon={Ruler} label="Height (cm)" value={form.height} onChange={(v) => setForm({ ...form, height: v })} />
                <VitalField icon={Gauge} label="O2 Sat (%)" value={form.oxygenSat} onChange={(v) => setForm({ ...form, oxygenSat: v })} />
              </div>
            </Section>

            <Section title="Assessment & Treatment" icon={Stethoscope}>
              <div className="space-y-3">
                <Field label="Assessment / Diagnosis">
                  <textarea value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} rows={2} className={inputCls} placeholder="Clinical assessment..." />
                </Field>
                <Field label="Diagnosis">
                  <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className={inputCls} placeholder="Working diagnosis..." />
                </Field>
                <Field label="Treatment Provided">
                  <textarea value={form.treatmentProvided} onChange={(e) => setForm({ ...form, treatmentProvided: e.target.value })} rows={2} className={inputCls} placeholder="Treatment given..." />
                </Field>
                <Field label="First-Aid Treatment">
                  <textarea value={form.firstAidTreatment} onChange={(e) => setForm({ ...form, firstAidTreatment: e.target.value })} rows={2} className={inputCls} placeholder="First-aid administered, if any..." />
                </Field>
              </div>
            </Section>

            <Section title="Medicine Given" icon={Pill}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Select from Inventory (optional)</label>
                  <select value={form.medicineId} onChange={(e) => {
                    const med = inventory.find((m) => m.id === e.target.value);
                    if (med) handleMedicineSelect(med);
                    else setForm({ ...form, medicineId: '', medicineName: '', unit: '' });
                  }} className={inputCls}>
                    <option value="">— None / Manual entry —</option>
                    {inventory.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} in stock)</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Medicine Name"><input value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} className={inputCls} placeholder="Medicine name" /></Field>
                  <Field label="Dosage"><input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className={inputCls} placeholder="e.g. 500mg" /></Field>
                  <Field label="Quantity"><input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} /></Field>
                  <Field label="Unit"><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="e.g. tablets" /></Field>
                </div>
                <Field label="Instructions"><textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} className={inputCls} placeholder="Dosage instructions for patient..." /></Field>
              </div>
            </Section>

            <Section title="Remarks" icon={Package}>
              <Field label="Remarks"><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className={inputCls} placeholder="Additional remarks..." /></Field>
            </Section>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.patientId || !form.chiefComplaint.trim()} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white rounded-xl transition-colors">{editVisit ? 'Save Changes' : 'Record Visit'}</button>
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center gap-2 mb-3"><Icon size={15} className="text-teal-500" /><h3 className="text-sm font-semibold text-slate-700">{title}</h3></div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>{children}</div>);
}

function VitalField({ icon: Icon, label, value, onChange }: { icon: React.ElementType; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
    </div>
  );
}
