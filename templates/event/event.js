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
  const imageBlock = doc.querySelector('.image');
  if (imageBlock) {
    imageBlock.innerHTML = `<img src="${featuredImage}">`;
  }

  const address = doc.querySelector('.section.address');
  if (address?.children?.length === 0) {
    address.remove();
  }

  const locations = doc.querySelector('.section.locations');
  if (locations?.children?.length === 0) {
    locations.remove();
  }

  const descriptionEl = doc.querySelector('.section.description');

  if (descriptionEl?.children.length === 0) {
    descriptionEl.append(getMetadata('featureddescription'));
  }
  descriptionEl?.querySelectorAll('a[href$=".jpg"], a[href$=".png"], a[href$=".jpeg"], a[href$=".gif"]').forEach((aEl) => {
    if (['jpg', 'jpeg', 'png', 'gif'].some((ext) => aEl.textContent.trim().endsWith(ext))) {
      const picture = createOptimizedPicture(aEl.href, aEl.href.split('/').pop());
      const parent = aEl.parentElement;
      if (parent.tagName === 'P' && parent.children.length === 1) {
        parent.replaceWith(picture);
      } else {
        aEl.replaceWith(picture);
      }
    }
  });

  const links = descriptionEl.querySelectorAll('a');
  links.forEach((linkItem) => {
    linkItem.setAttribute('target', '_blank');
  });

  if (descriptionEl?.children?.length === 0) {
    descriptionEl.remove();
  }

  // Configuring a POST Message on scrolling to send the event title to the parent window
  (() => {
    let lastState = { eventtop: null, eventfooter: null };
    let ticking = false;
    const BOTTOM_THRESHOLD = 10;

    function handleScroll() {
      const { scrollY } = window;
      const viewportHeight = window.innerHeight;
      const pageHeight = document.body.scrollHeight;

      let newState = { eventtop: null, eventfooter: null };

      const nearTop = scrollY <= 100;
      const nearBottom = (viewportHeight + scrollY) >= (pageHeight - BOTTOM_THRESHOLD);

      if (nearTop) {
        newState = { eventtop: 'on', eventfooter: 'off' };
      } else if (nearBottom) {
        newState = { eventtop: 'off', eventfooter: 'on' };
      } else {
        newState = { eventtop: 'off', eventfooter: 'off' };
      }

      // Only post message if state actually changed
      if (
        newState.eventtop !== lastState.eventtop
        || newState.eventfooter !== lastState.eventfooter
      ) {
        window.parent.postMessage(newState, '*');
        lastState = newState;
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    });
  })();
}
