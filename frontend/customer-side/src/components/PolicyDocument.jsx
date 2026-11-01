import { useState } from 'react';
import { policies } from '../content/policies';
import { useLocale } from '../context/useLocale';

export function PolicyDocument({ kind }) {
  const { language: currentLanguage } = useLocale();
  const [language, setLanguage] = useState(currentLanguage);
  const fil = language === 'fil';
  const policy = policies[kind];
  return <article className="policy-document" lang={language}>
    <div className="policy-draft" role="note"><strong>{fil ? 'Draft para sa pagsusuri — hindi pa epektibo' : 'Draft for review — not yet effective'}</strong><p>{fil ? 'Operator: FixMyBuddy. Kailangan pang kumpirmahin ang contact email, retention periods, at pinal na patakaran bago ilunsad.' : 'Operator: FixMyBuddy. Contact email, retention periods, and final policies must be confirmed before launch.'}</p></div>
    <label className="policy-language">{fil ? 'Wika ng dokumento' : 'Document language'}<select value={language} onChange={event => setLanguage(event.target.value)}><option value="en">English</option><option value="fil">Filipino</option></select></label>
    <nav className="policy-contents" aria-label={fil ? 'Mga bahagi ng dokumento' : 'Document contents'}>{policy.sections.map((section, index) => <a key={index} href={`#${kind}-section-${index}`}>{index + 1}. {section[fil ? 1 : 0]}</a>)}</nav>
    {policy.sections.map((section, index) => <section key={index} id={`${kind}-section-${index}`}><h3>{index + 1}. {section[fil ? 1 : 0]}</h3><p>{section[fil ? 3 : 2]}</p></section>)}
    {kind === 'privacy' && <p className="policy-sources">{fil ? 'Sanggunian sa mga karapatan:' : 'Privacy rights reference:'} <a href="https://privacy.gov.ph/data-subject-rights/" target="_blank" rel="noreferrer">National Privacy Commission</a></p>}
  </article>;
}
