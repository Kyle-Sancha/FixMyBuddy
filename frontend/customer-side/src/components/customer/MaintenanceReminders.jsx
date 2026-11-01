import { tr, trTemplate } from "../../i18n/translations";
import { LoadingState } from '../ui/LoadingState';
import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Check, RotateCcw, Wrench, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../../context/useCustomer';
import { customerService, isCustomerApiConfigured } from '../../services/customerService';
import { reminderDue, validateReminder } from '../../utils/historyValidation';
const empty = {
  title: '',
  vehicleId: '',
  dueDate: '',
  targetMileage: '',
  currentMileage: '',
  notes: ''
};
export function MaintenanceReminders({
  user
}) {
  const {
    vehicles,
    selectedVehicle
  } = useCustomer();
  const key = `fixmybuddy-reminders:${user?.id || 'guest'}`;
  const remote = Boolean(user && isCustomerApiConfigured);
  const [items, setItems] = useState(() => {
    if (remote) return [];
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data.filter(item => item?.id && typeof item.title === 'string') : [];
    } catch {
      return [];
    }
  });
  const [status, setStatus] = useState(remote ? 'loading' : 'ready');
  const [retry, setRetry] = useState(0);
  const [fields, setFields] = useState(empty);
  const [editing, setEditing] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [removal, setRemoval] = useState(null);
  const dialog = useRef(null);
  const titleInput = useRef(null);
  useEffect(() => {
    if (!remote) return;
    let active = true;
    setStatus('loading');
    customerService.reminders().then(data => {
      if (active) {
        setItems(data);
        setStatus('ready');
      }
    }).catch(() => {
      if (active) setStatus('error');
    });
    return () => {
      active = false;
    };
  }, [remote, retry]);
  useEffect(() => {
    if (formOpen) titleInput.current?.focus();
  }, [formOpen]);
  const update = event => {
    setFields(current => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setError('');
  };
  function persist(next) {
    if (!remote) localStorage.setItem(key, JSON.stringify(next));
    setItems(next);
  }
  async function save(event) {
    event.preventDefault();
    const values = {
      ...fields,
      dueDate: event.currentTarget.elements.namedItem('dueDate').value
    };
    const problem = validateReminder(values);
    if (problem || !vehicles.some(vehicle => vehicle.id === fields.vehicleId)) {
      setError(problem || 'Choose a saved vehicle.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const details = {
        ...values,
        title: values.title.trim(),
        targetMileage: values.targetMileage === '' ? null : Number(values.targetMileage),
        currentMileage: values.currentMileage === '' ? null : Number(values.currentMileage)
      };
      const saved = remote ? await customerService.saveReminder(details, editing) : {
        ...items.find(item => item.id === editing),
        ...details,
        id: editing || crypto.randomUUID()
      };
      persist(editing ? items.map(item => item.id === editing ? saved : item) : [...items, saved]);
      setFormOpen(false);
      setEditing('');
      setMessage(remote ? 'Reminder saved.' : 'Reminder saved on this device.');
    } catch (problem) {
      setError(problem.message || 'Could not save this reminder.');
    } finally {
      setBusy(false);
    }
  }
  async function complete(item) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const details = {
        completedAt: item.completedAt ? null : new Date().toISOString()
      };
      const saved = remote ? await customerService.saveReminder(details, item.id) : {
        ...item,
        ...details
      };
      persist(items.map(current => current.id === item.id ? saved : current));
      setMessage(saved.completedAt ? 'Reminder marked complete.' : 'Reminder reopened.');
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError('');
    try {
      if (remote) await customerService.removeReminder(removal.id);
      persist(items.filter(item => item.id !== removal.id));
      dialog.current.close();
      setRemoval(null);
      setMessage('Reminder removed.');
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  const visible = items.filter(item => showCompleted || !item.completedAt);
  return <section className="updates-reminders">
    <div className="customer-section-heading"><h2>{tr("Maintenance reminders")}</h2><button type="button" className="customer-text-button" disabled={status !== 'ready' || busy} onClick={() => {
        setFields({
          ...empty,
          vehicleId: selectedVehicle?.id || ''
        });
        setEditing('');
        setError('');
        setFormOpen(true);
      }}><Plus size={16} />{tr("Add")}</button></div>
    {!remote && <p className="auth-hint">{tr("Saved on this device. These are in-app reminders, not scheduled push notifications.")}</p>}
    {status === 'loading' && <LoadingState label={tr("Loading reminders...")} />}
    {status === 'error' && <div className="history-notice"><p>{tr("Could not load reminders.")}</p><button className="auth-secondary" type="button" onClick={() => setRetry(value => value + 1)}>{tr("Try again")}</button></div>}
    {formOpen && <form key={editing || 'new'} className="reminder-form request-form" onSubmit={save}>
      <div className="customer-section-heading"><h3>{editing ? tr("Edit reminder") : tr("New reminder")}</h3><button type="button" className="history-icon" title={tr("Close reminder form")} aria-label={tr("Close reminder form")} disabled={busy} onClick={() => setFormOpen(false)}><X size={20} /></button></div>
      {!vehicles.length && <Link to="/vehicles" className="provider-text-link">{tr("Add a vehicle first")}</Link>}
      <label className="request-field">{tr("Reminder title")}<input ref={titleInput} name="title" required maxLength={100} value={fields.title} onChange={update} /></label>
      <label className="request-field">{tr("Vehicle")}<select name="vehicleId" required value={fields.vehicleId} onChange={update}><option value="">{tr("Choose a vehicle")}</option>{vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} · {vehicle.year}</option>)}</select></label>
      <label className="request-field">{tr("Due date")}<span className="request-optional">{tr("Optional if mileage is set")}</span><input type="date" name="dueDate" defaultValue={fields.dueDate} /></label>
      <label className="request-field">{tr("Target odometer (km)")}<input type="number" min="0" step="1" name="targetMileage" value={fields.targetMileage} onChange={update} /></label>
      <label className="request-field">{tr("Current odometer (km)")}<span className="request-optional">{tr("Optional")}</span><input type="number" min="0" step="1" name="currentMileage" value={fields.currentMileage} onChange={update} /></label>
      <label className="request-field">{tr("Notes")}<span className="request-optional">{tr("Optional")}</span><textarea name="notes" rows={2} maxLength={500} value={fields.notes} onChange={update} /></label>
      <button className="auth-primary" type="submit" disabled={busy}><Check size={18} />{busy ? tr("Saving...") : tr("Save reminder")}</button>
    </form>}
    {status === 'ready' && !visible.length && <p className="history-empty-copy">{showCompleted ? tr("No reminders yet.") : tr("No active reminders. Add one for your next service.")}</p>}
    <div className="reminder-list">{visible.map(item => <article key={item.id} className="reminder-item">
      <header><Wrench size={20} /><h3>{item.title}</h3><span className={reminderDue(item) === 'Due now' ? 'is-due' : ''}>{reminderDue(item)}</span></header>
      <p>{vehicles.find(vehicle => vehicle.id === item.vehicleId) ? trTemplate(["", " ", ""], [vehicles.find(vehicle => vehicle.id === item.vehicleId).make, vehicles.find(vehicle => vehicle.id === item.vehicleId).model]) : tr("Vehicle no longer in garage")}</p>
      {item.targetMileage != null && <p>{tr("Target:")} {Number(item.targetMileage).toLocaleString()} {tr("km")} {item.currentMileage != null ? trTemplate([" \xB7 Current: ", " km"], [Number(item.currentMileage).toLocaleString()]) : ''}</p>}
      {item.notes && <p>{item.notes}</p>}
      <div className="reminder-actions"><button type="button" disabled={busy} className="customer-text-button" onClick={() => complete(item)}>{item.completedAt ? <RotateCcw size={16} /> : <Check size={16} />}{item.completedAt ? tr("Reopen") : tr("Mark complete")}</button>
      <button type="button" className="history-icon" title={tr("Edit reminder")} aria-label={trTemplate(["Edit ", ""], [item.title])} disabled={busy} onClick={() => {
            setFields({
              ...empty,
              ...item,
              targetMileage: item.targetMileage ?? '',
              currentMileage: item.currentMileage ?? ''
            });
            setEditing(item.id);
            setFormOpen(true);
            setError('');
          }}><Pencil size={17} /></button>
      <button type="button" className="history-icon" title={tr("Delete reminder")} aria-label={trTemplate(["Delete ", ""], [item.title])} disabled={busy} onClick={() => {
            setRemoval(item);
            setError('');
            dialog.current.showModal();
          }}><Trash2 size={17} /></button></div>
    </article>)}</div>
    {items.some(item => item.completedAt) && <label className="history-checkbox"><input type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} />{tr("Show completed reminders")}</label>}
    {error && <p className="auth-error" role="alert">{tr(error)}</p>}{message && <p className="customer-save-status" role="status">{tr(message)}</p>}
    <dialog ref={dialog} className="auth-policy" aria-labelledby="delete-reminder-title" onCancel={event => {
      if (busy) event.preventDefault();
    }}><h2 id="delete-reminder-title">{tr("Delete reminder?")}</h2><p>{tr("Remove")} {removal?.title} {tr("? This cannot be undone.")}</p>{error && <p className="auth-error" role="alert">{tr(error)}</p>}<div className="customer-remove-actions"><button className="auth-secondary" type="button" disabled={busy} onClick={() => dialog.current.close()}>{tr("Keep reminder")}</button><button className="auth-primary" type="button" disabled={busy} onClick={remove}>{busy ? tr("Deleting...") : tr("Delete reminder")}</button></div></dialog>
  </section>;
}
