// add delayed functionality here
import { loadScript, sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

const isDesktop = window.matchMedia('(min-width: 900px)');

async function loadWidget() {
  await loadScript('/widgets/accessibility/accessibility.js');
}

if (isDesktop.matches) {
  loadWidget();
}

function resizeAction() {
  if (!isDesktop.matches) {
    const div = document.querySelector('.userway_buttons_wrapper .uai.userway_dark');
    div.style.setProperty('display', 'none');
  } else {
    const div = document.querySelector('.userway_buttons_wrapper .uai.userway_dark');
    div.style.setProperty('display', 'block');
  }
}

window.addEventListener('resize', resizeAction);
