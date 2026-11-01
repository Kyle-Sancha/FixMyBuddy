import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { PolicyDocument } from '../components/PolicyDocument';
import { useLocale } from '../context/useLocale';
import { policies } from '../content/policies';

export function PolicyPage({ kind }) {
  const { t, language } = useLocale();
  const title = policies[kind].title[language === 'fil' ? 1 : 0];
  useEffect(() => { document.title = `${title} | FixMyBuddy`; window.scrollTo(0, 0); }, [title]);
  return <main className="auth-root policy-page"><header><Link to="/" className="auth-brand"><BrandLogo />FixMyBuddy</Link><Link to="/" className="policy-back"><ArrowLeft size={20} />{t('Back to home','Bumalik sa home')}</Link></header><h1>{title}</h1><PolicyDocument key={kind} kind={kind} /><footer><Link to={kind === 'terms' ? '/privacy' : '/terms'}>{kind === 'terms' ? t('Privacy Policy','Patakaran sa Privacy') : t('Terms of Use','Mga Tuntunin sa Paggamit')}</Link><Link to="/help">{t('Help & support','Tulong at suporta')}</Link></footer></main>;
}
