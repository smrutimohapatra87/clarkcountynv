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
