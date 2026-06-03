import { getLocale, getMessages } from "@/lib/i18n";
import LocaleSwitcher from "@/components/LocaleSwitcher";

// Gov-style utility bar + primary navigation (internationalized).
export default async function Header() {
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <>
      <div className="utility-bar">
        <div className="shell inner">
          <div className="flag">{m.utility.flag}</div>
          <div className="utility-right">
            <span>
              {m.utility.applyAt}{" "}
              <a href="#" rel="noopener">
                {m.utility.portal}
              </a>{" "}
              · {m.utility.call}
            </span>
            <LocaleSwitcher current={locale} label={m.switcher.label} />
          </div>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        <div className="shell nav-inner">
          <a className="brand" href="#top" aria-label="SNAP AI home">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <div>SNAP AI</div>
              <span className="brand-sub">{m.nav.brandSub}</span>
            </div>
          </a>
          <div className="nav-links">
            <a href="#who">{m.nav.whoWeHelp}</a>
            <a href="#applicant">{m.nav.applicants}</a>
            <a href="#agency">{m.nav.agencies}</a>
            <a href="#integrity">{m.nav.integrity}</a>
            <a href="#pilot">{m.nav.pilot}</a>
          </div>
          <div className="nav-cta">
            <a className="btn btn-ghost btn-tiny" href="/login">
              {m.nav.signIn}
            </a>
            <a className="btn btn-primary btn-tiny" href="/login">
              {m.nav.getHelp}
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
