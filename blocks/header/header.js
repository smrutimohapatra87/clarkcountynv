import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  div, img, span,
} from '../../scripts/dom-helpers.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function handleNavTools(navWrapper) {
  const tools = navWrapper.querySelectorAll('.nav-tools .default-content-wrapper p');
  if (tools && tools.length === 2) {
    const searchTool = tools[0];
    const languageTool = tools[1];
    const nav = document.querySelector('.nav-wrapper nav');
    const searchDiv = div({ class: 'nav-search' });
    const searchIcon = img({ class: 'nav-search-icon' });
    searchIcon.src = '/icons/search-white.svg';
    searchIcon.alt = 'Search Icon';
    searchDiv.appendChild(searchIcon);
    const searchText = span();
    searchText.textContent = searchTool.innerText;
    searchDiv.appendChild(searchText);
    const languageDiv = div({ class: 'nav-language' });
    const languageText = span();
    languageText.textContent = languageTool.innerText;
    const picture = languageTool.querySelector('picture');
    picture.classList.add('nav-language-icon');
    languageDiv.appendChild(languageText);
    languageDiv.appendChild(picture);
    const navToolsDiv = div({ class: 'nav-tools' });
    navToolsDiv.appendChild(searchDiv);
    navToolsDiv.appendChild(languageDiv);
    nav.appendChild(navToolsDiv);
    navWrapper.querySelector('nav .nav-tools').remove();
  }
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  // document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

function decorateNavItemMobile(mainUL) {
  const header = document.querySelector('header');
  header.classList.add('mobile');
  const mainLIs = mainUL.children;
  for (let i = 0; i < mainLIs.length; i += 1) {
    const mainLI = mainLIs[i];
    const mainA = mainLI.querySelector('a');

    const details = document.createElement('details');
    details.classList.add('accordion-item');

    const summary = document.createElement('summary');
    summary.classList.add('accordion-item-label');
    const labelRight = document.createElement('div');
    labelRight.classList.add('markerdiv');
    const lablDiv = document.createElement('div');
    lablDiv.append(mainA, labelRight);
    summary.append(lablDiv);

    const childUL = mainLI.querySelector('ul');

    if (childUL) {
      details.append(summary, childUL);
      mainLI.replaceWith(details);
      decorateNavItemMobile(childUL);
    } else {
      details.append(summary);
      mainLI.replaceWith(details);
    }
  }
}

function findLevel(element) {
  let ele = element;
  let level = 0;
  while (ele.parentElement) {
    if (ele.parentElement.tagName === 'UL') {
      level += 1;
    }
    ele = ele.parentElement;
  }
  return level;
}

