'use client';

import { Home, LayoutGrid, Plus, Receipt, Settings, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const TABS: Array<{
  href: '/dashboard' | '/dashboard/profiles' | '/dashboard/new' | '/dashboard/cash' | '/dashboard/orders';
  key: 'home' | 'profiles' | 'new' | 'cash' | 'orders';
  icon: typeof Home;
  exact?: boolean;
  primary?: boolean;
}> = [
  { href: '/dashboard', key: 'home', icon: Home, exact: true },
  { href: '/dashboard/profiles', key: 'profiles', icon: LayoutGrid },
  { href: '/dashboard/new', key: 'new', icon: Plus, primary: true },
  { href: '/dashboard/cash', key: 'cash', icon: Wallet },
  { href: '/dashboard/orders', key: 'orders', icon: Receipt },
];

const TITLE_KEYS: Array<{ match: (path: string) => boolean; key: string }> = [
  { match: (p) => p.startsWith('/dashboard/new'), key: 'wizard.title' },
  { match: (p) => p.startsWith('/dashboard/ready'), key: 'ready.title' },
  { match: (p) => p.startsWith('/dashboard/profiles'), key: 'profiles.title' },
  { match: (p) => p.startsWith('/dashboard/cash'), key: 'cash.title' },
  { match: (p) => p.startsWith('/dashboard/orders'), key: 'orders.title' },
  { match: (p) => p.startsWith('/dashboard/settings'), key: 'settings.title' },
  { match: () => true, key: 'title' },
];

type Props = {
  children: ReactNode;
};

export function DashboardShell({ children }: Props) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('dashboard.nav');
  const pathname = usePathname();
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    for (const tab of TABS) {
      router.prefetch(tab.href);
    }
  }, [router]);

  const autoKey = TITLE_KEYS.find((item) => item.match(pathname))?.key ?? 'title';
  const title = t(autoKey);
  const showSettings = !pathname.startsWith('/dashboard/settings');

  return (
    <div className="bg-bg text-text mx-auto flex min-h-dvh w-full max-w-lg flex-col md:max-w-none md:flex-row">
      <aside className="border-border hidden w-56 shrink-0 border-e md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:px-3 md:py-6">
        <p className="text-accent px-3 text-[12px] font-medium tracking-[0.14em] uppercase">
          Bitaqa
        </p>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Dashboard">
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            const pending = pendingHref === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch
                onClick={() => setPendingHref(tab.href)}
                className={cn(
                  'pressable focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-[14px] font-medium',
                  tab.primary && 'bg-accent text-accent-fg',
                  !tab.primary && (active || pending) && 'bg-surface text-text',
                  !tab.primary && !active && !pending && 'text-text-secondary hover:bg-surface/80',
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                {tNav(tab.key)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'border-border bg-bg/95 sticky top-0 z-30 border-b backdrop-blur-md transition-[padding] duration-200',
            'px-4 pt-[max(0.75rem,env(safe-area-inset-top))]',
            compact ? 'pb-2' : 'pb-3',
          )}
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <p
                className={cn(
                  'text-accent font-medium tracking-[0.12em] uppercase transition-opacity',
                  compact ? 'text-[10px] opacity-70' : 'text-[12px]',
                )}
              >
                Bitaqa
              </p>
              <h1
                className={cn(
                  'font-semibold tracking-tight transition-[font-size] duration-200',
                  compact ? 'text-[20px]' : 'text-[26px]',
                )}
              >
                {title}
              </h1>
            </div>
            {showSettings ? (
              <Link
                href="/dashboard/settings"
                prefetch
                className="pressable focus-ring text-text-secondary inline-flex size-11 items-center justify-center rounded-md"
                aria-label={t('settings.title')}
              >
                <Settings className="size-5" strokeWidth={1.75} />
              </Link>
            ) : null}
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
          {children}
        </main>

        <nav
          className="border-border bg-bg/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md md:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          aria-label="Navigation"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1">
            {TABS.map((tab) => {
              const active = tab.exact
                ? pathname === tab.href
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              const Icon = tab.icon;
              const pending = pendingHref === tab.href;
              return (
                <li key={tab.href} className="flex justify-center">
                  <Link
                    href={tab.href}
                    prefetch
                    onClick={() => setPendingHref(tab.href)}
                    className={cn(
                      'pressable focus-ring relative flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium',
                      tab.primary && '-mt-3',
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center rounded-md transition-colors',
                        tab.primary
                          ? 'bg-accent text-accent-fg size-12 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
                          : 'size-8',
                        !tab.primary && (active || pending) && 'text-accent',
                        !tab.primary && !active && !pending && 'text-text-muted',
                      )}
                    >
                      <Icon className={tab.primary ? 'size-6' : 'size-5'} strokeWidth={1.75} />
                    </span>
                    {!tab.primary ? (
                      <span className={cn(active || pending ? 'text-text' : 'text-text-muted')}>
                        {tNav(tab.key)}
                      </span>
                    ) : (
                      <span className="sr-only">{tNav(tab.key)}</span>
                    )}
                    {(active || pending) && !tab.primary ? (
                      <span className="bg-accent absolute top-0 h-0.5 w-6 rounded-full" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
