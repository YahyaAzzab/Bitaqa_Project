import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowUpRight, Phone, Radio } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const PHONES = [
  { display: '06 81 72 52 42', href: 'tel:+212681725242' },
  { display: '06 42 91 60 60', href: 'tel:+212642916060' },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="home-shell relative min-h-dvh overflow-hidden">
      <div className="home-grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="Bitaqa">
            <span className="home-mark transition-transform duration-300 group-hover:scale-105">
              B
            </span>
            <span className="text-[13px] font-semibold tracking-[0.22em] uppercase">Bitaqa</span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={PHONES[0].href}
              className="pressable focus-ring border-border text-text-secondary hover:border-accent/50 hover:text-accent hidden min-h-11 items-center gap-2 rounded-md border px-3 text-[13px] font-medium sm:inline-flex"
              dir="ltr"
            >
              <Phone className="size-4" strokeWidth={1.75} aria-hidden />
              {PHONES[0].display}
            </a>
            <Link
              href="/"
              locale={locale === 'fr' ? 'ar' : 'fr'}
              className="pressable focus-ring border-border text-text-secondary hover:border-accent hover:text-accent inline-flex min-h-11 items-center rounded-md border px-3 text-[13px] font-medium"
            >
              {tc('language')}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-16">
          <div className="max-w-xl">
            <p className="home-kicker animate-rise">{t('eyebrow')}</p>
            <h1 className="animate-rise-delay mt-4 text-[clamp(2.6rem,7.5vw,5.75rem)] leading-[0.95] font-semibold tracking-[-0.045em] text-balance">
              <span className="block text-[color:var(--ivory)]">Bitaqa</span>
              <span className="text-text-secondary mt-2 block text-[clamp(1.35rem,3.5vw,2rem)] font-medium tracking-[-0.02em]">
                {t('hero')}
              </span>
            </h1>
            <p className="animate-rise-delay-2 text-text-secondary mt-6 max-w-md text-[17px] leading-relaxed">
              {t('subtitle')}
            </p>

            <div className="animate-rise-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login"
                className="pressable bg-accent text-accent-fg hover:bg-accent-hover focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-[15px] font-semibold"
              >
                {t('cta')}
                <ArrowUpRight size={17} strokeWidth={2} aria-hidden />
              </Link>
              <a
                href={PHONES[0].href}
                className="pressable focus-ring border-border bg-surface/60 hover:border-accent/40 inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-5 text-[15px] font-medium backdrop-blur-sm"
              >
                <Phone className="size-4" strokeWidth={1.75} aria-hidden />
                {t('callUs')}
              </a>
            </div>

            <p className="text-text-muted animate-rise-delay-3 mt-4 inline-flex items-center gap-2 text-[13px]">
              <Radio size={14} strokeWidth={1.7} aria-hidden />
              {t('microcopy')}
            </p>

            <div className="home-contact animate-rise-delay-3 mt-10 rounded-lg border p-4 sm:p-5">
              <p className="text-text-muted text-[11px] font-medium tracking-[0.16em] uppercase">
                {t('contactTitle')}
              </p>
              <p className="text-text-secondary mt-1.5 text-[14px] leading-relaxed">
                {t('contactLede')}
              </p>
              <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                {PHONES.map((phone) => (
                  <li key={phone.href} className="flex-1">
                    <a
                      href={phone.href}
                      dir="ltr"
                      className="pressable focus-ring border-border bg-bg/70 hover:border-accent/45 group flex min-h-14 items-center justify-between gap-3 rounded-md border px-4"
                    >
                      <span className="tabular text-[17px] font-semibold tracking-wide text-[color:var(--ivory)]">
                        {phone.display}
                      </span>
                      <span className="text-accent inline-flex size-9 items-center justify-center rounded-full border border-current/30 transition-transform duration-200 group-hover:scale-105">
                        <Phone className="size-4" strokeWidth={1.75} aria-hidden />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="border-border mt-10 grid max-w-lg grid-cols-3 gap-4 border-t pt-5">
              <div>
                <dt className="text-[color:var(--ivory)] text-lg font-semibold tracking-tight sm:text-xl">
                  {t('statOne')}
                </dt>
                <dd className="text-text-muted mt-1 text-[11px] leading-snug sm:text-xs">
                  {t('statOneLabel')}
                </dd>
              </div>
              <div>
                <dt className="text-[color:var(--ivory)] text-lg font-semibold tracking-tight sm:text-xl">
                  {t('statTwo')}
                </dt>
                <dd className="text-text-muted mt-1 text-[11px] leading-snug sm:text-xs">
                  {t('statTwoLabel')}
                </dd>
              </div>
              <div>
                <dt className="text-[color:var(--ivory)] text-lg font-semibold tracking-tight sm:text-xl">
                  {t('statThree')}
                </dt>
                <dd className="text-text-muted mt-1 text-[11px] leading-snug sm:text-xs">
                  {t('statThreeLabel')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="home-stage" aria-label={t('cardLabel')}>
            <div className="home-orbit home-orbit-one" aria-hidden />
            <div className="home-orbit home-orbit-two" aria-hidden />
            <div className="home-glow" aria-hidden />
            <div className="home-card-wrap animate-card">
              <article className="home-card">
                <div className="relative z-[1] flex items-start justify-between">
                  <span className="home-chip">BITAQA</span>
                  <span className="border-accent/35 text-accent rounded-full border px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase">
                    NFC
                  </span>
                </div>
                <div className="relative z-[1] mt-auto">
                  <div className="bg-accent mb-7 h-px w-12 opacity-80" />
                  <p className="text-[color:var(--ivory)] text-[1.65rem] leading-tight font-semibold tracking-tight">
                    {t('cardName')}
                  </p>
                  <p className="text-text-muted mt-2 text-[13px]">{t('cardRole')}</p>
                </div>
                <div className="relative z-[1] mt-8 flex items-center justify-between text-[10px] tracking-[0.18em] text-white/40 uppercase">
                  <span>Maroc</span>
                  <span>{t('cardTap')}</span>
                </div>
              </article>
            </div>
            <p className="home-note home-note-top">
              <span className="bg-accent size-1.5 rounded-full" aria-hidden />
              {t('cardNoteOne')}
            </p>
            <p className="home-note home-note-bottom">
              <span className="bg-accent size-1.5 rounded-full" aria-hidden />
              {t('cardNoteTwo')}
            </p>
          </div>
        </section>

        <footer className="border-border text-text-muted flex flex-col gap-3 border-t pt-4 text-[12px] sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer')}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {PHONES.map((phone) => (
              <a
                key={phone.href}
                href={phone.href}
                dir="ltr"
                className="hover:text-accent focus-ring rounded-sm tabular tracking-wide transition-colors"
              >
                {phone.display}
              </a>
            ))}
            <span className="tracking-[0.14em] uppercase">{t('footerDetail')}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
