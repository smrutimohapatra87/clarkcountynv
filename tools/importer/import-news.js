/* global WebImporter */
import {
  PREVIEW_DOMAIN, createMetadata, fetchAndParseDocument,
} from './utils.js';

function fixPdfLinks(main, results) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.endsWith('.pdf')) {
      const u = new URL(href, 'https://webfiles.clarkcountynv.gov');
      const newPath = WebImporter.FileUtils.sanitizePath(`/assets/documents/news/${u.pathname.split('/').pop()}`);
      results.push({
        path: newPath,
        from: u.toString(),
      });

      a.setAttribute('href', newPath);
    }
  });
}

function getBackgroundUrl(element) {
  if (!element || !element.style) {
    return null; // Return null if the element is invalid or doesn't have a style property
  }

  const backgroundStyle = element.style.background;
  const urlMatch = backgroundStyle.match(/url\(['"]?(.*?)['"]?\)/);

  // If a match is found, return the URL; otherwise, return null
  return urlMatch ? urlMatch[1] : null;
}

const extractPageInfo = async (url, href, results) => {
  const doc = await fetchAndParseDocument(url);
  const page = href.split('/').pop();
  if (doc) {
    const { body } = doc;
    const a = body.querySelector(`a[href="${page}"]`);
    const container = a.closest('.news');

    const bannerEl = container.querySelector('.news-banner');
    const backgroundImageUrl = getBackgroundUrl(bannerEl);
    let bannerUrl;
    if (backgroundImageUrl) {
      const u = new URL(backgroundImageUrl, 'https://webfiles.clarkcountynv.gov');
      const newPath = WebImporter.FileUtils.sanitizePath(`/assets/images/news/${u.pathname.split('/').pop()}`);
      bannerUrl = newPath;
      results.push({
        path: newPath,
        from: u.toString(),
      });
    }
    const publishDateEl = container.querySelector('.news-date');
    const categoryEl = publishDateEl.querySelector('span.news-category');
    let category;
    if (categoryEl) {
      category = categoryEl.textContent.trim();
      categoryEl.remove();
    }
    const publishDate = publishDateEl.textContent.replace(/-\s+/g, '').trim();
    const brief = container.querySelector('.news-brief').textContent.trim();

    return {
      bannerUrl,
      category,
      publishDate,
      brief,
    };
  }
  return {};
};

export default {

  transform: async ({
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

    const newsDetailSectionMetadata = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['Style', 'newsdetail'],
      ],
    });

    main.append(newsDetailSectionMetadata);
    main.append(blockSeparator.cloneNode(true));

    params.template = 'agenda';
    params['breadcrumbs-base'] = '/news/news-breadcrumbs';
    params['breadcrumbs-title-override'] = 'News Post';
    const listMetadata = await extractPageInfo(
      'http://localhost:3001/newslist.php?host=https://www.clarkcountynv.gov/newslist.php',
      params.originalURL,
      results,
    );

    Object.keys(listMetadata).forEach((key) => {
      if (listMetadata[key] && listMetadata[key].length > 0) {
        params[key] = listMetadata[key];
      }
    });

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
