import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  div, img, span, a, button, details, summary, h2,
} from '../../scripts/dom-helpers.js';

function normalizeImage(str) {
  const imagePath = '/assets/images/google-translations/';
  return `${imagePath + str.replace(/[()]/g, '').replace(/[ ]/g, '-').toLowerCase()}.png`;
}

function hideGoogleTranslateBar() {
  document.body.style.top = 0;
  const element = document.querySelector('#\\:1\\.container');
  if (element) {
    element.classList.add('hidden');
  }
}

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');
const tracker = [];
class Accordion {
  constructor(el) {
    // Store the <details> element
    this.el = el;
    // Store the <summary> element
    this.summary = el.querySelector('summary');
    // Store the parent <details> element
    this.parent = el.parentElement.parentElement;
    // Store the <div class="content"> element
    this.content = el.querySelector('.content');

    // Store the animation object (so we can cancel it if needed)
    this.animation = null;
    // Store if the element is closing
    this.isClosing = false;
    // Store if the element is expanding
    this.isExpanding = false;
    // Detect user clicks on the summary element
    if (this.content) {
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }
  }

  onClick(e) {
    // Stop default behaviour from the browser
    e.preventDefault();
    // Add an overflow on the <details> to avoid content overflowing
    this.el.style.overflow = 'hidden';
    // Check if the element is being closed or is already closed
    if (this.isClosing || !this.el.open) {
      this.open();
    // Check if the element is being openned or is already open
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    // Set the element as "being closed"
    this.isClosing = true;
    // Store the current height of the element
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculate the height of the summary
    const endHeight = `${this.summary.offsetHeight}px`;
    // If there is already an animation running
    if (this.animation) {
      // Cancel the current animation
      this.animation.cancel();
    }
    // Start a WAAPI animation
    this.animation = this.el.animate({
      // Set the keyframes from the startHeight to endHeight
      height: [startHeight, endHeight],
    }, {
      duration: 500,
      easing: 'ease-out',
    });
    // When the animation is complete, call onAnimationFinish()
    this.animation.onfinish = () => this.onAnimationFinish(false);
    // If the animation is cancelled, isClosing variable is set to false
    // eslint-disable-next-line no-return-assign
    this.animation.oncancel = () => this.isClosing = false;
  }

  open() {
    // Apply a fixed height on the element
    this.el.style.height = `${this.el.offsetHeight}px`;
    // Force the [open] attribute on the details element
    this.el.open = true;
    // Wait for the next frame to call the expand function
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    // Set the element as "being expanding"
    this.isExpanding = true;
    // Get the current fixed height of the element
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculate the open height of the element (summary height + content height)
    const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

    // If there is already an animation running
    if (this.animation) {
      // Cancel the current animation
      this.animation.cancel();
    }

    // Start a WAAPI animation
    this.animation = this.el.animate({
      // Set the keyframes from the startHeight to endHeight
      height: [startHeight, endHeight],
    }, {
      duration: 500,
      easing: 'ease-out',
    });
    // When the animation is complete, call onAnimationFinish()
    this.animation.onfinish = () => this.onAnimationFinish(true);
    // If the animation is cancelled, isExpanding variable is set to false
    // eslint-disable-next-line no-return-assign
    this.animation.oncancel = () => this.isExpanding = false;
  }

  onAnimationFinish(open) {
    // Set the open attribute based on the parameter
    this.el.open = open;
    // Clear the stored animation
    this.animation = null;
    // Reset isClosing & isExpanding
    this.isClosing = false;
    this.isExpanding = false;
    // Remove the overflow hidden and the fixed height
    this.el.style.height = '';
    this.el.style.overflow = '';
  }
}

function decorateGoogleTranslator(languageTool) {
  languageTool.querySelectorAll('li').forEach((li, i) => {
    const textArray = li.textContent.split(' ');
    const dataCode = textArray[0];
    const dataLang = textArray[1];
    textArray.splice(0, 2);
    const dataText = textArray.join(' ');
    const aTag = a({ class: `${dataLang}` }, dataText);
    aTag.setAttribute('data-code', dataCode);
    aTag.setAttribute('data-lang', dataLang);
    li.innerHTML = '';
    li.appendChild(aTag);
    if (i === 0) {
      li.classList.add('selected');
    }
  });
}

function letsTranslate(ele) {
  const selectField = document.querySelector('select.goog-te-combo');
  selectField.value = ele.querySelector('a').getAttribute('data-lang');
  selectField.dispatchEvent(new Event('change'));
  hideGoogleTranslateBar();
}

function handleNavTools(navWrapper, expandElement) {
  let buttonInnerText = 'English';
  let imgSrc = normalizeImage('english');
  const tools = [];
  tools[0] = navWrapper.querySelector('.nav-tools .default-content-wrapper p');
  tools[1] = navWrapper.querySelector('.nav-tools .default-content-wrapper ul');
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
    languageDiv.setAttribute('id', 'google-translate-wrap');
    const languageDiv1 = div({ class: 'google-translate' });
    languageDiv1.setAttribute('id', 'google_translate_element');
    languageDiv.appendChild(languageDiv1);
    decorateGoogleTranslator(languageTool);
    const languageButton = button({ class: 'translate-button' }, span('US'), img());
    languageButton.querySelector('img').src = normalizeImage('english');
    languageDiv.appendChild(languageButton);
    languageDiv.appendChild(languageTool);
    languageTool.querySelectorAll('li').forEach((ele, _, lis) => {
      ele.addEventListener('click', () => {
        buttonInnerText = ele.querySelector('a').getAttribute('data-code');
        imgSrc = ele.querySelector('a').getAttribute('data-lang');
        languageButton.querySelector('span').textContent = buttonInnerText;
        languageButton.querySelector('img').src = normalizeImage(imgSrc);
        lis.forEach((li) => {
          li.classList.toggle('selected', li === ele);
        });
        letsTranslate(ele);
      });
    });
    languageButton.addEventListener('click', () => {
      languageTool.classList.toggle('show');
    });
    const navToolsDiv = div({ class: 'nav-tools' });
    navToolsDiv.appendChild(searchDiv);
    navToolsDiv.appendChild(languageDiv);
    expandElement.appendChild(navToolsDiv);
    nav.appendChild(expandElement);
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
  navSections.querySelectorAll('details[open]').forEach((detail) => {
    detail.removeAttribute('open');
  });
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const $button = nav.querySelector('.nav-hamburger button');
  // document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  $button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', '$button');
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
  mainUL.classList.add('content');
  const header = document.querySelector('header');
  header.classList.add('mobile');
  const mainLIs = mainUL.children;
  for (let i = 0; i < mainLIs.length; i += 1) {
    const mainLI = mainLIs[i];
    const mainA = mainLI.querySelector('a');

    const $details = details({ class: 'accordion-item' });

    const $summary = summary({ class: 'accordion-item-label' });
    const labelRight = div({ class: 'markerdiv' });
    const lablDiv = div();
    lablDiv.append(mainA, labelRight);
    $summary.append(lablDiv);

    const childUL = mainLI.querySelector('ul');

    if (childUL) {
      $details.append($summary, childUL);
      mainLI.replaceWith($details);
      decorateNavItemMobile(childUL);
    } else {
      $details.append($summary);
      mainLI.replaceWith($details);
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
  const menuUl = div({ class: 'menuul' });
  const navIn = div({ class: 'nav-in' });
  const navContent = div({ class: 'nav-content' });
  const navContentIn = div({ class: 'nav-content-in' });
  const navPageTitle = h2();
  navPageTitle.className = 'nav-page-title';
  navPageTitle.textContent = parent.querySelector('strong').textContent;
  const closeSpan = span();
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

  const navInMenuWrap = div({ class: 'nav-in-menu-wrap' });
  navIn.append(navInMenuWrap);

  const tablist = div({ class: 'tabs-list' });
  tablist.setAttribute('role', 'tablist');

  navInMenuWrap.append(tablist);

  const list = parent.children[1].nodeName === 'UL' ? parent.children[1].children : null;
  const listLen = list !== null ? list.length : 0;
  let i = 0;
  while (i < listLen) {
    const tabInfo = list.item(i);
    const id = toClassName(tabInfo.querySelector('a').textContent);

    const tabpanel = div();
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
    const $button = button({ class: 'tabs-tab' });
    $button.id = `tab-${id}`;
    $button.innerHTML = tabInfo.innerHTML;
    $button.setAttribute('aria-controls', `tabpanel-${id}`);
    $button.setAttribute('aria-selected', !i);
    $button.setAttribute('role', 'tab');
    $button.setAttribute('type', 'button');
    $button.addEventListener('mouseover', () => {
      parent.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      $button.setAttribute('aria-selected', true);
    });
    tablist.append($button);
  }

  const navBottom = div({ class: 'nav-bottom' });
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
      mainUL.querySelectorAll('details').forEach((detail) => {
        detail.addEventListener('toggle', (event) => {
          if (event.target.open) {
            const value = findLevel(event.target);
            event.target.querySelector('ul').querySelectorAll(':scope > details').forEach((ele) => {
              ele.querySelector('summary').classList.add(`itemcolor${value + 1}`);
              ele.querySelector('summary').classList.add(`child${value + 1}`);
              ele.classList.add(`parent${value + 1}`);
            });
            detail.parentElement.querySelectorAll('details').forEach((ele) => {
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

  function resizeNavSections(navSec, navSecBackUp, expandElement) {
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
        expandElement.prepend(navSections);
        navBrand.after(expandElement);
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
        mainUL.querySelectorAll('details').forEach((detail) => {
          detail.addEventListener('toggle', (event) => {
            if (event.target.open) {
              const value = findLevel(event.target);
              event.target.querySelector('ul').querySelectorAll(':scope > details').forEach((ele) => {
                ele.querySelector('summary').classList.add(`itemcolor${value + 1}`);
              });
              detail.parentElement.querySelectorAll('details').forEach((ele) => {
                if (ele !== event.target) {
                  ele.removeAttribute('open');
                }
              });
            }
          });
        });
        expandElement.prepend(navSections);
        navBrand.after(expandElement);
        nav.querySelectorAll('details').forEach((el) => {
          const detailObject = new Accordion(el);
          tracker.push(detailObject);
        });
        tracker.forEach((t) => {
          t.el.addEventListener('click', () => {
            tracker.forEach((t2) => {
              if (t2 !== t && !t.parent.isEqualNode(t2.el)) {
                t2.shrink();
              }
            });
          });
        });
      }
      if (navSectionSearchItem) {
        navSectionSearchItem.remove();
      }
    }
  }

  // expand element for nav-sections & nav-tools
  const expandElement = div({ class: 'expanddiv' });
  expandElement.appendChild(navSections);
  nav.appendChild(expandElement);

  function resizeFunction() {
    resizeNavSections(navSections, navSectionsBackUp.cloneNode(true), expandElement);
  }

  window.addEventListener('resize', resizeFunction);

  // hamburger for mobile
  const hamburger = div({ class: 'nav-hamburger' });
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = div({ class: 'nav-wrapper' });
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
  handleNavTools(navWrapper, expandElement);
  // improve accessibility
  document.querySelectorAll('#nav > div.section.nav-sections > div > ul > li').forEach((li) => {
    li.removeAttribute('role');
  });

  nav.querySelectorAll('details').forEach((el) => {
    const detailObject = new Accordion(el);
    tracker.push(detailObject);
  });
  tracker.forEach((t) => {
    t.el.addEventListener('click', () => {
      tracker.forEach((t2) => {
        if (t2 !== t && !t.parent.isEqualNode(t2.el)) {
          t2.shrink();
        }
      });
    });
  });
}
