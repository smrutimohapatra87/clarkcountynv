import {
  div, iframe, section, p, button, a, ul, li,
} from '../../scripts/dom-helpers.js';

import { normalizeString, getWindowSize } from '../../scripts/utils.js';

class Obj {
  // eslint-disable-next-line max-len
  constructor(title, start, end, allDay, daysOfWeek, startTime, endTime, url, backgroundColor, textColor, classNames, readMore, divisionid, excludeDates, duration, freq) {
    this.title = title;
    this.start = start;
    this.end = end;
    this.allDay = allDay;
    this.daysOfWeek = daysOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.url = url;
    this.backgroundColor = backgroundColor;
    this.textColor = textColor;
    this.classNames = classNames;
    this.readMore = readMore;
    this.divisionid = divisionid;
    this.excludeDates = excludeDates;
    this.duration = duration;
    this.freq = freq;
  }
}

let deepLinkDay = 0;
let deepLinkMonth = 0;
let deepLinkYear = 0;
let deepLinkView = '';
const today = new Date();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();

export function mobilecheck() {
  const { width } = getWindowSize();
  if (width >= 900) {
    return false;
  }
  return true;
}

let calendar = null;
let events = [];
let calendarEl = null;

let divisions = [];
let placeholders = [];

// Fetching events from individual calendar sheets
export async function fetchPlaceholders(prefix) {
  window.placeholders = window.placeholders || {};
  const TRANSLATION_KEY = prefix;
  const loaded = window.placeholders[`${TRANSLATION_KEY}-loaded`];

  if (!loaded) {
    window.placeholders[`${TRANSLATION_KEY}-loaded`] = new Promise((resolve) => {
      fetch(`/calendar/${prefix}.json?sheet=default&sheet=divisions`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          window.placeholders.calendarevents = json.default;
          window.placeholders.divisions = json.divisions;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  await window.placeholders[`${TRANSLATION_KEY}-loaded`];
  return window.placeholders;
}

function createModal(doc) {
  const modal = div({ class: 'event-modal' }, div(
    { class: 'event-modal-content' },
    iframe({
      id: 'event-iframe',
      width: '100%',
      height: '100%',
    }),
    div({ class: 'event-modal-date' }, p(), p()),
    div({ class: 'event-modal-time' }, p()),
    div({ class: 'event-modal-footer' }, button({ class: 'close', onclick: () => { document.querySelector('.event-modal').style.display = 'none'; } }, 'Close'), a({ class: 'footer-readmore' }, 'Read More')),
  ));
  doc.body.append(modal);
}

function tConv24(time24) {
  let ts = time24;
  const H = +ts.substr(0, 2);
  let h = (H % 12) || 12;
  h = (h < 10) ? (`0${h}`) : h; // leading 0 at the left for 1 digit hours
  const ampm = H < 12 ? ' AM' : ' PM';
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
}

function popupEvent(url, startTime, endTime, allDay, backgroundColor, readMore) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE',
    'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
  let eventDate = startTime.getDate();
  if (eventDate < 10) {
    eventDate = `0${eventDate}`;
  }
  const eventMonth = startTime.getMonth();
  const eventStartHours = startTime.toString().split(' ')[4].split(':')[0];
  const eventStartMinutes = startTime.toString().split(' ')[4].split(':')[1];
  const eventStartTime = tConv24(`${eventStartHours}:${eventStartMinutes}`);

  let eventEndTime;
  if (endTime) { // for allDay event, endTime is not mandatory
    const eventEndHours = endTime.toString().split(' ')[4].split(':')[0];
    const eventEndMinutes = endTime.toString().split(' ')[4].split(':')[1];
    eventEndTime = tConv24(`${eventEndHours}:${eventEndMinutes}`);
  }

  // convert number into Month name
  const eventMonthName = months[eventMonth];

  const modal = document.querySelector('.event-modal');
  modal.querySelector('.event-modal-date').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-time').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer button.close').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer a').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer').classList.add('off');
  modal.querySelector('.event-modal-date p:first-child').textContent = `${eventDate}`;
  modal.querySelector('.event-modal-date p:last-child').textContent = `${eventMonthName}`;
  modal.querySelector('.event-modal-time p').textContent = allDay ? 'All Day' : `${eventStartTime} - ${eventEndTime}`;
  modal.querySelector('iframe').src = url;
  modal.style.display = 'block';
  const readMoreAEl = modal.querySelector('.event-modal-footer a.footer-readmore');
  if (readMoreAEl) {
    if (readMore.length > 1) {
      readMoreAEl.setAttribute('href', readMore);
      readMoreAEl.setAttribute('target', '_blank');
      readMoreAEl.classList.remove('displayoff');
    } else {
      readMoreAEl.classList.add('displayoff');
    }
  }

  // Listen for messages from iframe window
  window.addEventListener('message', (event) => {
    const { data } = event;

    if (!data) return;

    const dateEl = modal.querySelector('.event-modal-date');
    const timeEl = modal.querySelector('.event-modal-time');
    const footerEl = modal.querySelector('.event-modal-footer');

    if (data.eventtop !== undefined && dateEl && timeEl) {
      const showTop = data.eventtop === 'on';
      dateEl.classList.toggle('off', !showTop);
      timeEl.classList.toggle('off', !showTop);
    }

    if (data.eventfooter !== undefined && footerEl) {
      const showFooter = data.eventfooter === 'on';
      footerEl.classList.toggle('off', !showFooter);
    }
  });

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      const windowHref = window.location.href;
      const urlObj = new URL(windowHref);
      urlObj.searchParams.delete('id');
      window.history.pushState({}, '', urlObj);
    }
  };
}

