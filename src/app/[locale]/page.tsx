import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowUpRight, Check, Radio, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="home-shell min-h-dvh overflow-hidden px-5 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Bitaqa">
            <span className="home-mark">B</span>
            <span className="text-sm font-semibold tracking-[0.18em] uppercase">Bitaqa</span>
          </Link>
          <Link
            href="/"
            locale={locale === 'fr' ? 'ar' : 'fr'}
            className="focus-ring pressable border-border text-text-secondary hover:border-accent hover:text-accent inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
          >
            {tc('language')}
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
          <div className="max-w-xl">
            <p className="home-kicker animate-rise">{t('eyebrow')}</p>
            <h1 className="animate-rise-delay mt-5 text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.94] font-semibold tracking-[-0.055em] text-balance">
              {t('hero')}
            </h1>
            <p className="animate-rise-delay-2 text-text-secondary mt-7 max-w-md text-lg leading-relaxed sm:text-xl">
              {t('subtitle')}
            </p>
            <div className="animate-rise-delay-3 mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="pressable bg-accent text-accent-fg hover:bg-accent-hover focus-ring inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
              >
                {t('cta')}
                <ArrowUpRight size={17} strokeWidth={2} />
              </Link>
              <span className="text-text-muted inline-flex items-center gap-2 text-sm">
                <Radio size={16} strokeWidth={1.7} />
                {t('microcopy')}
              </span>
            </div>
            <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="text-ivory text-xl font-semibold">{t('statOne')}</p>
                <p className="text-text-muted mt-1 text-xs leading-snug">{t('statOneLabel')}</p>
              </div>
              <div>
                <p className="text-ivory text-xl font-semibold">{t('statTwo')}</p>
                <p className="text-text-muted mt-1 text-xs leading-snug">{t('statTwoLabel')}</p>
              </div>
              <div>
                <p className="text-ivory text-xl font-semibold">{t('statThree')}</p>
                <p className="text-text-muted mt-1 text-xs leading-snug">{t('statThreeLabel')}</p>
              </div>
            </div>
          </div>

          <div className="home-stage" aria-label={t('cardLabel')}>
            <div className="home-orbit home-orbit-one" />
            <div className="home-orbit home-orbit-two" />
            <div className="home-card-wrap animate-card">
              <div className="home-card">
                <div className="flex items-start justify-between">
                  <span className="home-chip">BITAQA</span>
                  <Sparkles size={20} className="text-accent" strokeWidth={1.5} />
                </div>
                <div className="mt-auto">
                  <div className="bg-accent/80 mb-8 h-px w-14" />
                  <p className="text-ivory text-2xl font-semibold tracking-tight">
                    {t('cardName')}
                  </p>
                  <p className="text-text-muted mt-2 text-sm">{t('cardRole')}</p>
                </div>
                <div className="mt-8 flex items-center justify-between text-[10px] tracking-[0.2em] text-white/45 uppercase">
                  <span>NFC</span>
                  <span>{t('cardTap')}</span>
                </div>
              </div>
            </div>
            <div className="home-note home-note-top">
              <Check size={14} /> {t('cardNoteOne')}
            </div>
            <div className="home-note home-note-bottom">
              <Check size={14} /> {t('cardNoteTwo')}
            </div>
          </div>
        </section>

        <footer className="text-text-muted flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs">
          <span>{t('footer')}</span>
          <span className="tracking-[0.16em] uppercase">{t('footerDetail')}</span>
        </footer>
      </div>
    </main>
  );
}
