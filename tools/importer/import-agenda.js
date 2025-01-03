/* global WebImporter */
import {
  PREVIEW_DOMAIN, createMetadata,
} from './utils.js';

function fixPdfLinks(main, results) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.endsWith('.pdf')) {
      const u = new URL(href, 'https://webfiles.clarkcountynv.gov');
      const newPath = WebImporter.FileUtils.sanitizePath(`/assets/documents/agenda/${u.pathname.split('/').pop()}`);
      results.push({
        path: newPath,
        from: u.toString(),
      });

      a.setAttribute('href', new URL(newPath, PREVIEW_DOMAIN));
    }
  });
}

function fixAudioLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && (href.toLowerCase().search('.mp3') !== -1 || href.toLowerCase().search('.mp4') !== -1)) {
      const u = new URL(href, 'https://webfiles.clarkcountynv.gov');
      a.setAttribute('href', u.toString());
    }
  });
}

function breadcrumbUrl(main, results, newPath) {
  const parts = [];
  const breadcrumbsUl = main.querySelectorAll('li');
  breadcrumbsUl.forEach((li) => {
    parts.push(li.textContent.trim());
  });
  const category = parts.join(' > ');
  results.push({
    path: newPath,
    report: {
      crumbs: category,
    },
  });

  switch (category) {
    case 'Home > Government > Department Directory > Administrative Services > ':
    case 'Home > Government > Department Directory > Administrative Services > Lone Mountain':
    case 'Home > Government > Department Directory > Administrative Services > Regular Meeting':
      return 'agenda-breadcrumbs-admin-services';
    case 'Home > Government > Department Directory > Administrative Services > Asian-American and Pacific Islanders Community Commission > Regular Meeting':
    case 'Home > Government > Department Directory > Administrative Services > Asian-American and Pacific Islanders Community Commission > Special Meeting':
      return 'agenda-breadcrumbs-community-commission';
    case 'Home > Government > Department Directory > Administrative Services > Laughlin Administrative Offices > Laughlin Town Advisory Board > Regular Meeting':
      return 'agenda-breadcrumbs-laughlin';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Enterprise TAB > ':
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Enterprise TAB > Regular Meeting':
      return 'agenda-breadcrumbs-town-enterprise';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Indian Springs TAB > Regular Meeting':
      return 'agenda-breadcrumbs-town-indian';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Moapa Valley TAB > Regular Meeting':
      return 'agenda-breadcrumbs-town-moapa';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Paradise TAB > Meeting Cancelled':
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Paradise TAB > Regular Meeting':
      return 'agenda-breadcrumbs-town-paradise';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Red Rock CAC > Regular Meeting':
      return 'agenda-breadcrumbs-town-red';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Sandy Valley CAC > Regular Meeting':
      return 'agenda-breadcrumbs-town-sandy';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Spring Valley TAB > Regular Meeting':
      return 'agenda-breadcrumbs-town-spring';
    case 'Home > Government > Department Directory > Administrative Services > Town & Liaison Services > Town Advisory Boards and Citizens Advisory Councils > Sunrise Manor TAB > Regular Meeting':
      return 'agenda-breadcrumbs-town-sunrise';
    case 'Home > Government > Department Directory > Environment and Sustainability > Division of Air Quality > Compliance & Enforcement > Enforcement Notices > Air Pollution Control Hearing Board':
      return 'agenda-breadcrumbs-environment';
    case 'Home > Government > Department Directory > Air Quality Management > CCOHV Advisory Committee > Meeting Agendas, Minutes & Audio > ':
    case 'Home > Government > Department Directory > Air Quality Management > CCOHV Advisory Committee > Meeting Agendas, Minutes & Audio > (cancelled)':
    case 'Home > Government > Department Directory > Air Quality Management > CCOHV Advisory Committee > Meeting Agendas, Minutes & Audio > Cancelled':
      return 'agenda-breadcrumbs-air-quality';
    case 'Home > Residents > Family Services > Independent Living Meeting Agendas > ':
      return 'agenda-breadcrumbs-residents';
    default:
      return 'agenda-breadcrumbs-admin-services';
  }
}

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const results = [];

    const breadcrumbsEl = main.querySelector('#breadcrumbs');

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'section', // hero background image
      'noscript',
      '#main',
      '#skip', // skip to main content
      '.modal', // share button modal
      '#goog-gt-tt', // google translation
      '.uwy.userway_p5.utb',
    ]);

    let path = new URL(params.originalURL).pathname;
    path = path.endsWith('.php') ? path.slice(0, -4) : path;
    const newPath = WebImporter.FileUtils.sanitizePath(path);

    // Handle all PDFs
    fixPdfLinks(main, results);
    fixAudioLinks(main);

    const blockSeparator = document.createElement('p');
    blockSeparator.innerText = '---';

    const pageTitleEl = main.querySelector('#page-title');
    const pageHeading = pageTitleEl.textContent.trim();
    if (pageHeading.length > 0) {
      params['page-title'] = pageHeading;
      pageTitleEl.remove();
    }

    const desktopBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['Bg-image', `${PREVIEW_DOMAIN}/assets/images/slide1.jpg`],
        ['Style', 'Desktop, homepage, short'],
      ],
    });
    const mobileBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['Bg-image', `${PREVIEW_DOMAIN}/assets/images/slide1.jpg`],
        ['Style', 'Mobile, homepage, short'],
      ],
    });

    main.insertBefore(blockSeparator.cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator.cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);

    const agendaDetailSectionMetadata = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['Style', 'agendadetail'],
      ],
    });

    main.append(agendaDetailSectionMetadata);
    main.append(blockSeparator.cloneNode(true));

    params.template = 'agenda';

    const breadcrumbsUrl = breadcrumbUrl(breadcrumbsEl, results, newPath);
    params['breadcrumbs-base'] = `/agenda/${breadcrumbsUrl}`;// '/agenda/agenda-breadcrumbs';
    createMetadata(main, document, params);

    results.push({
      element: main,
      path: newPath,
    });
    return results;
  },
};