function decorateNavItem(parent, navSectionSearchItem) {
  const menuUl = document.createElement('div');
  menuUl.className = 'menuul';
  const navIn = document.createElement('div');
  navIn.className = 'nav-in';
  const navContent = document.createElement('div');
  navContent.className = 'nav-content';
  const navContentIn = document.createElement('div');
  navContentIn.className = 'nav-content-in';
  const navPageTitle = document.createElement('h2');
  navPageTitle.className = 'nav-page-title';
  navPageTitle.textContent = parent.querySelector('strong').textContent;
  const closeSpan = document.createElement('span');
  closeSpan.className = 'nav-close';
  closeSpan.innerText = 'close';
  closeSpan.addEventListener('click', () => {
    parent.setAttribute('aria-expanded', 'false');
  });
  navContentIn.append(navPageTitle);
  navContentIn.append(closeSpan);
  navContent.append(navContentIn);
  navIn.append(navContent);
  menuUl.append(navIn);
  parent.append(menuUl);

  const navInMenuWrap = document.createElement('div');
  navInMenuWrap.className = 'nav-in-menu-wrap';
  navIn.append(navInMenuWrap);

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  navInMenuWrap.append(tablist);

  const list = parent.children[1].nodeName === 'UL' ? parent.children[1].children : null;
  const listLen = list !== null ? list.length : 0;
  let i = 0;
  while (i < listLen) {
    const tabInfo = list.item(i);
    const id = toClassName(tabInfo.querySelector('a').textContent);

    const tabpanel = document.createElement('div');
    navInMenuWrap.append(tabpanel);
    // decorate tabpanel
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');
    const tabpanelItems = tabInfo.querySelector('ul');
    if (tabpanelItems !== null) {
      tabpanel.append(tabpanelItems);
    }
    i += 1;

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tabInfo.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('mouseover', () => {
      parent.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
  }

  const navBottom = document.createElement('div');
  navBottom.className = 'nav-bottom';
  navBottom.append(navSectionSearchItem.cloneNode(true));

  navIn.append(navBottom);

  parent.children[1].remove();
}

function buildNavSections(navSections) {
  if (navSections) {
    const navSectionSearchItem = navSections.children[0]?.children[1];
    if (isDesktop.matches) {
      navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        decorateNavItem(navSection, navSectionSearchItem);
        navSection.addEventListener('mouseover', () => {
          if (isDesktop.matches) {
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', 'true');
          }
        });
        navSection.addEventListener('mouseout', () => {
          if (isDesktop.matches) {
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', 'false');
          }
        });
      });
    } else {
      const mainUL = navSections.querySelector(':scope .default-content-wrapper > ul');
      decorateNavItemMobile(mainUL);
      mainUL.querySelectorAll('details').forEach((details) => {
        details.addEventListener('toggle', (event) => {
          if (event.target.open) {
            const value = findLevel(event.target);
            event.target.querySelector('ul').querySelectorAll(':scope > details').forEach((ele) => {
              ele.querySelector('summary').classList.add(`itemcolor${value + 1}`);
            });
            details.parentElement.querySelectorAll('details').forEach((ele) => {
              if (ele !== event.target) {
                ele.removeAttribute('open');
              }
            });
          }
        });
      });
    }
    if (navSectionSearchItem) {
      navSectionSearchItem.remove();
    }
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  let navSections = nav.querySelector('.nav-sections');
  const navSectionsBackUp = navSections.cloneNode(true);

  buildNavSections(navSections);

  // Logic for resizing nav sections

  function resizeNavSections(navSec, navSecBackUp) {
    if (navSecBackUp) {
      const navSectionSearchItem = navSecBackUp.children[0]?.children[1];
      if (isDesktop.matches && navSec.querySelector('details')) {
        const header = document.querySelector('header');
        if (header.classList.contains('mobile')) {
          header.classList.remove('mobile');
        }
        navSections.remove();
        navSections = navSecBackUp.cloneNode(true);
        navSections.querySelector('p').remove();
        navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
          if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
          decorateNavItem(navSection, navSectionSearchItem);
          navSection.addEventListener('mouseover', () => {
            if (isDesktop.matches) {
              toggleAllNavSections(navSections);
              navSection.setAttribute('aria-expanded', 'true');
            }
          });
          navSection.addEventListener('mouseout', () => {
            if (isDesktop.matches) {
              toggleAllNavSections(navSections);
              navSection.setAttribute('aria-expanded', 'false');
            }
          });
        });
        navBrand.after(navSections);
      }
      if (!isDesktop.matches && navSec.querySelector('li') && navSec.querySelector('li').classList.contains('nav-drop')) {
        const header = document.querySelector('header');
        if (!header.classList.contains('mobile')) {
          header.classList.add('mobile');
        }
        navSections.remove();
        navSections = navSecBackUp.cloneNode(true);
        navSections.querySelector('p').remove();
        const mainUL = navSections.querySelector(':scope .default-content-wrapper > ul');
        decorateNavItemMobile(mainUL);
        mainUL.querySelectorAll('details').forEach((details) => {
          details.addEventListener('toggle', (event) => {
            if (event.target.open) {
              const value = findLevel(event.target);
              event.target.querySelector('ul').querySelectorAll(':scope > details').forEach((ele) => {
                ele.querySelector('summary').classList.add(`itemcolor${value + 1}`);
              });
              details.parentElement.querySelectorAll('details').forEach((ele) => {
                if (ele !== event.target) {
                  ele.removeAttribute('open');
                }
              });
            }
          });
        });
        navBrand.after(navSections);
      }
      if (navSectionSearchItem) {
        navSectionSearchItem.remove();
      }
    }
  }

  function resizeFunction() {
    resizeNavSections(navSections, navSectionsBackUp.cloneNode(true));
  }

  window.addEventListener('resize', resizeFunction);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    // eslint-disable-next-line max-len
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop; // For broader compatibility
    if (scrollTop > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  handleNavTools(navWrapper);
  // improve accessibility
  document.querySelectorAll('#nav > div.section.nav-sections > div > ul > li').forEach((li) => {
    li.removeAttribute('role');
  });
}
