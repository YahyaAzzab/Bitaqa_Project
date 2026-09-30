import { accentStyle } from '@/lib/color';
import type { ThemeName } from '@/lib/profile/themes';

type Props = {
  slug: string;
  name: string;
  theme: ThemeName;
  accentColor: string | null | undefined;
};

/*
 * Pure CSS so it paints with the HTML, before any JS. The inline script runs before the
 * splash is parsed: it plays once per visit and per profile, never on a language switch.
 */
function introScript(slug: string): string {
  const key = JSON.stringify(`bitaqa:intro:${slug}`);
  return `try{var d=document.documentElement,k=${key};if(sessionStorage.getItem(k)){d.dataset.profileIntro='seen'}else{sessionStorage.setItem(k,'1');setTimeout(function(){d.dataset.profileIntro='seen'},1200)}}catch(e){}`;
}

export function ProfileIntro({ slug, name, theme, accentColor }: Props) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: introScript(slug) }} />
      <div
        data-theme={theme}
        style={accentStyle(accentColor)}
        className="profile-intro"
        aria-hidden
      >
        <div className="profile-intro-inner">
          <p className="profile-intro-name" dir="auto">
            {name}
          </p>
          <span className="profile-intro-line" />
        </div>
        <p className="profile-intro-sign" dir="ltr">
          BITAQA
        </p>
      </div>
    </>
  );
}
