/* global WebImporter */
/* eslint-disable no-console */

export const PREVIEW_DOMAIN = 'https://main--clarkcountynv--aemsites.aem.page';
const METADATA_ALLOWED_KEYS = ['template', 'breadcrumbs-base', 'page-title', 'breadcrumbs-title-override',
  'backgroundImageUrl', 'category', 'publishDate', 'title', 'brief', 'bannerUrl',
  'featuredImage', 'divisionName', 'eventStart', 'eventStop', 'daysOfWeek',
  'freq', 'duration', 'excludeDates', 'featuredTitle', 'featuredDescription', 'readMore', 'allDay', 'year'];

const videoExtensions = [
  'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', '3gp', 'rm',
  'vob', 'mpeg', 'mpg', 'divx', 'm2ts', 'mts', 'mxf', 'ogv',
];

const audioExtensions = [
  'mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma', 'alac',
  'aiff', 'pcm', 'opus', 'amr',
];

export const WEBFILES_DOMAIN = 'https://webfiles.clarkcountynv.gov';

export const createMetadata = (main, document, params) => {
  const meta = {};

  const title = params.title || document.querySelector('title');
  if (title) {
    meta.Title = params.title || title.textContent.replace(/[\n\t]/gm, '');
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
  image.src = 'http://localhost:3000/assets/images/general/media_1cd00e6d663e3a8f17a6a71845a2d09cc41f55b6d.png';
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
  path = path.replaceAll(/[,!]/g, '');
  const pathParts = path.split('/');
  pathParts[pathParts.length - 1] = WebImporter.FileUtils.sanitizeFilename(
    pathParts[pathParts.length - 1],
  );
  return pathParts.join('/');
};

export const getSanitizedPath = (url) => {
  if (!url) {
    return url;
  }

  if (url && (url.endsWith('.pdf') || url.endsWith('.mp3') || url.endsWith('.mp4') || url.endsWith('.MP3') || url.endsWith('.MP4') || url.startsWith('mailto') || url.startsWith('tel:') || url.endsWith('.docx'))) {
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

  [path] = path.split('#');
  path = path.endsWith('.php') ? path.slice(0, -4) : path;
  path = path.replaceAll(/[,!]/g, '');
  const pathParts = path.split('/');
  if (pathParts[pathParts.length - 1] === 'index') {
    pathParts.pop();
    return `${pathParts.join('/')}/`;
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

/**
 *
 * @param main : HTMLDivElement
 * @param results : Final results array for importer
 * @param assetPath = sub directory to store assets -
 * Ex. "governement/department", "residents", "residents/dir1"
 */
export const fixPdfLinks = (main, results, pagePath, assetPath = 'general') => {
  if (!main) {
    return;
  }
  const EXCLUDE_EXTENSIONS = ['php', 'gov', 'org'];
  const WEBFILES_DOMAINS = ['www.clarkcountynv.gov', 'localhost', 'webfiles.clarkcountynv.gov', 'files.clarkcountynv.gov'];

  main.querySelectorAll('a').forEach((a) => {
    let href = a.getAttribute('href')?.replace('gov//', 'gov/');
    if (!href) {
      return;
    }
    href = href.replaceAll(/[,!]/g, '');
    const url = new URL(href, window.location.origin);
    const extension = url.pathname.split('.').pop().toLowerCase();
    if (href) {
      const isVideo = videoExtensions.some((ext) => extension === (`${ext}`));
      const isAudio = audioExtensions.some((ext) => extension === (`${ext}`));
      if (isVideo || isAudio) {
        console.log('The URL points to a video/audio file.');
        if (['https://clarkcountynv.gov', 'localhost'].find((domain) => url.origin.includes(domain))) {
          a.setAttribute('href', new URL(url.pathname, WEBFILES_DOMAIN).toString());
        }
      } else if (extension === 'pdf' || extension === 'docx' || extension === 'pptx') {
        if (url.hostname !== 'www.clarkcountynv.gov' && url.hostname !== 'localhost' && url.hostname !== 'webfiles.clarkcountynv.gov' && url.hostname !== 'files.clarkcountynv.gov' && url.hostname !== 'maps.clarkcountynv.gov') {
          return;
        }
        const originalLocation = new URL(url.pathname, WEBFILES_DOMAINS.includes(url.hostname)
          ? WEBFILES_DOMAIN : url.origin);
        const newPath = `/assets/documents/${assetPath}${WebImporter.FileUtils.sanitizePath(`/${originalLocation.pathname.split('/').pop()}`)}`;

        results.push({
          path: newPath,
          from: originalLocation.toString(),
        });
        a.setAttribute('href', new URL(newPath, PREVIEW_DOMAIN).toString());
      } else if (!EXCLUDE_EXTENSIONS.includes(extension)) {
        console.log(`Link with extension - ${extension} found. Skipping import`);
      }
    }
  });
};

export const getCardsImagePath = (src) => {
  const imagePath = new URL(src).pathname;
  const u = new URL(imagePath, WEBFILES_DOMAIN);
  return u.toString();
};

export const buildSectionMetadata = (cells) => WebImporter.Blocks.createBlock(document, {
  name: 'Section Metadata',
  cells: [...cells],
});

export const getDesktopBgBlock = (imagePath) => buildSectionMetadata([
  ['Bg-image', imagePath !== '' ? imagePath : ''],
  ['Style', 'Desktop, homepage, short'],
]);

export const getMobileBgBlock = (imagePath) => buildSectionMetadata([
  ['Bg-image', imagePath !== '' ? imagePath : ''],
  ['Style', 'Mobile, homepage, short'],
]);

export const blockSeparator = () => {
  const p = document.createElement('p');
  p.innerText = '---';
  return p;
};

export const setPageTitle = (main, params) => {
  const pageTitleEl = main.querySelector('#page-title');
  if (pageTitleEl) {
    const pageHeading = pageTitleEl.textContent.trim();
    if (pageHeading.length > 0) {
      params['page-title'] = pageHeading;
      pageTitleEl.remove();
    }
  }
};

export const fixImageSrcPath = (src, results, imagePath = 'general') => {
  const url = new URL(src, window.location.origin);
  const originalLocation = new URL(url.pathname, WEBFILES_DOMAIN);
  const newPath = `/assets/images/${imagePath}${WebImporter.FileUtils.sanitizePath(`/${originalLocation.pathname.split('/').pop()}`)}`.toLowerCase();

  results.push({
    path: newPath,
    from: originalLocation.toString(),
    report: {
      'img-new-sp': newPath,
      'img-original': originalLocation.toString(),
    },
  });
  return new URL(newPath, PREVIEW_DOMAIN).toString();
};

export const fixLinks = (main, results, imagePath, shouldCheckTextIsLink = true) => {
  if (!main) {
    return;
  }
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) {
      return;
    }

    if (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png') || href.endsWith('.gif')) {
      const imgUrl = fixImageSrcPath(href, results, imagePath);
      a.setAttribute('href', imgUrl);
      return;
    }

    const link = getSanitizedPath(href);
    if (shouldCheckTextIsLink && a.textContent.trim().search(href) !== -1) {
      a.innerText = new URL(link, PREVIEW_DOMAIN).toString();
    }
    a.setAttribute('href', new URL(link, PREVIEW_DOMAIN).toString());
  });
};

export function normalizeFolderName(str) {
  return str.trim().toLowerCase().replaceAll(' ', '_');
}

export const fixImageLinks = (main, results, imagePath = 'general') => {
  main.querySelectorAll('img').forEach((image) => {
    let src = image.getAttribute('src');
    src = src.replaceAll(/[,!]/g, '');
    const newSrcPath = fixImageSrcPath(src, results, imagePath);
    image.setAttribute('src', newSrcPath);
  });
};

export const getPreviewDomainLink = (url) => {
  const u = new URL(url, window.location.origin);
  if (u.hostname === 'www.clarkcountynv.gov' || u.hostname === 'localhost') {
    return `${PREVIEW_DOMAIN}${u.pathname}`;
  }
  return url;
};

export const rightSectionFixes = (main) => {
  // change subheader to h2
  main.querySelectorAll('p.subheader, span.subheader').forEach((el) => {
    const allowedTags = ['STRONG', 'P'];
    const hasInvalidChildren = Array.from(el.children).some(
      (child) => !allowedTags.includes(child.tagName),
    );
    if (hasInvalidChildren) {
      return;
    }
    const h2El = document.createElement('h2');
    h2El.innerText = el.textContent.trim();
    el.replaceWith(h2El);
  });

  main.querySelectorAll('img').forEach((el) => {
    const aEl = document.createElement('a');
    aEl.href = el.src;
    aEl.innerText = el.src;
    el.replaceWith(aEl);
  });
};

export const extractBackgroundImageUrl = (element) => {
  const dataStyle = element.getAttribute('data-style');
  const urlMatch = dataStyle.match(/url\(['"]?([^'")]+)['"]?\)/);

  if (urlMatch && urlMatch[1]) {
    const backgroundImageUrl = urlMatch[1];
    console.log('Background Image URL:', backgroundImageUrl);
    return backgroundImageUrl;
  }
  console.log('No background image URL found.');

  return null;
};
