// eslint-disable-next-line no-unused-vars,no-empty-function

import { getMetadata } from '../../scripts/aem.js';

export default async function decorate(doc) {
  doc.querySelector('header').remove();
  doc.querySelector('footer').remove();
  doc.body.classList.add('event');

  // Change the background color of the hero date & time based on the division-color metadata
  const divisionColor = getMetadata('division-color');
  if (divisionColor) {
    doc.querySelectorAll('body.event main .section.event-footer .default-content-wrapper p > a').forEach((element) => {
      element.style.backgroundColor = divisionColor;
    });
  }
  // Configuring a POST Message on scrolling to send the event title to the parent window
  window.onscroll = function funcScroll() {
    if (window.scrollY > 50) {
      window.top.postMessage({ message: 'off' }, '*');
    } else {
      window.top.postMessage({ message: 'on' }, '*');
    }
  };
}
