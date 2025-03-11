// eslint-disable-next-line no-unused-vars,no-empty-function

import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';

function decorateHeroSection(element) {
  const section = element.querySelector('.section.hero');
  if (section) {
    const checkAElement = section.querySelector('a');
    if (checkAElement) {
      const backgroundPic = createOptimizedPicture(checkAElement);
      section.textContent = '';
      section.append(backgroundPic);
    }
  }
}

export default async function decorate(doc) {
  doc.querySelector('header').classList.add('displayoff');
  doc.querySelector('footer').classList.add('displayoff');
  doc.body.classList.add('event');
  decorateHeroSection(doc);

  const titleText = getMetadata('featuredtitle');
  doc.querySelector('.title').innerHTML = `<h2>${titleText}</h2>`;

  const featuredImage = getMetadata('featuredimage');
  doc.querySelector('.image').innerHTML = `<img src="${featuredImage}">`;

  const readMoreData = getMetadata('readmore');
  if (readMoreData.length > 0) {
    doc.querySelector('.event-footer p a').href = readMoreData;
  }

  // Configuring a POST Message on scrolling to send the event title to the parent window
  window.onscroll = function funcScroll() {
    if (window.scrollY > 100) {
      // window.top.postMessage({ eventtop: 'off' }, '*');
      if ((window.innerHeight + window.scrollY + 5) >= document.body.scrollHeight) {
        // you're at the bottom of the page
        window.top.postMessage({ eventfooter: 'on', eventtop: 'off' }, '*');
      } else {
        window.top.postMessage({ eventfooter: 'off', eventtop: 'off' }, '*');
      }
    } else {
      window.top.postMessage({ eventtop: 'on' }, '*');
    }
  };
}
