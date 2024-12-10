/* global WebImporter */
import {
  PREVIEW_DOMAIN, createMetadata,
} from './utils.js';

function fixPdfLinks(main, results) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.endsWith('.pdf')) {
      const u = new URL(href, 'https://webfiles.clarkcountynv.gov');
      const newPath = WebImporter.FileUtils.sanitizePath(`/assets/documents/${u.pathname.split('/').pop()}`);
      results.push({
        path: newPath,
        from: u.toString(),
      });

      a.setAttribute('href', newPath);
    }
  });
}

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const results = [];

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

    // Handle all PDFs
    fixPdfLinks(main, results);

    const blockSeparator = document.createElement('p');
    blockSeparator.innerText = '---';

    const desktopBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['Bg-image', `${PREVIEW_DOMAIN}/assets/images/slide1.jpg`],
        ['Style ', 'Desktop, homepage, short'],
      ],
    });

    const mobileBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['Bg-image', `${PREVIEW_DOMAIN}/assets/images/slide1.jpg`],
        ['Style ', 'Mobile, homepage, short'],
      ],
    });

    const pageHeading = main.querySelector('#page-title');
    if (pageHeading.textContent.trim().length > 0) {
      const heroBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Hero (agenda)',
        cells: [
          [pageHeading.textContent.trim(), ''],
        ],
      });
      params['breadcrumbs-current'] = pageHeading.textContent.trim();
      main.querySelector('#page-title').remove();
      main.insertBefore(blockSeparator.cloneNode(true), main.firstChild);
      main.insertBefore(heroBlock, main.firstChild);
    }

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
    params['breadcrumbs-base'] = '/agenda/agenda-breadcrumbs';
    createMetadata(main, document, params);

    let path = new URL(params.originalURL).pathname;
    path = path.endsWith('.php') ? path.slice(0, -4) : path;
    const newPath = WebImporter.FileUtils.sanitizePath(path);
    results.push({
      element: main,
      path: newPath,
    });

    return results;
  },
};
