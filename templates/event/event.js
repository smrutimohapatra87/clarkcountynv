// eslint-disable-next-line no-unused-vars,no-empty-function

import { getMetadata } from '../../scripts/aem.js';

export default async function decorate(doc) {
  doc.querySelector('header').remove();
  doc.querySelector('footer').remove();
  doc.body.classList.add('event');

  // Change the background color of the hero date & time based on the division-color metadata
  const divisionColor = getMetadata('division-color');
  if (divisionColor) {
    doc.querySelectorAll('body.event main .section.hero .hero-wrapper .block.hero div div').forEach((element) => {
      element.style.backgroundColor = divisionColor;
    });
    doc.querySelectorAll('body.event main .section.event-footer .default-content-wrapper p > a').forEach((element) => {
      element.style.backgroundColor = divisionColor;
    });
  }
}
