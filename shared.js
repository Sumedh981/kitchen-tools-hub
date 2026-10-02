// ============================================================
// shared.js — loaded on every page. Two jobs only:
//  1. fireEvent() — the one place every GA4 custom event call
//     goes through, on every tool.
//  2. Nav menu toggle (the hamburger button in the top bar).
//
// GA4 automatically logs a page_view (with page_path) on every
// page load via the gtag snippet in each page's <head> — that's
// what lets you compare tools against each other with no extra
// code: just filter any report by page_path.
// ============================================================

function fireEvent(name, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', name, params);
  } else {
    console.log('[GA4 event - gtag not loaded]', name, params);
  }
}

// ============================================================
// Cookie consent + GA4 loading
//
// Every page's <head> defines the dataLayer/gtag stub and sets
// analytics_storage to "denied" by default (Google's Consent
// Mode). The actual gtag.js script — the thing that sets cookies
// and sends data to Google — is only injected here, and only
// after the visitor accepts. If they decline, gtag() calls still
// work locally (they just push into dataLayer) but nothing is
// ever sent, since the script that reads that queue never loads.
// ============================================================

const GA_MEASUREMENT_ID = 'G-09E1QM5JD5';
const CONSENT_KEY = 'cookieConsent'; // 'accepted' | 'declined'

function loadGA4() {
  if (document.getElementById('ga4-script')) return; // already loaded
  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  if (typeof gtag === 'function') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('config', GA_MEASUREMENT_ID);
  }
}

function showConsentBanner() {
  const banner = document.createElement('div');
  banner.className = 'consent-banner';
  banner.innerHTML = `
    <p>This site uses Google Analytics to understand how the tools are used
       (for a college assignment). <a href="${relativePrivacyPath()}">Learn more</a></p>
    <div class="consent-banner__actions">
      <button class="btn btn--primary" id="consentAccept">Accept</button>
      <button class="btn btn--ghost" id="consentDecline">Decline</button>
    </div>
  `;
  document.body.appendChild(banner);

  banner.querySelector('#consentAccept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    loadGA4();
    banner.remove();
  });
  banner.querySelector('#consentDecline').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    banner.remove();
  });
}

function relativePrivacyPath() {
  // Home page sits at the root; every tool page sits one folder down.
  const depth = location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean).length;
  return (depth > 0 ? '../' : '') + 'privacy/index.html';
}

function initConsent() {
  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'accepted') {
    loadGA4();
  } else if (consent !== 'declined') {
    showConsentBanner();
  }
  // consent === 'declined': do nothing, GA4 never loads
}

// ============================================================
// Mock subscription model — no real payment. A flag in
// localStorage decides "free" vs "premium". Used by any page
// that gates a feature (recipe saves, finance sections, etc).
// ============================================================

const Subscription = {
  KEY: 'subscriptionStatus',
  isPremium() { return localStorage.getItem(this.KEY) === 'premium'; },
  subscribe() { localStorage.setItem(this.KEY, 'premium'); },
  cancel() { localStorage.setItem(this.KEY, 'free'); }
};

// Shows the paywall modal. `feature` is a short slug used in GA4
// events so you can see which feature drives the most upgrades.
// `onSubscribed` (optional) re-renders the calling page's gated UI.
function showPaywall(feature, onSubscribed) {
  fireEvent('paywall_viewed', { feature });

  const backdrop = document.createElement('div');
  backdrop.className = 'paywall-backdrop';
  backdrop.innerHTML = `
    <div class="paywall-modal">
      <h3>Go Premium</h3>
      <p>Unlock unlimited saved recipes and the full Finance module.
         This is a simulated checkout for the assignment — no real payment.</p>
      <button class="btn btn--primary" id="pwSubscribe">Subscribe (simulated)</button>
      <button class="btn btn--ghost" id="pwClose">Maybe later</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.querySelector('#pwSubscribe').addEventListener('click', () => {
    fireEvent('upgrade_clicked', { feature });
    Subscription.subscribe();
    fireEvent('subscription_started', { feature });
    backdrop.remove();
    renderPlanBadge();
    if (onSubscribed) onSubscribed();
  });
  backdrop.querySelector('#pwClose').addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
}

function renderPlanBadge() {
  const inner = document.querySelector('.topnav__inner');
  if (!inner) return;
  let badge = document.getElementById('planBadge');
  if (!badge) {
    badge = document.createElement('button');
    badge.id = 'planBadge';
    badge.className = 'plan-badge';
    const menuBtn = inner.querySelector('.topnav__menu-btn');
    inner.insertBefore(badge, menuBtn);
    badge.addEventListener('click', () => {
      if (Subscription.isPremium()) {
        if (confirm('Cancel your simulated Premium subscription?')) {
          Subscription.cancel();
          fireEvent('subscription_cancelled');
          renderPlanBadge();
          location.reload();
        }
      } else {
        showPaywall('nav_badge');
      }
    });
  }
  const premium = Subscription.isPremium();
  badge.textContent = premium ? 'Premium ✓' : 'Free plan';
  badge.classList.toggle('is-premium', premium);
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.topnav__menu-btn');
  const links = document.querySelector('.topnav__links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', () => links.classList.toggle('open'));
  }
  // Highlight the current page in the nav
  const here = location.pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.topnav__links a').forEach(a => {
    const linkPath = new URL(a.href).pathname.replace(/\/index\.html$/, '/');
    if (linkPath === here) a.classList.add('active');
  });

  renderPlanBadge();
  initConsent();
});