function disableSpinner() {
  const spinnerDiv = document.querySelector('.spinner');
  spinnerDiv.style.display = 'none';
}

function disableRightClick() {
  document.querySelectorAll('.noReadMore').forEach((element) => {
    element.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  });
}

async function getfromDOM(element) {
  const currentURL = element.href;
  const resp = await fetch(currentURL);
  const htmlBody = await resp.text();
  const parser = new DOMParser();
  const dom = parser.parseFromString(htmlBody, 'text/html');
  const readMoreMeta = dom.querySelector('meta[name="readmore"]');
  if (readMoreMeta) {
    element.href = readMoreMeta.content;
  }
}

async function changehref() {
  document.querySelectorAll('.yesReadMore').forEach(async (element) => {
    await getfromDOM(element);
  });
}

function getbyweekday(daysOfWeek) {
  const arraydays = [];
  daysOfWeek.split(',').forEach((ele) => {
    if (ele.length > 1) {
      if (ele.includes('(')) {
        const day = ele.split('(')[0].toUpperCase();
        const within = ele.split('(')[1].split(')')[0];
        arraydays.push(`${day}#${within}`);
      } else {
        arraydays.push(ele.toUpperCase());
      }
    }
  });
  return arraydays;
}

function createEvents(eventsList) {
  disableSpinner();
  let eventDuration = '';
  eventsList.forEach((event) => {
    event.allDay = event.allDay === 'true';
    if (event.daysOfWeek.length > 1) {
      if (event.duration && event.duration.length > 0) {
        eventDuration = `${event.duration.split('T')[1]}`;
      } else {
        eventDuration = '01:00';
      }
      if (event.excludeDates && event.excludeDates.length > 1) {
        if (typeof event.excludeDates === 'string') {
          event.excludeDates = event.excludeDates.split(',').map((date) => `${date}T${event.startTime}`).filter((content) => content.includes('-'));
        }
        const eventbyweekday = getbyweekday(event.daysOfWeek);
        /* Converting String into array to leverage map function */
        calendar.addEvent({
          title: event.title,
          allDay: event.allDay,
          rrule: {
            freq: event.freq,
            byweekday: eventbyweekday.map((day) => {
              if (day.includes('#')) {
                // eslint-disable-next-line no-undef
                return rrule.RRule[day.split('#')[0]].nth(day.split('#')[1]);
              }
              // eslint-disable-next-line no-undef
              return rrule.RRule[day];
            }),
            dtstart: event.start,
            until: event.end,
          },
          duration: eventDuration,
          exdate: event.excludeDates,
          url: event.url,
          backgroundColor: event.backgroundColor,
          textColor: event.textColor,
          classNames: event.classNames,
          groupId: event.divisionid,
          borderColor: event.backgroundColor,
          extendedProps: { readMore: event.readMore },
          id: `${event.divisionid}-${event.title.length}${event.start.length}`,
        });
      } else {
        const eventbyweekday = getbyweekday(event.daysOfWeek);
        calendar.addEvent({
          title: event.title,
          allDay: event.allDay,
          rrule: {
            freq: event.freq,
            byweekday: eventbyweekday.map((day) => {
              if (day.includes('#')) {
                // eslint-disable-next-line no-undef
                return rrule.RRule[day.split('#')[0]].nth(day.split('#')[1]);
              }
              // eslint-disable-next-line no-undef
              return rrule.RRule[day];
            }),
            dtstart: event.start,
            until: event.end,
          },
          duration: eventDuration,
          url: event.url,
          backgroundColor: event.backgroundColor,
          textColor: event.textColor,
          classNames: event.classNames,
          groupId: event.divisionid,
          borderColor: event.backgroundColor,
          extendedProps: { readMore: event.readMore },
          id: `${event.divisionid}-${event.title.length}${event.start.length}`,
        });
      }
    } else {
      calendar.addEvent({
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        url: event.url,
        backgroundColor: event.backgroundColor,
        textColor: event.textColor,
        classNames: event.classNames,
        groupId: event.divisionid,
        extendedProps: { readMore: event.readMore },
        borderColor: event.backgroundColor,
        id: `${event.divisionid}-${event.title.length}${event.start.length}`,
      });
    }
  });
  disableRightClick();
  changehref();
}

