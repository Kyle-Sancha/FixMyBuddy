import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Phone, Mail, ShieldAlert, CalendarDays, Wallet, ShieldCheck, ChevronRight, FileWarning } from 'lucide-react';
import { CustomerHeading } from '../components/customer/CustomerHeading';
import { useLocale } from '../context/useLocale';
import { useAuth } from '../context/useAuth';
import { accountApiConfigured, accountService } from '../services/accountService';
export function HelpCenter() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [config, setConfig] = useState(null), [cases, setCases] = useState([]);
  const contactDialog = useRef(null);
  useEffect(() => {
    if (!accountApiConfigured) return;
    const controller = new AbortController();
    accountService.config(controller.signal).then(setConfig).catch(() => {});
    if (user) accountService.disputes(controller.signal).then(setCases).catch(() => {});
    return () => controller.abort();
  }, [user]);
  const topics = [
    [CalendarDays, t('Bookings & cancellation','Booking at pagkansela'), t('Open History, select a booking, and review its actual terms. Cancellation or rescheduling is available only if the server permits it before dispatch.','Buksan ang History, piliin ang booking, at basahin ang mga tuntunin nito. Maaari lang magkansela o magpalit ng oras kung pinapayagan ng server bago ma-dispatch.')],
    [Wallet, t('Payments & receipts','Bayad at mga resibo'), t('Use only the QR supplied for your booking. A payment report stays unverified until the provider confirms receipt. Receipts become available after verified payment. Refund decisions depend on the actual booking terms and review.','Gamitin lang ang QR para sa iyong booking. Hindi pa verified ang na-report na bayad hangga’t hindi kinukumpirma ng provider. Makukuha ang resibo pagkatapos nito. Nakabatay sa aktuwal na tuntunin at pagsusuri ang refund.')],
    [ShieldCheck, t('Repair warranty','Warranty ng pagkukumpuni'), t('Warranty depends on your provider and the actual repair agreement. Review your booking documents or raise a concern. No standard coverage period is assumed.','Nakabatay ang warranty sa provider at kasunduan sa pagkukumpuni. Suriin ang mga dokumento ng booking o magsumite ng concern. Walang awtomatikong panahon ng coverage.')],
  ];
  return <>
    <CustomerHeading title={t('A buddy for the bumps','Kasama sa aberya')} backTo="/account">{t('Help with bookings, payments and repairs.','Tulong sa booking, bayad at pagkukumpuni.')}</CustomerHeading>
    <div className="help-actions"><Link to="/help/chat" className="auth-primary"><Headphones size={21} />{t('Chat with support','Makipag-chat sa suporta')}</Link><button type="button" className="auth-secondary" onClick={() => contactDialog.current.showModal()}><Phone size={21} />{t('Contact support · Call or email','Kontakin ang suporta · Tawag o email')}</button></div>
    <div className="request-safety"><ShieldAlert size={21} /><p>{t('Stay clear of moving traffic. If you are in immediate danger, contact local emergency services. FixMyBuddy is not an emergency rescue service.','Lumayo sa dumaraang mga sasakyan. Kung nasa agarang panganib, tumawag sa lokal na emergency services. Hindi emergency rescue service ang FixMyBuddy.')}</p></div>
    <section className="help-topics"><h2>{t('Help topics','Mga paksa ng tulong')}</h2>{topics.map(([Icon,title,answer]) => <details key={title}><summary><Icon size={20} /><span>{title}</span><ChevronRight size={18} /></summary><p>{answer}</p></details>)}</section>
    <Link className="help-concern-link" to="/help/disputes"><FileWarning size={23} /><span><strong>{t('My concerns & disputes','Aking mga concern at dispute')}</strong><small>{t('Submit evidence or check the status of a booking concern.','Magsumite ng ebidensya o tingnan ang estado ng concern sa booking.')}</small></span><ChevronRight size={18} /></Link>
    {cases.filter(item => !['resolved','closed'].includes(item.status)).slice(0,3).map(item => <Link key={item.id} className="help-case-link" to={`/help/disputes?case=${encodeURIComponent(item.id)}`}><strong>{item.subject}</strong><span>{item.reference || item.id} · {item.status.replaceAll('_',' ')}</span></Link>)}
    <dialog ref={contactDialog} className="auth-policy" aria-labelledby="support-contact-title"><h2 id="support-contact-title">{t('Contact support','Kontakin ang suporta')}</h2>
      {config?.phone && <a className="auth-secondary" href={`tel:${config.phone.replace(/[ ()-]/g,'')}`}><Phone size={18} />{config.phone}</a>}
      {config?.email && <a className="auth-secondary" href={`mailto:${encodeURIComponent(config.email)}`}><Mail size={18} />{config.email}</a>}
      {!config?.phone && !config?.email && <p>{t('Support contact details have not been connected yet. No phone number or email is prefilled.','Hindi pa nakakonekta ang mga contact ng suporta. Walang nakapirming numero o email.')}</p>}
      <button className="auth-primary" type="button" onClick={() => contactDialog.current.close()}>{t('Close','Isara')}</button>
    </dialog>
  </>;
}

