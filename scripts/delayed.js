// add delayed functionality here
import { loadScript, sampleRUM } from './aem.js';
import { loadrrule } from '../templates/calendar/calendar.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

const isDesktop = window.matchMedia('(min-width: 900px)');

// Scripts for Google Translate
function googleTranslate() {
  const s1 = document.createElement('script');
  s1.setAttribute('src', 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
  (document.body || document.head).appendChild(s1);
  const s2 = document.createElement('script');
  s2.text = `
    function googleTranslateElementInit() {
      new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
    }
  `;
  (document.body || document.head).appendChild(s2);
}

googleTranslate();

// Script for Accessibility Widget
async function loadWidget() {
  const searchPath = '/search';
  if (!window.location.pathname.includes(searchPath)) {
    await loadScript('/widgets/accessibility/accessibility.js');
  }
}

// Script for share Widget
async function loadShareWidget() {
  const calendarPath = '/calendar/';
  if (!window.location.pathname.includes(calendarPath)) {
    await loadScript('/widgets/share-button/share-button.js');
  }
}

if (isDesktop.matches) {
  loadWidget();
  loadShareWidget();
}

function resizeAction() {
  if (!isDesktop.matches) {
    const div = document.querySelector('.userway_buttons_wrapper .uai.userway_dark');
    if (div) div.style.setProperty('display', 'none');
  } else {
    const div = document.querySelector('.userway_buttons_wrapper .uai.userway_dark');
    if (div) {
      div.style.setProperty('display', 'block');
    } else {
      loadWidget();
    }
  }
}

window.addEventListener('resize', resizeAction);

// Script for Full Calendar
// check if windows location contains calendar
if (window.location.pathname.includes('/calendar')) {
  loadrrule();
}

/* Google Tag Manager & Google Analytics */

async function loadAnalyticsScripts() {
  const uniquePaths = '/foster_care/';
  if (window.location.pathname.includes(uniquePaths)) {
    // google tag manager
    const gtmId = 'GTM-WGNDK2R';
    // eslint-disable-next-line
    (function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' }); var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f); })(window, document, 'script', 'dataLayer', gtmId);
  } else {
    const gaId = 'G-HK2D6918MP';
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`, async () => {
      // eslint-disable-next-line
      window.dataLayer = window.dataLayer || []; function gtag() { dataLayer.push(arguments); } gtag('js', new Date()); gtag('config', gaId);
    });
  }
}

loadAnalyticsScripts();