function createEventList(importedData, eventsList) {
  importedData.forEach((event) => {
    let divisionArray = [];
    const startTime = event.start.split('T')[1];
    const endTime = event.end.split('T')[1];
    const url = window.location.origin + event.path;
    // Check for comma in the string
    if (event.divisionname.includes(',')) {
      divisionArray = event.divisionname.split(',');
    } else {
      divisionArray.push(event.divisionname);
    }
    divisionArray.forEach((divisionEle, index) => {
      if (index === 0) {
        // Check for each division and assign the class, color, id to the event
        divisions.forEach((division) => {
          if (normalizeString(division.name) === normalizeString(divisionEle)) {
            event['division-color'] = division.color;
            event['division-textColor'] = division.textColor;
            event.divisionid = division.id;
            if (event.readMore.length > 1) {
              event.classNames = `${normalizeString(division.name)} yesReadMore`;
            } else {
              event.classNames = `${normalizeString(division.name)} noReadMore`;
            }
          }
        });
        const eventObj = new Obj(event.title, event.start, event.end, event.allDay, event.daysOfWeek, startTime, endTime, url, event['division-color'], event['division-textColor'], event.classNames, event.readMore, event.divisionid, event.excludeDates, event.duration, event.freq);
        eventsList.push(eventObj);
      }
    });
  });
  createEvents(eventsList);
  return eventsList;
}

function getInfo(view) {
  deepLinkDay = view.currentStart.getDate();
  deepLinkMonth = view.currentStart.getMonth() + 1;
  deepLinkYear = view.currentStart.getFullYear();
  if (view.type === 'dayGridMonth') {
    deepLinkView = 'month';
  } else if (view.type === 'timeGridWeek') {
    deepLinkView = 'week';
  } else if (view.type === 'timeGridDay') {
    deepLinkView = 'day';
  } else if (view.type === 'listMonth') {
    deepLinkView = 'list';
  }
  if (deepLinkDay < 10) {
    deepLinkDay = `0${deepLinkDay}`;
  }
  if (deepLinkMonth < 10) {
    deepLinkMonth = `0${deepLinkMonth}`;
  }
  const windowHref = window.location.href;
  const url = new URL(windowHref);
  if (url.searchParams.get('view') !== deepLinkView) {
    url.searchParams.set('view', deepLinkView);
    url.searchParams.set('day', deepLinkDay);
    url.searchParams.set('month', deepLinkMonth);
    url.searchParams.set('year', deepLinkYear);
    window.history.pushState({}, '', url);
  } else if (url.searchParams.get('day') !== deepLinkDay) {
    url.searchParams.set('day', deepLinkDay);
    url.searchParams.set('month', deepLinkMonth);
    url.searchParams.set('year', deepLinkYear);
    window.history.pushState({}, '', url);
  } else if (url.searchParams.get('month') !== deepLinkMonth) {
    url.searchParams.set('month', deepLinkMonth);
    url.searchParams.set('year', deepLinkYear);
    window.history.pushState({}, '', url);
  }
}

