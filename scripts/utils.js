// Function to get the current window size
import { createOptimizedPicture } from './aem.js';

export function getWindowSize() {
  const windowWidth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  const windowHeight = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return {
    width: windowWidth,
    height: windowHeight,
  };
}

export function getViewPort() {
  const { width } = getWindowSize();
  if (width >= 900) {
    return 'desktop';
  }
  return 'mobile';
}

export function capitalize(s) {
  return String(s[0]).toUpperCase() + String(s).slice(1);
}

export function normalizeString(str) {
  return str.trim().toLowerCase().replace(/ /g, '-');
}

// Links opening in new tab
export function externalLinks(main) {
  const links = main.querySelectorAll('a[href]');
  links.forEach((linkItem) => {
    const hrefURL = new URL(linkItem.href);
    if (hrefURL.pathname.includes('pdf') || hrefURL.hostname !== window.location.hostname) {
      linkItem.setAttribute('target', '_blank');
    }
  });
}

// Get all siblings of an element
export function getAllSiblings(element, parent) {
  const children = [...parent.children];
  return children.filter((child) => child !== element);
}

// Logic for the scroll-to-top button
export function ScrolltoTop() {
  const buttonScrolltoTop = document.querySelector('div.top-arrow picture');
  if (buttonScrolltoTop) {
    buttonScrolltoTop.addEventListener('click', () => { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); });
    window.onscroll = function funcScroll() {
      if (window.scrollY > 200) buttonScrolltoTop.classList.add('visible');
      else buttonScrolltoTop.classList.remove('visible');
    };
  }
}

export function scrollWithHeaderOffset(element) {
  const header = document.querySelector('header');
  const headerHeight = header ? header.offsetHeight : 0;

  // Calculate the element's position relative to the viewport
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;

  const padding = 20;
  const scrollToPosition = absoluteElementTop - headerHeight - padding;

  window.scrollTo({
    top: scrollToPosition,
    behavior: 'smooth',
  });
}

export function createHashId(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

export function addPagingWidget(
  div,
  curpage,
  totalPages,
  doc = document,
  curLocation = window.location,
) {
  const queryParams = new URLSearchParams(curLocation.search);
  const nav = doc.createElement('ul');
  nav.classList.add('pagination');

  if (totalPages > 1) {
    const lt = doc.createElement('li');
    lt.classList.add('page');
    lt.classList.add('prev');
    const lta = doc.createElement('a');
    if (curpage === 0) {
      lt.classList.add('disabled');
    } else {
      queryParams.set('pg', curpage - 1);
      lta.href = `${curLocation.pathname}?${queryParams}`;
    }
    lt.appendChild(lta);
    nav.appendChild(lt);

    for (let i = 0; i < totalPages; i += 1) {
      const numli = doc.createElement('li');
      if (i === curpage) {
        numli.classList.add('active');
      }

      const a = doc.createElement('a');
      a.innerText = i + 1;

      queryParams.set('pg', i);
      a.href = `${curLocation.pathname}?${queryParams}`;
      numli.appendChild(a);

      nav.appendChild(numli);
    }

    const rt = doc.createElement('li');
    rt.classList.add('page');
    rt.classList.add('next');
    const rta = doc.createElement('a');
    if (curpage === totalPages - 1) {
      rt.classList.add('disabled');
    } else {
      queryParams.set('pg', curpage + 1);
      rta.href = `${curLocation.pathname}?${queryParams}`;
    }

    rt.appendChild(rta);
    nav.appendChild(rt);
  }

  div.appendChild(nav);
}

export function replaceClickableImageLinkWithImage(element) {
  element.querySelectorAll('a').forEach((aEl) => {
    if (['jpg', 'jpeg', 'png', 'gif'].some((ext) => aEl.textContent.trim().endsWith(ext))) {
      const picture = createOptimizedPicture(aEl.textContent, aEl.textContent.split('/').pop());
      aEl.removeAttribute('title');
      aEl.classList?.remove('button');
      aEl.textContent = '';
      aEl.appendChild(picture);
    }
  });
}
