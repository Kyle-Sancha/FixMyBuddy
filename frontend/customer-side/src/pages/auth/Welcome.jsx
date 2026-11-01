import { tr } from "../../i18n/translations";
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, LocateFixed, LoaderCircle, MapPin, Navigation, ReceiptText, ShieldCheck, Wrench, Truck, Bike, CarFront, ChevronDown, Sun, Moon, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { useLocale } from '../../context/useLocale';
import { useTheme } from '../../context/useTheme';
import { lookupAddress } from '../../services/locationService';
import { hasStreetAddress, validCoordinates } from '../../utils/locationAddress';
import { BrandLogo } from '../../components/BrandLogo';
const LocationPicker = lazy(() => import('../../components/customer/LocationPicker').then(module => ({ default: module.LocationPicker })));
export function PickupPreview({
  onLocate,
  locating = false,
  compact = false
}) {
  const {
    location, setLocation
  } = useApp();
  const { t } = useLocale();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finding, setFinding] = useState(false);
  const hasLocation = validCoordinates(location);
  const needsAddress = hasLocation && !hasStreetAddress(location.address);
  useEffect(() => {
    if (!needsAddress) return;
    let active = true;
    setFinding(true);
    const point = { latitude: location.latitude, longitude: location.longitude };
    lookupAddress(point).then(address => {
      if (active) setLocation(current => current.latitude === point.latitude && current.longitude === point.longitude && !hasStreetAddress(current.address) ? { ...current, address } : current);
    }).catch(() => {}).finally(() => { if (active) setFinding(false); });
    return () => { active = false; };
  }, [needsAddress, location.latitude, location.longitude, setLocation]);
  const bounds = hasLocation ? [location.longitude - 0.002, location.latitude - 0.002, location.longitude + 0.002, location.latitude + 0.002].join(',') : '';
  return <figure className="landing-map">
      <div className="landing-map-canvas">
        {hasLocation ? <iframe title={tr("Your selected pickup location")} tabIndex={-1} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik&marker=${location.latitude},${location.longitude}`} loading="lazy" referrerPolicy="no-referrer" /> : <div className="landing-map-art" role="img" aria-label={tr("Illustrative street map. No pickup location or provider has been selected.")}>
            <span className="map-park map-park-one" />
            <span className="map-park map-park-two" />
            <span className="map-block map-block-one" />
            <span className="map-block map-block-two" />
            <span className="map-road map-road-one" />
            <span className="map-road map-road-two" />
            <span className="map-road map-road-three" />
            <span className="map-road map-road-four" />
            <span className="map-river" />
            <span className="map-illustration-label">{tr("Map illustration")}</span>
            <span className="map-location-symbol">
              <MapPin size={25} />
            </span>
          </div>}
        <button type="button" className="landing-map-open" onClick={() => setPickerOpen(true)} aria-label={t('Open full-screen pickup map','Buksan ang buong pickup map')}><span><MapPin size={17} />{t('Tap to adjust pin','Pindutin para baguhin ang pin')}</span></button>
        {onLocate && <button type="button" className="customer-map-locate" onClick={onLocate} disabled={locating} aria-label={tr("Use my current location")} title={tr("Use my current location")}>
            {locating ? <LoaderCircle size={21} className="auth-spin" /> : <LocateFixed size={21} />}
          </button>}
      </div>
      {hasLocation && <div className="landing-map-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></div>}
      {hasLocation && <div className="landing-map-address" aria-live="polite"><strong>{t('Your pickup address','Pickup address mo')}</strong><p>{finding && needsAddress ? t('Finding address...','Hinahanap ang address...') : hasStreetAddress(location.address) ? location.address : t('Address unavailable. Tap the map to enter your address.','Hindi makuha ang address. Pindutin ang mapa para ilagay ang address.')}</p></div>}
      {pickerOpen && <Suspense fallback={<p role="status">{t('Opening map...','Binubuksan ang mapa...')}</p>}><LocationPicker onClose={() => setPickerOpen(false)} /></Suspense>}
      {!compact && <figcaption>
          <Navigation size={15} />
          <span>
            {hasLocation ? tr("Your selected location. Change it before booking.") : tr("Set your pickup location when you request help.")}
          </span>
        </figcaption>}
    </figure>;
}
export function Welcome() {
  const { t } = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const [service, setService] = useState('mechanic');
  const page = useRef(null);
  const providerPortal = import.meta.env.VITE_PROVIDER_PORTAL_URL;
  useEffect(() => { document.title = 'FixMyBuddy | Your roadside buddy'; window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const root = page.current;
    if (!root || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('welcome-motion-ready');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }, { threshold: .06, rootMargin: '0px 0px -16px 0px' });
    root.querySelectorAll('.welcome-reveal').forEach(element => observer.observe(element));
    return () => { observer.disconnect(); root.classList.remove('welcome-motion-ready'); };
  }, []);
  const towing = service === 'towing';
  const steps = towing ? [
    [t('Choose your pickup & destination','Piliin ang pickup at destinasyon'), t('Enter an address or look for a nearby repair shop.','Maglagay ng address o maghanap ng malapit na talyer.')],
    [t('Find the right towing buddy','Hanapin ang tamang towing buddy'), t('Compare available providers and review the route estimate.','Ihambing ang mga provider at suriin ang tantiya para sa ruta.')],
    [t('Review. Confirm. Keep in touch.','Suriin. Kumpirmahin. Makipag-ugnayan.'), t('Follow provider updates and confirm your vehicle handover.','Subaybayan ang mga update at kumpirmahin ang pagtanggap ng sasakyan.')]
  ] : [
    [t('Tell us what stopped your ride','Sabihin ang problema sa sasakyan'), t('Flat tire, battery trouble, or something else? Start with what you know.','Flat tire, baterya, o iba pa? Ilarawan ang alam mong problema.')],
    [t('Choose your roadside buddy','Piliin ang iyong roadside buddy'), t('Compare providers yourself or ask the system for a match.','Ikaw ang pumili ng provider o magpatulong sa system.')],
    [t('Know the cost. Make the call.','Alamin ang gastos. Ikaw ang magpasya.'), t('Review the estimate before booking. Repairs need your approval.','Suriin ang tantiya bago mag-book. Kailangan ang pag-apruba mo sa pagkukumpuni.')]
  ];
  return <main className="auth-root welcome-page" ref={page}>
    <a className="auth-skip" href="#welcome-main">{t('Skip to content','Pumunta sa nilalaman')}</a>
    <header className="welcome-header welcome-wrap">
      <Link className="auth-brand" to="/" aria-label="FixMyBuddy home" onClick={() => window.scrollTo(0, 0)}><BrandLogo /><span>FixMyBuddy</span></Link>
      <nav aria-label={t('Main navigation','Pangunahing nabigasyon')}><a className="welcome-nav-guide" href="#how-it-works">{t('How it works','Paano ito gumagana')}</a><button className="welcome-theme" type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label={resolvedTheme === 'dark' ? t('Switch to light mode','Gawing maliwanag ang hitsura') : t('Switch to dark mode','Gawing madilim ang hitsura')}>{resolvedTheme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}</button><Link className="welcome-signin" to="/login">{t('Sign in','Mag-sign in')}</Link></nav>
    </header>

    <section className="welcome-hero welcome-wrap" id="welcome-main" tabIndex={-1} aria-labelledby="welcome-title">
      <div className="welcome-copy">
        <p className="welcome-eyebrow"><span />{t('YOUR ROADSIDE BUDDY','IYONG ROADSIDE BUDDY')}</p>
        <h1 id="welcome-title">{t('When your ride stops,','Kapag huminto ang biyahe,')}<em>{t('we get you moving.','tutulungan ka naming muli.')}</em></h1>
        <p className="welcome-intro">{t('Find a mechanic or a tow. See the estimate. Get back to the day you had planned.','Maghanap ng mekaniko o towing. Suriin ang tantiya. Ituloy ang araw na pinlano mo.')}</p>
        <div className="welcome-hero-actions"><Link className="auth-primary" to="/app">{t('Get roadside help','Humingi ng tulong sa daan')}<ArrowRight size={22} /></Link><a className="welcome-explore" href="#how-it-works">{t('See how it works','Alamin kung paano')}<ChevronDown size={19} /></a></div>
        <p className="welcome-hero-note"><ShieldCheck size={19} />{t('Review the estimate before you book.','Suriin muna ang tantiya bago mag-book.')}</p>
      </div>
      <figure className="welcome-visual"><img src="/images/roadside-photo-v2.webp" width="1672" height="941" fetchPriority="high" decoding="async" alt={t('Photorealistic promotional scene of a mechanic helping a motorcycle rider.','Makatotohanang larawang pang-promosyon ng mekanikong tumutulong sa rider.')} /><figcaption><span className="welcome-photo-icon"><Wrench size={22} /></span><span><strong>{t('A little backup.','May kakampi ka.')}<small>{t('For the road ahead.','Para sa susunod na biyahe.')}</small></strong></span></figcaption></figure>
    </section>

    <div className="welcome-audience"><div className="welcome-wrap"><p>{t('FOR THE RIDES YOU COUNT ON','PARA SA MGA BIYAHENG INAASAHAN MO')}</p><ul><li><Bike size={24} />{t('Motorcycles','Mga motorsiklo')}</li><li><CarFront size={24} />{t('Cars','Mga kotse')}</li><li><Navigation size={24} />{t('Everyday riders','Araw-araw na bumibiyahe')}</li></ul></div></div>

    <section className="welcome-section welcome-wrap welcome-problem" aria-labelledby="problem-title">
      <div className="welcome-section-intro welcome-reveal"><p className="welcome-eyebrow">{t('BREAKDOWNS ARE HARD ENOUGH','MAHIRAP NA NGA ANG MASIRAAN')}</p><h2 id="problem-title">{t('The last thing you need?','Ang ayaw mo pang isipin?')}<span>{t('More guesswork.','Dagdag na panghuhula.')}</span></h2><p>{t('Roadside trouble is stressful. Finding your next step shouldn’t be.','Nakaka-stress ang masiraan sa daan. Hindi dapat pahirapan ang susunod na hakbang.')}</p></div>
      <div className="welcome-pain-grid">{[
        [Wrench,t('Your ride won’t start.','Ayaw umandar ng sasakyan.'),t('Battery trouble, a flat tire, or a problem you can’t quite explain.','Baterya, flat tire, o problemang hindi mo maipaliwanag.')],
        [MessageCircle,t('Who do you even call?','Sino ang tatawagan mo?'),t('You need help for your vehicle, without the endless searching.','Kailangan mo ng tulong nang hindi nauubos ang oras sa paghahanap.')],
        [ReceiptText,t('And what will it cost?','Magkano kaya ang gastos?'),t('You want to understand the price before making a decision.','Gusto mong malinaw ang presyo bago magpasya.')]
      ].map(([Icon,title,copy]) => <article className="welcome-reveal" key={title}><span className="welcome-card-icon"><Icon size={24} /></span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="welcome-solution-band" aria-labelledby="solution-title"><div className="welcome-section welcome-wrap welcome-solution">
      <figure className="welcome-solution-photo welcome-reveal"><img src="/images/towing-photo-v2.webp" width="1448" height="1086" loading="lazy" decoding="async" alt={t('Photorealistic promotional scene of a car secured on a yellow flatbed tow truck.','Makatotohanang larawang pang-promosyon ng kotse sa dilaw na flatbed tow truck.')} /><figcaption>{t('Two wheels or four. You’ve got a buddy.','Dalawa o apat na gulong. May buddy ka.')}</figcaption></figure>
      <div className="welcome-section-intro welcome-reveal"><p className="welcome-eyebrow">{t('MEET FIXMYBUDDY','KILALANIN ANG FIXMYBUDDY')}</p><h2 id="solution-title">{t('Roadside trouble?','May aberya sa daan?')}<span>{t('You’ve got a buddy.','May buddy ka.')}</span></h2><p>{t('Mechanic or towing, in one place. Choose the help your ride needs, review the estimate, and stay in touch with your assigned provider.','Mekaniko o towing, sa iisang lugar. Piliin ang kailangan, suriin ang tantiya, at makipag-ugnayan sa nakatalagang provider.')}</p><Link className="welcome-text-link" to="/app">{t('Find your next step','Hanapin ang susunod mong hakbang')}<ArrowRight size={22} /></Link></div>
    </div></section>

    <section className="welcome-section welcome-wrap welcome-control" aria-labelledby="control-title">
      <div className="welcome-section-intro welcome-reveal"><p className="welcome-eyebrow">{t('LESS GUESSWORK. MORE CONTROL.','BAWAS HULA. MAS MAY KONTROL.')}</p><h2 id="control-title">{t('You’re still in','Ikaw pa rin')}<span>{t('the driver’s seat.','ang may kontrol.')}</span></h2></div>
      <div className="welcome-promises">{[
        [ReceiptText,t('See the estimate first','Makita muna ang tantiya'),t('Review the breakdown before you book. Extra repairs need a separate yes from you.','Suriin ang gastos bago mag-book. Kailangan ang hiwalay mong pag-apruba sa dagdag na pagkukumpuni.')],
        [MessageCircle,t('Stay in the conversation','Manatiling kausap'),t('Contact your assigned provider and check the service updates they share.','Makipag-ugnayan sa nakatalagang provider at tingnan ang mga update nila.')],
        [ShieldCheck,t('Share on your terms','Ikaw ang magpapasya sa pagbabahagi'),t('Choose whether to share each booking with your saved emergency contact.','Ikaw ang pumili kung ibabahagi ang bawat booking sa emergency contact.')]
      ].map(([Icon,title,copy]) => <article className="welcome-reveal" key={title}><span className="welcome-card-icon"><Icon size={25} /></span><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="welcome-guide-band" id="how-it-works" aria-labelledby="discover-title"><div className="welcome-section welcome-wrap">
      <div className="welcome-section-intro welcome-reveal"><p className="welcome-eyebrow">{t('FROM “OH NO” TO “LET’S GO”','MULA SA ABERYA, TULOY ANG BIYAHE')}</p><h2 id="discover-title">{t('Three steps to','Tatlong hakbang')}<span>{t('your next move.','para makapagpatuloy.')}</span></h2><p>{t('Pick a service. See your next steps.','Pumili ng serbisyo. Alamin ang mga susunod na hakbang.')}</p></div>
      <div className="welcome-service-switch" role="group" aria-label={t('Explore a service','Alamin ang isang serbisyo')}><button type="button" aria-pressed={!towing} onClick={() => setService('mechanic')}><Wrench size={23} />{t('A mechanic','Mekaniko')}</button><button type="button" aria-pressed={towing} onClick={() => setService('towing')}><Truck size={23} />{t('A tow','Towing')}</button></div>
      <div className="welcome-service-story" key={service}><h3>{towing ? t('Let’s get your ride somewhere better.','Dalhin natin ang sasakyan sa mas maayos na lugar.') : t('Help for the ride you’re counting on.','Tulong para sa sasakyang inaasahan mo.')}</h3><ol>{steps.map(([title,description],index) => <li key={title}><span className="welcome-step" aria-hidden="true">0{index + 1}</span><div><h4>{title}</h4><p>{description}</p></div></li>)}</ol><Link className="welcome-text-link" to={towing ? '/request/towing' : '/request?service=mechanic'}>{towing ? t('Start a towing request','Magsimula ng towing request') : t('Start a mechanic request','Magsimula ng mechanic request')}<ArrowRight size={22} /></Link><p className="welcome-small">{t('Exploring won’t book a service or charge you. Provider availability is checked when you search.','Walang booking o bayad sa pagtingin lamang. Sinusuri ang availability kapag naghanap ka.')}</p></div>
    </div></section>

    <section className="welcome-section welcome-wrap welcome-faq" aria-labelledby="faq-title"><div className="welcome-section-intro welcome-reveal"><p className="welcome-eyebrow">{t('GOOD QUESTIONS. CLEAR ANSWERS.','MGA TANONG. MALINAW NA SAGOT.')}</p><h2 id="faq-title">{t('Before you','Bago ka')}<span>{t('hit the road.','magpatuloy.')}</span></h2></div><div className="welcome-faq-list">{[
      [t('Can I use it for my motorcycle?','Pwede ba ito sa motorsiklo?'),t('Yes. You can add a motorcycle or a car to your vehicles and select the one that needs help.','Oo. Maaari kang magdagdag ng motorsiklo o kotse at piliin ang nangangailangan ng tulong.')],
      [t('Do I have to know what’s wrong?','Kailangan ko bang alam ang sira?'),t('Choose the closest issue and describe what happened. The mechanic supplies the diagnosis and repair quote.','Piliin ang pinakamalapit na problema at ilarawan ang nangyari. Ang mekaniko ang magbibigay ng diagnosis at quote.')],
      [t('Can I choose where my vehicle is towed?','Pwede bang ako ang pumili ng destinasyon?'),t('Yes. Enter your destination or use repair-shop search when that service is available. Review the route with your towing provider.','Oo. Ilagay ang destinasyon o maghanap ng talyer kapag available ang serbisyo. Suriin ang ruta kasama ang towing provider.')]
    ].map(([question,answer]) => <details key={question}><summary>{question}<ChevronDown size={21} /></summary><p>{answer}</p></details>)}</div></section>

    <div className="welcome-wrap"><section className="welcome-last-call welcome-reveal"><span className="welcome-cta-mark" aria-hidden="true"><Wrench size={48} /></span><div><p className="welcome-eyebrow">{t('FOR WHATEVER THE ROAD HAS PLANNED.','ANUMAN ANG DALHIN NG DAAN.')}</p><h2>{t('Meet your new','Kilalanin ang bago mong')}<br />{t('roadside buddy.','roadside buddy.')}</h2></div><div className="welcome-final-actions"><Link to="/signup">{t('Let’s get you ready','Maghanda na tayo')}<ArrowRight size={23} /></Link><Link className="welcome-browse" to="/app">{t('Or take a look around first','O tingnan muna ang app')}</Link></div></section></div>
    <footer className="welcome-footer welcome-wrap"><div><Link className="auth-brand" to="/" onClick={() => window.scrollTo(0, 0)}><BrandLogo />FixMyBuddy</Link><p>{t('When your ride stops, we get you moving.','Kapag huminto ang biyahe, tutulungan ka naming muli.')}</p></div><nav aria-label={t('Footer navigation','Mga link sa ibaba')}><a href="#how-it-works">{t('How it works','Paano ito gumagana')}</a><Link to="/login">{t('Sign in','Mag-sign in')}</Link><Link to="/help">{t('Help & support','Tulong at suporta')}</Link>{providerPortal && <a href={providerPortal}>{t('Join FixMyBuddy Pro','Sumali sa FixMyBuddy Pro')}</a>}<Link to="/terms">{t('Terms','Mga Tuntunin')}</Link><Link to="/privacy">{t('Privacy','Privacy')}</Link></nav></footer>
  </main>;
}
