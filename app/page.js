'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import wedding from '@/wedding.config';

const sparkles = Array.from({ length: 25 });

const TZ = 'Asia/Kolkata';

const longDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(new Date(iso));

const shortDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date(iso));

const numericDate = (iso) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ,
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('day')} . ${get('month')} . ${get('year')}`;
};

// Calendar files are UTC ("Z") and need escaped text values (RFC 5545)
const icsStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
const icsText = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

const { couple } = wedding;
const people = couple.order === 'bride-first' ? [couple.bride, couple.groom] : [couple.groom, couple.bride];
const coupleLabel = `${people[0].shortName} & ${people[1].shortName}`;
const coupleWeds = `${people[0].shortName} weds ${people[1].shortName}`;
const weddingTime = new Date(wedding.weddingDate).getTime();

function PersonCard({ person }) {
  return (
    <div className="flex-1 border border-gold/20 bg-white/[0.03] backdrop-blur-md p-8 rounded-xl shadow-lg hover:border-gold/50 transition-all flex flex-col items-center relative">
      <div className="absolute top-0 left-6 -translate-y-1/2 bg-gold text-primary-bg font-bold text-[10px] tracking-widest px-4 py-1 rounded-sm">
        {person.role}
      </div>
      <div className="w-24 h-24 rounded-full border-2 border-gold/50 flex justify-center items-center bg-secondary-bg text-gold-light text-2xl font-serif mb-6 shadow-md">
        {person.initials}
      </div>
      <h3 className="font-serif text-xl md:text-2xl text-white tracking-widest mb-4 font-semibold">
        {person.name.toUpperCase()}
      </h3>
      <div className="text-center text-xs md:text-sm text-text-muted leading-relaxed space-y-2 font-semibold">
        {person.details.map((detail) => (
          <p key={detail.label}>
            <strong className="text-gold-light">{detail.label}:</strong> {detail.value}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [guestName, setGuestName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDay, setActiveDay] = useState(
    (wedding.functions.find((fn) => fn.highlight) || wedding.functions[0])?.id
  );
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(weddingTime < Date.now());
  const [rsvpStatus, setRsvpStatus] = useState('yes');
  const [guestCount, setGuestCount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [wishes, setWishes] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const audioRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('wedding_guest_name');
      const savedSubmitted = localStorage.getItem('wedding_submitted');
      if (savedSubmitted === 'true' && savedName) {
        setGuestName(savedName);
        setIsSubmitted(true);

        const tryPlay = () => {
          if (audioRef.current) {
            audioRef.current.volume = 0.2;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              window.removeEventListener('click', tryPlay);
            }).catch(err => {
              console.log('Autoplay deferred to click:', err);
            });
          }
        };

        setTimeout(tryPlay, 100);
        window.addEventListener('click', tryPlay);
        return () => {
          window.removeEventListener('click', tryPlay);
        };
      }
    }
  }, []);

  useEffect(() => {
    fetchWishes();

    const timer = setInterval(() => {
      const distance = weddingTime - Date.now();

      if (distance < 0) {
        setIsPast(true);
        clearInterval(timer);
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pause audio when switching tabs, resume when active (if it was playing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
        }
      } else {
        if (audioRef.current && isPlaying) {
          audioRef.current.play().catch(err => console.log('Audio resume blocked:', err));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  const fetchWishes = async () => {
    try {
      const res = await fetch('/api/rsvp');
      const data = await res.json();
      if (data.success) {
        setWishes(Array.isArray(data.wishes) ? data.wishes : []);
      }
    } catch {
      // DB unreachable: keep whatever is already on screen
    }
  };

  const handleGatekeeperSubmit = (e) => {
    e.preventDefault();
    if (guestName.trim()) {
      localStorage.setItem('wedding_guest_name', guestName.trim());
      localStorage.setItem('wedding_submitted', 'true');
      setIsSubmitted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0.2; // Keep it low and pleasant
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.log('Audio autoplay blocked:', err));
      }
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2; // Keep it low and pleasant
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.log(err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpMessage.trim()) return;

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guestName || 'Guest',
          status: rsvpStatus,
          guestCount: rsvpStatus === 'yes' ? guestCount : 0,
          message: rsvpMessage,
          website: honeypot
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('आपकी शुभकामनाएँ सफलतापूर्वक दर्ज की गईं!');
        setShowToast(true);
        setRsvpMessage('');
        setHoneypot('');
        fetchWishes(); // Refresh Blessings Wall
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(data.error || 'कुछ गलत हुआ, कृपया पुन: प्रयास करें।');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch {
      setToastMessage('सर्वर एरर। कृपया पुन: प्रयास करें।');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const downloadCalendar = () => {
    const eventDetails =
      `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${icsText(wedding.calendar.summary)}//NONSGML v1.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${Date.now()}@${wedding.calendar.uidDomain}
