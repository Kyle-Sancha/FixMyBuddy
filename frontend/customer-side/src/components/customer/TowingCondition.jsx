import { useLocale } from '../../context/useLocale';
export function TowingCondition({ value = {}, onChange }) {
  const { t } = useLocale();
  return <fieldset className="request-issues towing-condition"><legend>{t('Vehicle condition','Kondisyon ng sasakyan')}</legend>{[['starts','Does it start/run?','Umaandar ba ang makina?'],['rolls','Does it roll freely?','Malayang gumugulong ba ang sasakyan?'],['collision','Is there collision damage?','May pinsala mula sa banggaan?']].map(([key,en,fil]) => <label key={key} className="request-field">{t(en,fil)}<select required value={value[key] || ''} onChange={event => onChange({ ...value, [key]: event.target.value })}><option value="">{t('Choose an answer','Pumili ng sagot')}</option><option value="yes">{t('Yes','Oo')}</option><option value="no">{t('No','Hindi')}</option><option value="unknown">{t('Not sure','Hindi sigurado')}</option></select></label>)}</fieldset>;
}

