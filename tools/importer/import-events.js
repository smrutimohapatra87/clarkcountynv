/* global WebImporter */
/* eslint-disable no-console */
import {
  createMetadata,
  blockSeparator,
  buildSectionMetadata,
  PREVIEW_DOMAIN, WEBFILES_DOMAIN, getSanitizedPath,
} from './utils.js';

function parseRRule(rruleString) {
  const rruleLines = rruleString.split('\n');
  let frequency = '';
  let daysOfWeek = '';
  let excludeDates = [];
  let until = '';

  rruleLines.forEach((line) => {
    if (line.startsWith('RRULE:')) {
      const ruleParts = line.replace('RRULE:', '').split(';');
      let byDay = '';
      let bySetPos = '';

      ruleParts.forEach((part) => {
        const [key, value] = part.split('=');

        if (key === 'FREQ') {
          frequency = value;
        } else if (key === 'BYDAY') {
          byDay = value;
        } else if (key === 'BYSETPOS') {
          bySetPos = value;
        } else if (key === 'UNTIL') {
          // Convert UNTIL from format like 20250826T130000Z to 2025-08-26T13:00:00
          const dateStr = value.replace('Z', '');
          until = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${dateStr.substring(9, 11)}:${dateStr.substring(11, 13)}:${dateStr.substring(13, 15)}`;
        }
      });

      // Handle both cases
      if (byDay && bySetPos) {
        daysOfWeek = `${byDay}(${bySetPos})`;
      } else if (byDay) {
        daysOfWeek = byDay;
      }
    } else if (line.startsWith('EXDATE:')) {
      excludeDates = line.replace('EXDATE:', '')
        .split(',')
        .map((date) => date.substring(0, 8)) // Extract YYYYMMDD
        .map((date) => `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`); // Format YYYY-MM-DD
    }
  });

  return {
    frequency,
    daysOfWeek,
    until,
    excludeDates: excludeDates.join(', '),
  };
}

export const getEventBlock = (name) => buildSectionMetadata([
  ['Style', name], //
]);

export const createEmptyBlock = (name) => {
  const block = WebImporter.Blocks.createBlock(document, {
    name,
    cells: [[' ']],
  });
  return block;
};

function getNewImageLink(imageSrc, pathPrefix, results) {
  const originalLocation = new URL(imageSrc, WEBFILES_DOMAIN);
  const newPath = `/assets/images${pathPrefix}${WebImporter.FileUtils.sanitizePath(originalLocation.pathname.split('/').pop())}`.toLowerCase();
  results.push({
    path: newPath,
    from: originalLocation.toString(),
  });
  // Image end

  return new URL(newPath, PREVIEW_DOMAIN).toString();
}

function colorToDivisionMapping(color) {
  const colorMapping = {
    '#312222': 'Events',
    '#da80c1': 'County Commission District A',
    '#c0a6dd': 'County Commission District B',
    '#48e7e2': 'County Commissioners District C',
    '#7ad295': 'County Commissioners District D',
    '#d4dbb6': 'County Commissioners District E',
    '#f9a97f': 'County Commissioners District F',
    '#2619e4': 'County Commissioners District G',
    '#ff8600': 'Goodsprings Citizens Advisory Committee',
    '#37d84e': 'Laughlin TAB',
    '#7237d8': 'Lone Mountain Citizens Advisory Council',
    '#d837d2': 'Lower Kyle Canyon Citizens Advisory Committee',
    '#9d484d': 'Moapa Town Advisory Board',
    '#058089': 'Paradise Town Advisory Board',
    '#3a9500': 'Spring Valley Town Advisory Board',
    '#3c8c98': 'Winchester Town Advisory Board',
    '#d5cd70': 'Enterprise Town Advisory Board',
    '#89b5bc': 'Moapa Valley Town Advisory Board',
    '#fe0000': 'Red Rock Citizens Advisory Committee',
    '#37d891': 'Searchlight Town Advisory Board',
    '#b4ada6': 'Bunkerville Town Advisory Board',
    '#f3bbea': 'Mount Charleston Town Advisory Board',
    '#dadd32': 'Sunrise Manor Town Advisory Board',
    '#07caf7': 'Whitney Town Advisory Board',
    '#047c6d': 'C',
    '#9086d8': 'BCC',
    '#6aa85a': 'Mountain Springs Citizens Advisory Council',
    '#069874': 'Indian Springs Town Advisory Board',
    '#51277c': 'Sandy Valley Citizens Advisory Council Meeting',
    '#edf77f': 'County Manager',
    '#ddc08f': 'Parks and Recreation',
    '#37d847': 'Truancy Prevention Outreach Program',
    '#f26d1e': 'Mojave Max and DCP Outreach Events / Volunteer Opportunities',
  };

  return colorMapping[color] || '';
}

const DESCRIPTION = 'description';
const MAP_LOCATION = 'Map-location';
const EVENT_FOOTER = 'Event-footer';
const BASE_PATH = '/calendar/';
const BASE_MAP = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyC5cMe92Yw3JgHrkvgIyHgdS2lTsH4C95k&q=';

function isExternalLink(url) {
  const link = new URL(url, window.location.origin);
  const internalLinks = ['cms8.revize.com', 'www.clarkcountynv.gov', 'localhost'];
  return !internalLinks.some((domain) => link.hostname.includes(domain));
}

export default {

  transform: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const results = [];
    const eventToImport = params.originalURL.split('#')[1];

    // Read events.json from the same directory as import-events.js
    let eventsJsonData;

    try {
      // Using relative path since events.json is in the same directory
      const eventsJsonPath = new URL('./filtered_events.json', import.meta.url);
      const response = await fetch(eventsJsonPath);
      eventsJsonData = await response.json();
    } catch (error) {
      console.error('Error reading events.json:', error);
      eventsJsonData = {}; // Provide a default empty object in case of error
    }

    const eventJson = eventsJsonData[eventToImport];
    console.log('Processing event', eventJson);
    const pathPrefix = WebImporter.FileUtils.sanitizePath(
      BASE_PATH + eventJson.primary_calendar_name,
    );
    const newPagePath = `${pathPrefix}/${WebImporter.FileUtils.sanitizeFilename(eventJson.title.toLowerCase())}`;// '/' + eventJson.title.toLowerCase().replace(/ /g, '-');

    const main = document.createElement('body');

    // Hero Image start
    const imageEl = Document.parseHTMLUnsafe(eventJson.image).querySelector('img');
    const imageSrc = imageEl.src;
    let heroImgSrc = 'https://main--clarkcountynv--aemsites.aem.page/assets/images/calendar/default-event.jpg';
    if (imageSrc.search('/v2/images/placeholder.png') === -1) {
      heroImgSrc = getNewImageLink(imageSrc, pathPrefix, results);
    }
    const heroImage = document.createElement('a');
    heroImage.href = heroImgSrc;
    heroImage.textContent = heroImgSrc;
    main.append(heroImage);
    // Hero Image end

    main.append(createEmptyBlock('hero (date)'));
    main.append(createEmptyBlock('hero (time)'));
    main.append(getEventBlock('hero'));
    main.append(blockSeparator().cloneNode(true));
    main.append(getEventBlock('title'));
    // main.append(blockSeparator().cloneNode(true));
    // main.append(getEventBlock('image'));
    // main.append(blockSeparator().cloneNode(true));
    // main.append(getEventBlock(ADDRESS));
    main.append(blockSeparator().cloneNode(true));

    const descriptionEl = document.createElement('div');
    const desc = decodeURIComponent(eventJson.desc);
    descriptionEl.innerHTML = desc;
    const descImages = descriptionEl.querySelectorAll('img');
    descImages.forEach((descImg) => {
      const imgSrc = getNewImageLink(descImg.getAttribute('src'), pathPrefix, results);
      const imgLink = document.createElement('a');
      imgLink.href = imgSrc;
      imgLink.textContent = imgSrc;
      descImg.replaceWith(imgLink);
    });
    main.append(descriptionEl);
    main.append(getEventBlock(DESCRIPTION));
    main.append(blockSeparator().cloneNode(true));

    // main.append(getEventBlock(LOCATIONS));
    // main.append(blockSeparator().cloneNode(true));

    if (eventJson.location) { // if there is no location for ex. 4th July Independence day
      const mapEl = document.createElement('a');
      mapEl.href = BASE_MAP + encodeURI(eventJson.location);
      mapEl.textContent = BASE_MAP + encodeURI(eventJson.location);
      const mapEmbedBlock = WebImporter.Blocks.createBlock(document, {
        name: 'map-embed',
        cells: [[mapEl]],
      });
      main.append(mapEmbedBlock);
      main.append(getEventBlock(MAP_LOCATION));
      main.append(blockSeparator().cloneNode(true));
    }

    if (eventJson.url) {
      const readMoreLink = document.createElement('a');
      let finalReadMoreUrl;
      if (isExternalLink(eventJson.url)) {
        finalReadMoreUrl = eventJson.url;
      } else {
        let linkSrc = eventJson.url;
        if (linkSrc.startsWith('http://cms8.revize.com/revize/clarknv')) {
          linkSrc = eventJson.url.replace('http://cms8.revize.com/revize/clarknv', 'https://www.clarkcountynv.gov');
        }
        const sanitizedPath = new URL(getSanitizedPath(linkSrc), PREVIEW_DOMAIN);
        finalReadMoreUrl = new URL(sanitizedPath.pathname, PREVIEW_DOMAIN).toString();
      }
      readMoreLink.href = finalReadMoreUrl;
      readMoreLink.textContent = finalReadMoreUrl;
      main.append(readMoreLink);
      params.readMore = readMoreLink;
      results.push({
        path: newPagePath,
        report: {
          readMoreFrom: eventJson.url,
          readMoreTo: finalReadMoreUrl,
        },
      });
    }
    main.append(getEventBlock(EVENT_FOOTER));
    main.append(blockSeparator().cloneNode(true));

    params.eventStart = eventJson.start;
    if (!eventJson.end) {
      params.eventStop = eventJson.allDay ? eventJson.start : '';
      console.log('Event end not found. Setting eventStop to start date');
    } else {
      params.eventStop = eventJson.end;
    }
    params.duration = eventJson.duration ? `T${eventJson.duration}:00` : '';
    if (eventJson.rrule) {
      const rrule = parseRRule(eventJson.rrule);
      params.freq = rrule.frequency;
      params.daysOfWeek = rrule.daysOfWeek;
      params.excludeDates = rrule.excludeDates;
      params.eventStop = rrule.until || params.eventstop;
    }

    params.featuredImage = heroImage.cloneNode(true);
    params.template = 'event';
    params.divisionName = colorToDivisionMapping(eventJson.color)
      || eventJson.primary_calendar_name;
    params.featuredTitle = eventJson.title;
    params.title = eventJson.title;
    params.featuredDescription = descriptionEl.cloneNode(true);

    createMetadata(main, document, params);

    results.push({
      element: main,
      path: newPagePath,
    });

    return results;
  },
};
