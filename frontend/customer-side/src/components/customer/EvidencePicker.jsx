import { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { ACCEPTED_MEDIA, MAX_ATTACHMENTS, validateAttachment } from '../../utils/attachmentValidation';
import { useLocale } from '../../context/useLocale';
function EvidencePreview({ file, remove, disabled }) {
  const { t } = useLocale();
  const [url, setUrl] = useState(''), [failed, setFailed] = useState(false);
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  return <figure className="request-media">{failed ? <div className="request-media-fallback">{t('Preview unavailable','Hindi maipakita ang preview')}</div> : file.type.startsWith('video/') ? <video src={url} controls playsInline preload="metadata" onError={() => setFailed(true)} /> : <img src={url} alt={file.name} onError={() => setFailed(true)} />}<figcaption>{file.name}</figcaption><button type="button" disabled={disabled} title={t('Remove file','Alisin ang file')} aria-label={`${t('Remove','Alisin')} ${file.name}`} onClick={remove}><X size={17} /></button></figure>;
}
export function EvidencePicker({ files, setFiles, disabled }) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  function add(event) {
    const next = [...files], errors = [];
    for (const file of Array.from(event.target.files || [])) {
      const problem = validateAttachment(file);
      if (problem) errors.push(`${file.name}: ${problem}`);
      else if (next.length >= MAX_ATTACHMENTS) errors.push(t('You can attach up to 10 files.','Hanggang 10 file lang ang maaaring ilakip.'));
      else if (next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) errors.push(t('This file is already attached.','Nakalakip na ang file na ito.'));
      else next.push(file);
    }
    setFiles(next); setError([...new Set(errors)].join(' ')); event.target.value = '';
  }
  return <div className="evidence-picker"><h3>{t('Evidence','Ebidensya')} <small>{files.length} / 10</small></h3><div className="request-media-grid">{files.map((file,index) => <EvidencePreview key={`${file.name}-${file.size}-${file.lastModified}`} file={file} disabled={disabled} remove={() => { setFiles(current => current.filter((_,i) => i !== index)); setError(''); }} />)}{files.length < MAX_ATTACHMENTS && <label className="request-add-media"><Camera size={24} /><span>{t('Add photos or videos','Magdagdag ng larawan o video')}</span><input disabled={disabled} className="sr-only" type="file" multiple accept={ACCEPTED_MEDIA} onChange={add} /></label>}</div><p className="auth-hint">{t('Optional. 10 files total; photos up to 20 MB each, videos up to 100 MB each. Selected files are not uploaded until you submit.','Opsyonal. Hanggang 10 file; 20 MB bawat larawan, 100 MB bawat video. Maa-upload lang ang napiling file kapag nagsumite ka.')}</p>{error && <p className="auth-error" role="alert">{error}</p>}</div>;
}

