// Gov-style utility bar + primary navigation.

function UtilityBar() {
  return (
    <div className="utility-bar">
      <div className="shell inner">
        <div className="flag">A pilot platform for U.S. public benefit agencies</div>
        <div>
          Apply for SNAP at{" "}
          <a href="#" rel="noopener">
            your state&apos;s benefits portal
          </a>{" "}
          · Call 2-1-1 for help
        </div>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="shell nav-inner">
        <a className="brand" href="#top" aria-label="SNAP AI home">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <div>SNAP AI</div>
            <span className="brand-sub">
              Supplemental Nutrition Assistance Program · AI support
            </span>
          </div>
        </a>
        <div className="nav-links">
          <a href="#who">Who we help</a>
          <a href="#applicant">Applicants</a>
          <a href="#agency">Agencies</a>
          <a href="#integrity">Integrity</a>
          <a href="#pilot">Pilot</a>
        </div>
        <div className="nav-cta">
          <a className="btn btn-ghost btn-tiny" href="/login">
            Sign in
          </a>
          <a className="btn btn-primary btn-tiny" href="/login">
            Get SNAP Help
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function Header() {
  return (
    <>
      <UtilityBar />
      <Nav />
    </>
  );
}