/* get the view and accordingly target the calendar */
function getView() {
  const windowHref = window.location.href;
  if (windowHref.includes('?')) {
    const url = new URL(windowHref);
    const view = url.searchParams.get('view');
    if (view === 'month') {
      return 'dayGridMonth';
    }
    if (view === 'week') {
      return 'timeGridWeek';
    }
    if (view === 'day') {
      return 'timeGridDay';
    }
    if (view === 'list') {
      return 'listMonth';
    }
  }
  return 'dayGridMonth';
}

function createCalendar() {
  // eslint-disable-next-line no-undef
  calendar = new FullCalendar.Calendar(calendarEl, {
    timeZone: 'local',
    initialView: getView(),
    dayMaxEventRows: mobilecheck() ? 1 : 6,
    views: {
      listMonth: { buttonText: 'list' },
    },
    headerToolbar: {
      left: 'prev,next,today dayGridMonth,timeGridWeek,timeGridDay,listMonth',
      center: '',
      right: 'title',
    },
    eventDisplay: 'block',
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    selectable: true,
    datesSet: (dateInfo) => {
      getInfo(dateInfo.view);
    },
    // events: importedData,
    eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
    eventDidMount: (info) => {
      info.el.setAttribute('id', info.event.id);
    },
    eventClick: async (info) => {
      info.jsEvent.preventDefault(); // don't let the browser navigate
      if (info.event.url) {
        const windowHref = window.location.href;
        const url = new URL(windowHref);
        if (URLSearchParams && !url.searchParams.get('id')) {
          url.searchParams.append('id', info.event.id);
          window.history.pushState({}, '', url);
        } else {
          url.searchParams.set('id', info.event.id);
          window.history.pushState({}, '', url);
        }
        // eslint-disable-next-line max-len
        popupEvent(info.event.url, info.event.start, info.event.end, info.event.allDay, info.event.backgroundColor, info.event.extendedProps.readMore);
      }
      // Check the height of the event iframe & then enable / disable event footer display
      const eventIframe = document.querySelector('#event-iframe');
      const waitForMyIframeToload = () => (new Promise((resolve) => {
        eventIframe.addEventListener('load', () => resolve());
      }));
      await waitForMyIframeToload();
      const iframeHeight = eventIframe.contentWindow.document.body.scrollHeight;
      // Check the height of modal height
      const modal = document.querySelector('.event-modal');
      const modalHeight = modal.offsetHeight;
      if (iframeHeight < modalHeight) {
        modal.querySelector('.event-modal-footer').classList.remove('off');
      }
    },
  });
  /* The Below code is for when the URL is loaded with a specific date */
  const windowHref = window.location.href;
  const url = new URL(windowHref);
  const view = url.searchParams.get('view');
  const day = url.searchParams.get('day');
  const month = url.searchParams.get('month');
  const year = url.searchParams.get('year');
  const ricksDate = new Date(year, month - 1, day);
  if (view === 'month') {
    calendar.changeView('dayGridMonth');
  } else if (view === 'week') {
    calendar.changeView('timeGridWeek');
  } else if (view === 'day') {
    calendar.changeView('timeGridDay');
  } else if (view === 'list') {
    calendar.changeView('listMonth');
  }
  calendar.gotoDate(ricksDate);
  const eventID = url.searchParams.get('id');
  /* Get Pop up window of the event automatically if event ID is mentioned in the URL */
  setTimeout(() => {
    if (eventID) {
      const element = document.getElementById(eventID);
      if (element) {
        element.click();
      }
    }
  }, 1);
  calendar.render();
}

async function getFeaturedEvents() {
  const placeholdersfeatured = placeholders.calendarevents;
  const yesArray = placeholdersfeatured.data.filter((item) => item.featured === 'yes');
  calendar.destroy();
  createCalendar();
  const eventsList = [];
  createEventList(yesArray, eventsList);
}