DTSTAMP:${icsStamp(new Date().toISOString())}
DTSTART:${icsStamp(wedding.calendar.start)}
DTEND:${icsStamp(wedding.calendar.end)}
SUMMARY:${icsText(wedding.calendar.summary)}
DESCRIPTION:${icsText(wedding.calendar.description)}
LOCATION:${icsText(wedding.calendar.location)}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([eventDetails], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', wedding.calendar.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFunction =
    wedding.functions.find((fn) => fn.id === activeDay) || wedding.functions[0];

  return (
    <main className="min-h-screen bg-primary-bg text-text-main flex flex-col items-center relative overflow-hidden">
      {/* Background Floating Gold Sparkles */}
      {sparkles.map((_, i) => (
        <div
          key={i}
          className="gold-sparkle pointer-events-none"
          style={{
            left: `${(i * 7.3) % 100}%`,
            animationDelay: `${(i * 0.47) % 10}s`,
            animationDuration: `${8 + (i * 0.53) % 8}s`,
            transform: `scale(${0.3 + (i * 0.07) % 0.8})`
          }}
        />
      ))}

      {/* Background Music */}
      <audio ref={audioRef} loop>
        {wedding.music.map((src) => (
          <source key={src} src={src} type="audio/mpeg" />
        ))}
      </audio>

      {/* Floating Audio Controller */}
      {isSubmitted && (
        <button
          onClick={toggleMusic}
          aria-label={isPlaying ? 'Mute background music' : 'Play background music'}
          className="fixed bottom-6 right-6 z-50 bg-secondary-bg/90 border border-gold rounded-full p-3 sm:px-5 sm:py-3 flex items-center gap-3 text-gold-light hover:text-white hover:border-white transition-all shadow-lg backdrop-blur-md text-xs font-semibold tracking-widest"
        >
          <div className="flex items-end gap-[3px] h-3">
            <span className={`w-[2px] bg-gold rounded-sm transition-all duration-300 ${isPlaying ? 'h-3 animate-[pulse_0.8s_infinite]' : 'h-1'}`}></span>
            <span className={`w-[2px] bg-gold rounded-sm transition-all duration-300 ${isPlaying ? 'h-4 animate-[pulse_1s_infinite_0.2s]' : 'h-1'}`}></span>
            <span className={`w-[2px] bg-gold rounded-sm transition-all duration-300 ${isPlaying ? 'h-3 animate-[pulse_0.9s_infinite_0.4s]' : 'h-1'}`}></span>
          </div>
          <span className="hidden sm:inline">{isPlaying ? 'MUTE MUSIC' : 'PLAY MUSIC'}</span>
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* GATEKEEPER SCREEN */}
        {!isSubmitted ? (
          <motion.div
            key="gatekeeper"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="w-full h-[100svh] relative overflow-y-auto gatekeeper-bg flex flex-col items-center"
          >
            {/* Dark premium overlay for readability */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none z-0"></div>

            {/* Content Container — sits near the bottom, below Lord Ganesha & temple arch */}
            <div className="relative z-10 text-center flex flex-col items-center w-full px-4 select-none font-montserrat mt-[48vh] md:mt-[45vh] pb-6 gap-2 md:gap-3">

              {/* Names Section */}
              <div className="flex flex-col items-center">
                <h1 style={{fontSize: 'clamp(1.3rem, 4vw, 2.6rem)'}} className="font-cormorant font-light text-white leading-tight tracking-wide text-shadow-gold select-none">
                  {people[0].shortName} <span className="text-gold">&amp;</span> {people[1].shortName}
                </h1>
              </div>

              {/* Subtitle Section */}
              <div className="flex flex-col items-center gap-1 w-full max-w-xs">
                <h2 className="font-cinzel text-[9px] sm:text-[10px] md:text-xs tracking-[0.4em] text-gold-light font-bold">{wedding.eventLabel}</h2>
                <div className="w-[120px] sm:w-[150px] h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent my-1.5"></div>
                <div className="text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.25em] text-white/75 font-medium">{wedding.dateRangeLabel}</div>
              </div>

              {/* Form Section */}
              <form onSubmit={handleGatekeeperSubmit} className="flex flex-col gap-2 w-full max-w-[260px] sm:max-w-[280px] md:max-w-[320px] mt-3 sm:mt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="अपना पूरा नाम लिखें / Enter Full Name"
                    required
                    className="w-full bg-[#180406]/75 border border-gold/40 py-2 px-4 rounded-full text-center text-white placeholder-gold-light/40 tracking-wider outline-none focus:border-gold-light transition-all text-[10px] md:text-[11px] font-semibold focus:placeholder-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] font-montserrat"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ffe596] via-[#d4af37] to-[#aa7c11] text-primary-bg font-extrabold py-2 px-4 rounded-full text-[9px] md:text-[10px] tracking-[0.2em] shadow-[0_6px_16px_rgba(212,175,55,0.25)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 uppercase flex items-center justify-between font-montserrat"
                >
                  <span className="text-primary-bg/70">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                      <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" />
                    </svg>
                  </span>
                  <span className="flex-1 text-center font-black">OPEN INVITATION</span>
                  <span className="font-bold text-xs">→</span>
                </button>
              </form>

              {/* Bottom Quote */}
              <div className="text-[7px] sm:text-[8px] tracking-[0.25em] text-white/25 font-semibold uppercase mt-3">
                A CELEBRATION OF LOVE, FAMILY & TRADITION
              </div>

            </div>
          </motion.div>
        ) : (
          /* MAIN INVITATION CARD WEBSITE */
          <motion.div
            key="invitation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full flex flex-col items-center"
          >
            {/* HERO SECTION */}
            <section className="min-h-screen w-full flex flex-col justify-center items-center text-center px-4 relative pt-64 pb-16 hero-bg">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,55,0.04),transparent_60%)] pointer-events-none"></div>

              <div className="font-devanagari text-gold-light text-lg font-semibold tracking-wider mb-4 animate-[pulse_3s_infinite_alternate]">
                ॥ श्री गणेशाय नमः ॥
              </div>

              {/* Shlokas */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-3xl w-full mb-10 text-xs md:text-sm text-text-muted/90 leading-relaxed font-devanagari px-4 ">
                <div className="flex-1 md:text-right md:border-r border-gold/25 md:pr-6 font-semibold">
                  &ldquo;मङ्गलम् भगवान विष्णुः, मङ्गलम् गरुडध्वजः।<br />
                  मङ्गलम् पुण्डरी काक्षः, मङ्गलाय तनो हरीः॥&rdquo;
                </div>
                <div className="text-3xl animate-[bounce_4s_infinite]">🪔</div>
                <div className="flex-1 md:text-left md:border-l border-gold/25 md:pl-6 font-semibold">
                  &ldquo;वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।<br />
                  निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥&rdquo;
                </div>
              </div>

              <div className="text-gold text-xs tracking-[0.3em] font-bold mb-2">{numericDate(wedding.weddingDate)}</div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-wide mb-4 leading-tight">
                {people[0].shortName} <span className="font-sans text-gold">&amp;</span> {people[1].shortName}
              </h1>

              <div className="max-w-xl mx-auto mb-5 flex flex-col items-center">
                <p className="font-serif text-xl md:text-2xl italic text-gold-light mb-3">Dear {guestName},</p>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed font-semibold mb-4">
                  {wedding.invitation.paragraph1.replace('{couple}', coupleLabel)}<br /><br />
                  {wedding.invitation.paragraph2}
                </p>
                <a
                  href={wedding.invitation.pdf}
                  download={wedding.invitation.pdfFilename}
                  className="text-[10px] font-bold bg-gold text-primary-bg py-2.5 px-6 rounded-full hover:bg-white hover:text-primary-bg transition-all shadow-md tracking-[0.2em] uppercase no-print inline-block"
                >
                  ✉️ Download PDF Invitation
                </a>
              </div>

              <div className="animate-bounce mt-2 no-print">
                <div className="text-[10px] tracking-widest text-gold/60 font-semibold mb-1">SCROLL DOWN</div>
                <div className="w-[1px] h-8 bg-gradient-to-b from-gold to-transparent mx-auto"></div>
              </div>
            </section>

            {/* COUNTDOWN + COUPLE + TIMELINE — background4.png */}
            <div className="w-full content-bg">

            {/* COUNTDOWN SECTION */}
            {!isPast && (
              <section className="w-full max-w-5xl mx-auto py-12 px-4 border-b border-gold/10 flex flex-col items-center no-print">
                <span className="text-xs tracking-[0.3em] text-gold font-bold mb-8">THE COUNTDOWN</span>
                <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                  {[
                    { value: countdown.days, label: 'Days' },
                    { value: countdown.hours, label: 'Hours' },
                    { value: countdown.minutes, label: 'Minutes' },
                    { value: countdown.seconds, label: 'Seconds' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center min-w-[90px] border border-gold/10 bg-white/[0.02] backdrop-blur-sm p-4 rounded-xl shadow-lg">
                      <span className="font-serif text-4xl md:text-5xl font-light text-gold-light leading-none">
                        {String(item.value).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-text-muted mt-2 font-bold">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* COUPLE SECTION */}
            <section className="w-full max-w-5xl mx-auto py-12 px-4 border-b border-gold/10 flex flex-col items-center">
              <span className="text-xs tracking-[0.3em] text-gold font-bold mb-2">THE COUPLE</span>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-center text-white mb-12">{coupleWeds}</h2>

              <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 w-full">
                <PersonCard person={people[0]} />

                {/* Center Separator */}
                <div className="flex md:flex-col justify-center items-center gap-4">
                  <div className="h-[1px] md:h-16 w-16 md:w-[1px] bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gold to-transparent"></div>
                  <span className="font-serif text-lg text-gold-light font-semibold tracking-widest my-2">WEDS</span>
                  <div className="h-[1px] md:h-16 w-16 md:w-[1px] bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gold to-transparent"></div>
                </div>

                <PersonCard person={people[1]} />
              </div>
            </section>

            {/* TIMELINE SECTION */}
            <section className="w-full max-w-5xl mx-auto py-12 px-4 border-b border-gold/10 flex flex-col items-center">
              <span className="text-xs tracking-[0.3em] text-gold font-bold mb-2">WEDDING FESTIVITIES</span>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-center text-white mb-12">Ceremonial Journey</h2>

              <div className="flex flex-col md:flex-row gap-8 w-full">
                {/* Selector Menu — 3 across on phones so the active day is never off-screen */}
                <div className="md:w-1/3 grid grid-cols-3 md:flex md:flex-col gap-2 md:gap-4 border-b md:border-b-0 md:border-r border-gold/10 pb-4 md:pb-0 md:pr-6">
                  {wedding.functions.map((fn) => (
                    <button
                      key={fn.id}
                      onClick={() => setActiveDay(fn.id)}
                      className={`md:flex-1 py-3 px-2 md:px-4 rounded-lg font-bold transition-all border outline-none text-center md:text-right ${activeDay === fn.id ? 'bg-gold text-primary-bg border-gold' : 'border-gold/20 text-text-muted'}`}
                    >
                      <span className="block text-[10px] md:text-xs tracking-wider">{shortDate(fn.date)}</span>
                      <span className="block text-[9px] md:text-xs mt-0.5 leading-snug opacity-80">{fn.title}</span>
                    </button>
                  ))}
                </div>

                {/* Display Card */}
                <div className="md:w-2/3 border border-gold/20 bg-white/[0.03] backdrop-blur-md p-8 rounded-xl shadow-lg min-h-[300px] flex flex-col justify-center">
                  <div className="text-3xl mb-4">🪔</div>
                  <div className="text-[10px] font-bold text-gold tracking-widest uppercase mb-1">{longDate(activeFunction.date)}</div>
                  <h4 className="font-serif text-2xl md:text-3xl text-white tracking-wide mb-4">{activeFunction.title}</h4>

                  <div className="space-y-2 text-xs md:text-sm text-text-muted leading-relaxed mb-6">
                    {activeFunction.timing && (
                      <p><strong>Timing:</strong> {activeFunction.timing}</p>
                    )}
                    <p><strong>Location:</strong> {activeFunction.location}</p>
                    <p className="pt-2 text-sm md:text-base leading-relaxed text-text-main font-semibold">{activeFunction.description}</p>
                  </div>

                  <div className="flex gap-4">
                    <a
                      href={activeFunction.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold tracking-wider text-white border-b border-white hover:text-gold-light hover:border-gold-light pb-0.5 transition-all"
                    >
                      🗺&nbsp;Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </section>

            </div>{/* end content-bg */}

            {/* VENUES + GALLERY + RSVP + FOOTER — background4.png */}
            <div className="w-full content-bg">

            {/* VENUES SECTION */}
            <section className="w-full max-w-5xl mx-auto py-12 px-4 border-b border-gold/10 flex flex-col items-center">
              <span className="text-xs tracking-[0.3em] text-gold font-bold mb-2">THE VENUES</span>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-center text-white mb-12">Locate the Festivities</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className="border border-gold/15 bg-white/[0.02] p-8 rounded-xl shadow-lg flex flex-col justify-between items-center text-center">
                  <h3 className="font-serif text-xl md:text-2xl text-white tracking-widest mb-4">{wedding.venues.departure.title}</h3>
                  <p className="text-xs md:text-sm text-text-muted leading-relaxed mb-6 font-semibold">
                    {wedding.venues.departure.lines.map((line, i) => (
                      <React.Fragment key={line}>
                        {line}
                        {i < wedding.venues.departure.lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                  <a href={wedding.venues.departure.mapUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto text-center text-xs font-bold bg-gold/10 border border-gold/45 text-gold-light py-2.5 px-6 rounded-full hover:bg-gold hover:text-primary-bg transition-all no-print">
                    GET DIRECTIONS
                  </a>
                </div>

                <div className="border border-gold/30 bg-gradient-to-b from-white/[0.04] to-transparent p-8 rounded-xl shadow-lg flex flex-col justify-between items-center text-center relative">
                  {wedding.venues.wedding.tag && (
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-gold-light text-primary-bg font-bold text-[9px] tracking-widest px-3 py-0.5 rounded-full">{wedding.venues.wedding.tag}</div>
                  )}
                  <h3 className="font-serif text-xl md:text-2xl text-white tracking-widest mb-4">{wedding.venues.wedding.title}</h3>
                  <p className="text-xs md:text-sm text-text-muted leading-relaxed mb-6 font-semibold">
                    {wedding.venues.wedding.lines.map((line, i) => (
                      <React.Fragment key={line}>
                        {line}
                        {i < wedding.venues.wedding.lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center no-print">
                    <button onClick={downloadCalendar} className="w-full sm:w-auto text-xs font-bold bg-gold text-primary-bg py-2.5 px-6 rounded-full hover:bg-white transition-all shadow-md">
                      📅 Add to Calendar
                    </button>
                    <a href={wedding.venues.wedding.mapUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto text-center text-xs font-bold border border-gold/40 text-gold-light py-2.5 px-6 rounded-full hover:bg-gold hover:text-primary-bg transition-all">
                      GET DIRECTIONS
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* GALLERY SECTION — hidden until photos are added in wedding.config.js */}
            {wedding.gallery.length > 0 && (
              <section className="w-full max-w-5xl mx-auto py-12 px-4 border-b border-gold/10 flex flex-col items-center">
                <span className="text-xs tracking-[0.3em] text-gold font-bold mb-2">MEMORIES</span>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-center text-white mb-12">Photo Gallery</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                  {wedding.gallery.map((item) => (
                    <div
                      key={item.src}
                      className="aspect-square border border-gold/10 bg-white/[0.02] rounded-lg overflow-hidden relative group hover:border-gold/40 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm py-2 text-center text-[10px] tracking-wider text-text-main uppercase font-bold">
                        {item.caption}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RSVP SECTION */}
            <section className="w-full max-w-5xl mx-auto py-12 px-4 border-b border-gold/10 flex flex-col items-center no-print">
              <div className="flex flex-col md:flex-row gap-12 w-full">
                {/* Form */}
                <div className="flex-1 border border-gold/20 bg-white/[0.02] p-8 rounded-xl shadow-lg">
                  <span className="text-xs tracking-[0.2em] text-gold font-bold block mb-2">RSVP</span>
                  <h2 className="font-serif text-2xl text-white mb-6">Confirm Attendance</h2>

                  <form onSubmit={handleRsvpSubmit} className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label htmlFor="rsvp-status" className="text-[10px] font-bold text-gold tracking-widest">ATTENDING?</label>
                        <select
                          id="rsvp-status"
                          value={rsvpStatus}
                          onChange={(e) => setRsvpStatus(e.target.value)}
                          className="bg-black/40 border border-gold/30 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold"
                        >
                          <option value="yes">Yes, Attending</option>
                          <option value="maybe">Unsure / Maybe</option>
                          <option value="no">No, Cannot Attend</option>
                        </select>
                      </div>

                      {rsvpStatus === 'yes' && (
                        <div className="flex-1 flex flex-col gap-1.5">
                          <label htmlFor="rsvp-count" className="text-[10px] font-bold text-gold tracking-widest">GUESTS COUNT</label>
                          <select
                            id="rsvp-count"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            className="bg-black/40 border border-gold/30 rounded px-3 py-2 text-xs text-white outline-none focus:border-gold"
                          >
                            <option value="1">1 Person</option>
                            <option value="2">2 People</option>
                            <option value="3">3 People</option>
                            <option value="4">4 People</option>
                            <option value="5">5+ People</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="rsvp-message" className="text-[10px] font-bold text-gold tracking-widest">BLESSINGS / WISHES</label>
                      <textarea
                        id="rsvp-message"
                        value={rsvpMessage}
                        onChange={(e) => setRsvpMessage(e.target.value)}
                        placeholder="वर-वधू के लिए अपनी मंगलकामनाएं लिखें..."
                        required
                        maxLength={500}
                        className="bg-black/40 border border-gold/30 rounded p-3 text-xs text-white outline-none focus:border-gold min-h-[100px] resize-y"
                      />
                    </div>

                    {/* Honeypot — humans never fill this */}
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden"
                    />

                    <button
                      type="submit"
                      className="w-full bg-gold hover:bg-white text-primary-bg font-bold py-3 px-6 rounded text-xs tracking-widest transition-all"
                    >
                      SUBMIT RSVP
                    </button>
                  </form>

                  {showToast && (
                    <div className="mt-4 p-3 bg-gold/10 border border-gold/30 text-gold-light text-xs text-center rounded">
                      {toastMessage}
                    </div>
                  )}
                </div>

                {/* Blessings Wall */}
                <div className="flex-1 flex flex-col">
                  <span className="text-xs tracking-[0.2em] text-gold font-bold block mb-2">GUESTBOOK</span>
                  <h2 className="font-serif text-2xl text-white mb-6">Blessings Wall</h2>

                  <div className="flex-1 max-h-[400px] overflow-y-auto space-y-4 pr-2">
                    {wishes.length === 0 ? (
                      <div className="border border-gold/10 bg-white/[0.01] p-6 rounded-lg text-center">
                        <p className="text-xs text-text-muted italic">No blessings yet — be the first to bless the couple.</p>
                      </div>
                    ) : (
                      wishes.map((w, idx) => (
                        <div key={w._id || idx} className="border border-gold/10 bg-white/[0.01] p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gold-light">{w.name}</span>
                            <span className={`text-[8px] tracking-widest font-bold px-2 py-0.5 rounded-full ${w.status === 'yes' ? 'bg-green-500/10 text-green-400' : w.status === 'maybe' ? 'bg-gold/10 text-gold-light' : 'bg-red-500/10 text-red-400'}`}>
                              {w.status === 'yes' ? `ATTENDING (${w.guestCount || 1})` : w.status === 'maybe' ? 'MAYBE' : 'DECLINED'}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm italic text-text-muted leading-relaxed font-serif">&ldquo;{w.message}&rdquo;</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="w-full py-12 px-4 text-center border-t border-gold/5 flex flex-col items-center gap-6">
              <div className="max-w-xl">
                <h4 className="font-serif text-gold-light text-base tracking-widest mb-3">❖ With Best Compliments ❖</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {wedding.card.compliments}
                </p>
              </div>

              <div className="font-serif text-xl tracking-[0.2em] text-gold-light my-2">{wedding.monogram}</div>
              <div className="text-[10px] tracking-[0.3em] text-gold font-bold">{wedding.hashtag}</div>


            </footer>

            </div>{/* end content-bg */}

          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINTABLE CARD CONTAINER (Hidden on web, visible only during print/PDF generation) */}
      <div className="print-card-container">
        {/* Decorative SVG Frame and Corner Ornaments */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 210 297" preserveAspectRatio="none">
          {/* Outer Border */}
          <rect x="6" y="6" width="198" height="285" fill="none" stroke="#d4af37" strokeWidth="1.5" />
          {/* Inner Dotted/Dashed Border */}
          <rect x="9" y="9" width="192" height="279" fill="none" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="2,2" />
          
          {/* Corner Ornaments */}
          {/* Top Left */}
          <g transform="translate(11, 11)">
            <path d="M 0,0 L 0,20 C 0,10 10,0 20,0 Z" fill="none" stroke="#d4af37" strokeWidth="0.75" />
            <path d="M 0,12 C 5,12 12,5 12,0" fill="none" stroke="#d4af37" strokeWidth="0.5" />
            <circle cx="4" cy="4" r="1" fill="#d4af37" />
          </g>
          {/* Top Right */}
          <g transform="translate(199, 11) scale(-1, 1)">
            <path d="M 0,0 L 0,20 C 0,10 10,0 20,0 Z" fill="none" stroke="#d4af37" strokeWidth="0.75" />
            <path d="M 0,12 C 5,12 12,5 12,0" fill="none" stroke="#d4af37" strokeWidth="0.5" />
            <circle cx="4" cy="4" r="1" fill="#d4af37" />
          </g>
          {/* Bottom Left */}
          <g transform="translate(11, 286) scale(1, -1)">
            <path d="M 0,0 L 0,20 C 0,10 10,0 20,0 Z" fill="none" stroke="#d4af37" strokeWidth="0.75" />
            <path d="M 0,12 C 5,12 12,5 12,0" fill="none" stroke="#d4af37" strokeWidth="0.5" />
            <circle cx="4" cy="4" r="1" fill="#d4af37" />
          </g>
          {/* Bottom Right */}
          <g transform="translate(199, 286) scale(-1, -1)">
            <path d="M 0,0 L 0,20 C 0,10 10,0 20,0 Z" fill="none" stroke="#d4af37" strokeWidth="0.75" />
            <path d="M 0,12 C 5,12 12,5 12,0" fill="none" stroke="#d4af37" strokeWidth="0.5" />
            <circle cx="4" cy="4" r="1" fill="#d4af37" />
          </g>
        </svg>

        {/* Center Watermark Mandala SVG */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <svg className="w-[450px] h-[450px] text-gold" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="40" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" strokeWidth="0.25" strokeDasharray="1,1" />
            <circle cx="50" cy="50" r="20" strokeWidth="0.5" />
            {/* Lotus Petal Patterns */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <path d="M 50,10 C 47,20 47,30 50,40 C 53,30 53,20 50,10 Z" strokeWidth="0.5" />
              </g>
            ))}
          </svg>
        </div>

        {/* Header Shlokas and Ganesh */}
        <div className="relative z-10">
          <div className="text-center text-[10px] tracking-[0.25em] text-gold font-bold mb-4 uppercase">
            || Shri Ganeshaya Namah ||
          </div>
          
          <div className="flex justify-between items-center max-w-2xl mx-auto mb-4 px-6">
            {/* Left Shloka */}
            <div className="text-left text-[9px] text-text-muted leading-relaxed font-devanagari max-w-[42%]">
              मङ्गलम् भगवान विष्णुः, मङ्गलम् गरुडध्वजः।<br />
              मङ्गलम् पुण्डरी काक्षः, मङ्गलाय तनो हरिः॥
            </div>
            
            {/* Ganesh / Om mark */}
            <div className="flex-shrink-0 mx-2">
              <div className="font-devanagari text-gold text-[34px] leading-none text-center">ॐ</div>
            </div>
            
            {/* Right Shloka */}
            <div className="text-right text-[9px] text-text-muted leading-relaxed font-devanagari max-w-[42%]">
              वक्रतुण्ड महाकाय, सूर्यकोटि समप्रभ।<br />
              निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥
            </div>
          </div>

          <div className="text-center font-serif text-3xl text-gold tracking-[0.25em] font-bold my-4">
            || {wedding.eventLabel} ||
          </div>

          {/* Invitation message */}
          <p className="text-center text-[10px] text-text-muted max-w-xl mx-auto px-6 leading-relaxed my-2 font-medium">
            With the blessings of our ancestors and well-wishers, we cordially invite you to grace the wedding ceremony and bless the couple with your love and good wishes.
          </p>
        </div>

        {/* Groom & Bride Details */}
        <div className="grid grid-cols-2 gap-10 my-4 max-w-2xl mx-auto w-full relative z-10">
          {[people[0], people[1]].map((person) => (
            <div key={person.name} className="border border-gold/30 bg-black/35 p-5 rounded-xl text-center flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[8px] tracking-[0.2em] bg-gold text-primary-bg font-bold px-4 py-0.5 rounded-sm inline-block mb-3">{person.role}</span>
                <h3 className="font-serif text-base text-white font-semibold tracking-wider mb-2">{person.name.toUpperCase()}</h3>
              </div>
              <div className="text-left text-[10px] text-text-muted leading-relaxed space-y-1.5 pl-2 mt-2 border-t border-gold/10 pt-3">
                {person.details.map((detail) => (
                  <p key={detail.label}>
                    <strong className="text-gold-light">{detail.label}:</strong> {detail.value}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Central Weds Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#220006] border-2 border-gold rounded-full w-14 h-14 flex flex-col items-center justify-center text-[9px] font-serif font-bold text-gold z-20 shadow-md">
            <span className="text-[7px] text-gold-light uppercase tracking-widest leading-none">Shubh</span>
            <span className="text-[11px] leading-tight font-serif italic text-gold font-extrabold">Weds</span>
          </div>
        </div>

        {/* Wedding Events List */}
        <div className="bg-[#fcf5e3] text-[#2b1d12] border-2 border-[#b88a2f] p-5 rounded-xl max-w-xl mx-auto w-full relative z-10 shadow-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl opacity-75 select-none">🏺</div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl opacity-75 select-none">🏺</div>
          
          <h4 className="font-serif text-[#b88a2f] font-bold text-center tracking-widest text-[10px] uppercase mb-3">✦ Wedding Events ✦</h4>
          <div className="text-[9px] leading-relaxed space-y-2 px-6">
            {wedding.card.schedule.map((row, idx) => (
              <div
                key={row.label}
                className={`flex justify-between ${idx < wedding.card.schedule.length - 1 ? 'border-b border-[#b88a2f]/20 pb-1' : 'pb-0.5'}`}
              >
                <span className="font-bold">❁ {row.label}</span>
                <span className="font-bold text-[#8c1c13]">{row.when}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Venues Section */}
        <div className="border border-gold/20 bg-black/35 p-4 rounded-xl max-w-xl mx-auto w-full text-center relative z-10 shadow-sm">
          <h4 className="font-serif text-gold font-bold text-[10px] uppercase mb-2 tracking-widest">❖ Venues ❖</h4>
          <div className="grid grid-cols-2 gap-6 text-[9px] leading-relaxed text-text-muted">
            <div className="border-r border-gold/10 pr-4">
              <span className="font-bold text-white block mb-1 uppercase tracking-wider text-[8px]">{wedding.venues.departure.title}</span>
              {wedding.venues.departure.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="pl-4">
              <span className="font-bold text-white block mb-1 uppercase tracking-wider text-[8px]">{wedding.venues.wedding.title}</span>
              {wedding.venues.wedding.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex justify-between items-center max-w-xl mx-auto w-full pt-4 border-t border-gold/10 text-[9px] relative z-10">
          <div className="text-left leading-relaxed text-text-muted max-w-[72%]">
            <strong>With Best Compliments:</strong><br />
            {wedding.card.compliments}.
          </div>
          {wedding.card.contactPhone && (
            <div className="text-right text-gold font-semibold leading-normal">
              **** CONTACT ****<br />
              📞 {wedding.card.contactPhone}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
