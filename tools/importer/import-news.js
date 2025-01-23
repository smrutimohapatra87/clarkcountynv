/* global WebImporter */
import {
  createMetadata,
  fetchAndParseDocument,
  blockSeparator,
  getMobileBgBlock,
  getDesktopBgBlock,
  buildSectionMetadata,
  getImportPagePath,
  fixPdfLinks,
  setPageTitle,
  fixImageSrcPath,
  extractBackgroundImageUrl,
} from './utils.js';

const extractPageInfo = async (url, href, results) => {
  const doc = await fetchAndParseDocument(url);
  const page = href.split('/').pop();
  if (doc) {
    const { body } = doc;
    const a = body.querySelector(`a[href="${page}"]`);
    const container = a.closest('.news');

    const bannerEl = container.querySelector('.news-banner');
    const backgroundImage = WebImporter.DOMUtils.replaceBackgroundByImg(bannerEl, document);
    let bannerUrl;
    if (backgroundImage) {
      bannerUrl = fixImageSrcPath(backgroundImage.getAttribute('src'), results, 'general/news');
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

    const newPagePath = getImportPagePath(params.originalURL);
    const heroBackgroundEl = main.querySelector('div.tns-bg-slide');
    const backgroundImageUrl = extractBackgroundImageUrl(heroBackgroundEl);

    // Handle all PDFs
    fixPdfLinks(main, results, newPagePath, 'general/news');

    setPageTitle(main, params);

    /* Start for hero image */
    let imagePath = '';
    if (backgroundImageUrl.search('slide-1') === -1) {
      imagePath = fixImageSrcPath(backgroundImageUrl, results);
    }
    const desktopBlock = getDesktopBgBlock(imagePath);
    const mobileBlock = getMobileBgBlock(imagePath);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);

    /* End for hero image */
    main.append(buildSectionMetadata([['Style', 'newsdetail']]));
    main.append(blockSeparator().cloneNode(true));

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

    results.push({
      element: main,
      path: newPagePath,
    });

    return results;
  },
};