async function initializeCalendar() {
  let importedData = [];
  const eventsList = [];
  calendarEl = document.getElementById('calendar');
  if (placeholders.calendarevents) {
    importedData = placeholders.calendarevents.data;
    createCalendar();
    const checkDivision = window.location.pathname.split('/');
    if (checkDivision[2] && checkDivision[2].length > 0) {
      divisions.forEach((division) => {
        if (normalizeString(division.name) === checkDivision[2]) {
          if (normalizeString(division.name) === 'featured-events') {
            getFeaturedEvents();
          } else {
            // eslint-disable-next-line max-len
            const filterData = importedData.filter((event) => normalizeString(event.divisionname).includes(normalizeString(division.name))).map((event) => {
              event.divisionname = division.name;
              return event;
            });
            createEventList(filterData, eventsList);
          }
        }
      });
    } else {
      events = createEventList(importedData, eventsList);
    }
  }
}

export function loadrrtofullcalendar() {
  const scriptrrtofullcalendar = document.createElement('script');
  scriptrrtofullcalendar.setAttribute('type', 'text/javascript');
  scriptrrtofullcalendar.src = 'https://cdn.jsdelivr.net/npm/@fullcalendar/rrule@6.1.15/index.global.min.js';
  scriptrrtofullcalendar.addEventListener('load', initializeCalendar);
  document.head.append(scriptrrtofullcalendar);
}

export function loadmomenttofullcalendar() {
  const scriptrrtofullcalendar = document.createElement('script');
  scriptrrtofullcalendar.setAttribute('type', 'text/javascript');
  scriptrrtofullcalendar.src = 'https://cdn.jsdelivr.net/npm/@fullcalendar/moment-timezone@6.1.15/index.global.min.js';
  scriptrrtofullcalendar.addEventListener('load', loadrrtofullcalendar);
  document.head.append(scriptrrtofullcalendar);
}

export function loadfullcalendar() {
  const scriptfullcalendar = document.createElement('script');
  scriptfullcalendar.setAttribute('type', 'text/javascript');
  scriptfullcalendar.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js';
  scriptfullcalendar.addEventListener('load', loadmomenttofullcalendar);
  document.head.append(scriptfullcalendar);
}

export function loadmomentTZ() {
  const scriptrrule = document.createElement('script');
  scriptrrule.setAttribute('type', 'text/javascript');
  scriptrrule.src = 'https://cdn.jsdelivr.net/npm/moment-timezone@0.5.40/builds/moment-timezone-with-data.min.js';
  scriptrrule.addEventListener('load', loadfullcalendar);
  document.head.append(scriptrrule);
}

export function loadmoment() {
  const scriptrrule = document.createElement('script');
  scriptrrule.setAttribute('type', 'text/javascript');
  scriptrrule.src = 'https://cdn.jsdelivr.net/npm/moment@2.29.4/min/moment.min.js';
  scriptrrule.addEventListener('load', loadmomentTZ);
  document.head.append(scriptrrule);
}

export function loadrrule() {
  const scriptrrule = document.createElement('script');
  scriptrrule.setAttribute('type', 'text/javascript');
  scriptrrule.src = 'https://cdn.jsdelivr.net/npm/rrule@2.6.4/dist/es5/rrule.min.js';
  scriptrrule.addEventListener('load', loadmoment);
  document.head.append(scriptrrule);
}

function filterEvents(divisionId, redirectCalendarName) {
  if (divisionId === '1') {
    window.location.href = `https://${window.location.host}/calendar`;
    return;
  }
  window.location.href = `https://${window.location.host}/calendar/${normalizeString(redirectCalendarName)}/`;
}

function searchItems(searchTerm) {
  const tokenizedSearchWords = searchTerm.split(' ');
  if (tokenizedSearchWords.length > 1) tokenizedSearchWords.unshift(searchTerm);
  return tokenizedSearchWords;
}

function filterMatches(tokenizedSearchWords) {
  const allMatches = [];
  tokenizedSearchWords.forEach((searchTerm) => {
    const matches = events.filter((event) => (
      event.divisionname
        + event.title
        + event.eventdescription
        + event.eventname
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase()));
    allMatches.push(...matches);
  });
  // remove duplicates:
  return [...new Set(allMatches)];
}

