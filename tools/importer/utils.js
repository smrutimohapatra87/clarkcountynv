/* global WebImporter */

export const PREVIEW_DOMAIN = 'https://main--clarkcountynv--aemsites.aem.page';
const METADATA_ALLOWED_KEYS = ['template', 'breadcrumbs-base', 'page-title', 'breadcrumbs-title-override',
  'backgroundImageUrl', 'category', 'publishDate', 'title', 'brief', 'bannerUrl'];
export const createMetadata = (main, document, params) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  if (params.preProcessMetadata && Object.keys(params.preProcessMetadata).length) {
    Object.assign(meta, params.preProcessMetadata);
  }

  METADATA_ALLOWED_KEYS.forEach((key) => {
    if (params[key]) {
      meta[key] = params[key];
    }
  });

  const image = document.createElement('img');
  image.src = `${PREVIEW_DOMAIN}/assets/images/logo.png`;
  meta.Image = image;
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

export const fixRelativeLinks = (document) => {
  document.querySelectorAll('a').forEach((a) => {
    const url = new URL(a.href);
    if (url.pathname) {
      a.href = PREVIEW_DOMAIN + url.pathname;
    }
  });
};

export const getImportPagePath = (url) => {
  let path = new URL(url).pathname;
  path = path.endsWith('.php') ? path.slice(0, -4) : path;
  const pathParts = path.split('/');
  pathParts[pathParts.length - 1] = WebImporter.FileUtils.sanitizeFilename(
    pathParts[pathParts.length - 1],
  );
  return pathParts.join('/');
};

export const getSanitizedPath = (url) => {
  if (url && (url.endsWith('.pdf') || url.endsWith('.mp3') || url.endsWith('.mp4') || url.endsWith('.MP3') || url.endsWith('.MP4'))) {
    return url;
  }

  let u;
  try {
    u = new URL(url);
    if (u.hostname && u.hostname !== 'www.clarkcountynv.gov' && u.hostname !== 'localhost') {
      return url;
    }
  } catch (error) {
    // noop
  }
  let path = url;

  path = path.endsWith('.php') ? path.slice(0, -4) : path;
  const pathParts = path.split('/');
  if (pathParts[pathParts.length - 1] === 'index') {
    pathParts.pop();
  }
  pathParts[pathParts.length - 1] = WebImporter.FileUtils.sanitizeFilename(
    pathParts[pathParts.length - 1],
  );
  return pathParts.join('/');
};

export const getPathSegments = (url) => (url.split('/').filter((segment) => segment));

export const fetchAndParseDocument = async (url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching and parsing document:', error);
  }
  return null;
};

export const fixPdfLinks = (main, results, assetType = '') => {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.endsWith('.pdf')) {
      const u = new URL(href, 'https://webfiles.clarkcountynv.gov');
      const newPath = WebImporter.FileUtils.sanitizePath(`/assets/documents/${assetType ? `/${assetType}/` : ''}${u.pathname.split('/').pop()}`);
      results.push({
        path: newPath,
        from: u.toString(),
      });

      a.setAttribute('href', new URL(newPath, PREVIEW_DOMAIN));
    }
  });
};

export const fixAudioLinks = (main) => {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && (href.toLowerCase().search('.mp3') !== -1 || href.toLowerCase().search('.mp4') !== -1)) {
      const u = new URL(href, 'https://webfiles.clarkcountynv.gov');
      a.setAttribute('href', u.toString());
    }
  });
};

export const getCardsImagePath = (src) => {
  const imagePath = new URL(src).pathname;
  const u = new URL(imagePath, 'https://webfiles.clarkcountynv.gov');
  return u.toString();
};

export const buildSectionMetadata = (cells) => WebImporter.Blocks.createBlock(document, {
  name: 'Section Metadata',
  cells: [...cells],
});

export const getDesktopBgBlock = (imageName = 'slide1.jpg') => buildSectionMetadata([
  ['Bg-image', `${PREVIEW_DOMAIN}/assets/images/${imageName}`],
  ['Style', 'Desktop, homepage, short'],
]);

export const getMobileBgBlock = (imageName = 'slide1.jpg') => buildSectionMetadata([
  ['Bg-image', `${PREVIEW_DOMAIN}/assets/images/${imageName}`],
  ['Style', 'Mobile, homepage, short'],
]);

export const blockSeparator = () => {
  const p = document.createElement('p');
  p.innerText = '---';
  return p;
};

export const setPageTitle = (main, params) => {
  const pageTitleEl = main.querySelector('#page-title');
  const pageHeading = pageTitleEl.textContent.trim();
  if (pageHeading.length > 0) {
    params['page-title'] = pageHeading;
    pageTitleEl.remove();
  }
};

export const fixLinks = (main) => {
  main.querySelectorAll('a').forEach((a) => {
    const href = getSanitizedPath(a.getAttribute('href'));
    a.setAttribute('href', href);
  });
};

export const getPreviewDomainLink = (url) => {
  const u = new URL(url, window.location.origin);
  if (u.hostname === 'www.clarkcountynv.gov' || u.hostname === 'localhost') {
    return `${PREVIEW_DOMAIN}${u.pathname}`;
  }
  return url;
};