function implementSearch(searchDiv) {
  const response = document.getElementById('eventform');
  searchDiv.querySelector('form').addEventListener('submit', async (web) => {
    web.preventDefault();
    const rawdata = response.value;
    const tokenizedSearchWords = searchItems(rawdata);
    const searchResults = filterMatches(tokenizedSearchWords);
    calendar.destroy();
    createCalendar();
    createEvents(searchResults);
  });
}

function changeURL() {
  const windowHref = window.location.href;
  if (!windowHref.includes('?')) {
    const queryParam = `?view=month&day=01&month=${mm}&year=${yyyy}`;
    const newUrl = windowHref + queryParam;
    window.location.replace(newUrl);
  }
}

function getName(divisionId) {
  let divisionName = '';
  divisions.forEach((division) => {
    if (division.id === divisionId) {
      divisionName = division.name;
    }
  });
  return divisionName;
}

export default async function decorate(doc) {
  changeURL();
  doc.body.classList.add('calendar');
  const $main = doc.querySelector('main');
  const $searchSection = section({ class: 'fc-search' });
  const $calendarSection = section();

  // For the search section implementation
  const calendarfilters = div({ class: 'fc-calendar-filters' });
  const calendarButton = a();
  const closeButton = button({ class: 'fc-close' });
  const calendarList = ul({ class: 'fc-calendar-list' });
  const normalizeCalendar = 'events';
  placeholders = await fetchPlaceholders(normalizeCalendar);
  divisions = placeholders.divisions.data;
  divisions.forEach((division) => {
    const divisionLi = li({ class: 'fc-calendar-list-item', id: `${division.id}` });
    const divisionButton = a({ class: 'fc-calendar-list-button' });
    divisionButton.textContent = division.name;
    divisionLi.appendChild(divisionButton);
    calendarList.appendChild(divisionLi);
  });
  const searchDiv = div();
  searchDiv.innerHTML = `
    <form class="fc-search">
        <input type="text" id="eventform" name="event" placeholder="Search for Events...">
        <button type="submit" class="fc-search"><i class="fc-search"></i></button>
    </form>
    `;
  const bottomDiv = div({ class: 'fc-calendar-search' });
  bottomDiv.appendChild(searchDiv);
  const spinnerDiv = div({ class: 'spinner' }, div({ class: 'circle-spinner' }));
  bottomDiv.appendChild(spinnerDiv);
  calendarfilters.appendChild(calendarButton);
  calendarfilters.appendChild(closeButton);
  calendarfilters.appendChild(calendarList);
  $searchSection.appendChild(calendarfilters);
  $searchSection.appendChild(bottomDiv);

  $main.appendChild($searchSection);
  const calDiv = div({ id: 'calendar' });
  $calendarSection.append(calDiv);
  $main.append($calendarSection);
  // loadrrule() is loaded after 3 seconds via the delayed.js script for improving page performance
  createModal(doc);
  calendarList.querySelectorAll('.fc-calendar-list-item').forEach((divisionLi, _, parent) => {
    divisionLi.addEventListener('click', () => {
      parent.forEach((liele) => {
        liele.classList.toggle('active', liele === divisionLi);
        if (liele.classList.contains('active')) {
          const divisionId = liele.id;
          divisions.forEach((division) => {
            if (division.id === divisionId) {
              liele.style.backgroundColor = division.color;
              liele.querySelector('.fc-calendar-list-button').style.backgroundColor = division.color;
              const redirectCalendarName = getName(divisionId);
              if (divisionId === '64') {
                window.location.href = `https://${window.location.host}/calendar/${normalizeString(redirectCalendarName)}/`;
                getFeaturedEvents();
              } else {
                filterEvents(divisionId, redirectCalendarName);
              }
            }
          });
        } else {
          liele.style.backgroundColor = '#fff';
          liele.querySelector('.fc-calendar-list-button').style.backgroundColor = '#fff';
        }
        calendarList.classList.remove('expanded');
        closeButton.classList.remove('expanded');
      });
    });
  });
  calendarButton.textContent = 'Calendars';
  calendarButton.addEventListener('click', () => {
    calendarList.classList.toggle('expanded');
    closeButton.classList.toggle('expanded');
  });
  closeButton.addEventListener('click', () => {
    calendarList.classList.remove('expanded');
    closeButton.classList.remove('expanded');
  });
  implementSearch(searchDiv);
}
