import {
  div, iframe, section, p, button, a, ul, li,
} from '../../scripts/dom-helpers.js';

import { normalizeString } from '../../scripts/utils.js';

class Obj {
  // eslint-disable-next-line max-len
  constructor(title, start, end, allDay, daysOfWeek, startTime, endTime, url, backgroundColor, classNames, readMore, divisionid, excludeDates, duration) {
    this.title = title;
    this.start = start;
    this.end = end;
    this.allDay = allDay;
    this.daysOfWeek = daysOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.url = url;
    this.backgroundColor = backgroundColor;
    this.classNames = classNames;
    this.readMore = readMore;
    this.divisionid = divisionid;
    this.excludeDates = excludeDates;
    this.duration = duration;
  }
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
    div({ class: 'event-modal-footer' }, button({ class: 'ics' }, 'ICS'), button({ class: 'close', onclick: () => { document.querySelector('.event-modal').style.display = 'none'; } }, 'Close'), a('Read More')),
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

function popupEvent(url, startTime, endTime, backgroundColor, readMore) {
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
  const eventEndHours = endTime.toString().split(' ')[4].split(':')[0];
  const eventEndMinutes = endTime.toString().split(' ')[4].split(':')[1];
  const eventEndTime = tConv24(`${eventEndHours}:${eventEndMinutes}`);

  // convert number into Month name
  const eventMonthName = months[eventMonth];

  const modal = document.querySelector('.event-modal');
  modal.querySelector('.event-modal-date').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-time').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer button.ics').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer button.close').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer a').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer').classList.add('off');
  modal.querySelector('.event-modal-date p:first-child').textContent = `${eventDate}`;
  modal.querySelector('.event-modal-date p:last-child').textContent = `${eventMonthName}`;
  modal.querySelector('.event-modal-time p').textContent = `${eventStartTime} - ${eventEndTime}`;
  modal.querySelector('iframe').src = url;
  modal.style.display = 'block';
  if (readMore.length > 1) {
    modal.querySelector('.event-modal-footer a').href = readMore;
    modal.querySelector('.event-modal-footer a').classList.remove('displayoff');
  } else {
    modal.querySelector('.event-modal-footer a').classList.add('displayoff');
  }

  // Listen for messages from iframe window
  window.addEventListener('message', (event) => {
    if (event.data.eventtop === 'off') {
      modal.querySelector('.event-modal-date').classList.add('off');
      modal.querySelector('.event-modal-time').classList.add('off');
    } else {
      modal.querySelector('.event-modal-date').classList.remove('off');
      modal.querySelector('.event-modal-time').classList.remove('off');
    }
    if (event.data.eventfooter === 'on') {
      modal.querySelector('.event-modal-footer').classList.remove('off');
    } else {
      modal.querySelector('.event-modal-footer').classList.add('off');
    }
  });

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function disableSpinner() {
  const spinnerDiv = document.querySelector('.spinner');
  spinnerDiv.style.display = 'none';
}

function createEvents(eventsList) {
  disableSpinner();
  let eventDuration = '';
  eventsList.forEach((event) => {
    if (event.daysOfWeek.length > 1) {
      if (event.duration && event.duration.length > 0) {
        eventDuration = `${event.duration.split('T')[1]}`;
      } else {
        eventDuration = '01:00';
      }
      if (event.excludeDates && event.excludeDates.length > 1) {
        if (typeof event.excludeDates === 'string') {
          event.excludeDates = event.excludeDates.split(',').map((date) => `${date}T${event.startTime}`);
        }
        calendar.addEvent({
          title: event.title,
          allDay: false,
          rrule: {
            freq: 'weekly',
            byweekday: event.daysOfWeek.split(','),
            dtstart: event.start,
            until: event.end,
          },
          duration: eventDuration,
          exdate: event.excludeDates,
          url: event.url,
          backgroundColor: event.backgroundColor,
          classNames: event.classNames,
          groupId: event.divisionid,
          borderColor: event.backgroundColor,
          extendedProps: { readMore: event.readMore },
        });
      } else {
        calendar.addEvent({
          title: event.title,
          allDay: false,
          rrule: {
            freq: 'weekly',
            byweekday: event.daysOfWeek.split(','),
            dtstart: event.start,
            until: event.end,
          },
          duration: eventDuration,
          url: event.url,
          backgroundColor: event.backgroundColor,
          classNames: event.classNames,
          groupId: event.divisionid,
          borderColor: event.backgroundColor,
          extendedProps: { readMore: event.readMore },
        });
      }
    } else {
      calendar.addEvent({
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: false,
        url: event.url,
        backgroundColor: event.backgroundColor,
        classNames: event.classNames,
        groupId: event.divisionid,
        extendedProps: { readMore: event.readMore },
        borderColor: event.backgroundColor,
      });
    }
  });
}

function createEventList(importedData, eventsList) {
  importedData.forEach((event) => {
    const startTime = event.start.split('T')[1];
    const endTime = event.end.split('T')[1];
    const url = window.location.origin + event.path;
    // Check for each division and assign the class, color, id to the event
    divisions.forEach((division) => {
      if (normalizeString(division.name) === normalizeString(event.divisionname)) {
        event['division-color'] = division.color;
        event.divisionid = division.id;
        event.classNames = normalizeString(event.divisionname);
      }
    });
    const eventObj = new Obj(event.title, event.start, event.end, event.allDay, event.daysOfWeek, startTime, endTime, url, event['division-color'], event.classNames, event.readMore, event.divisionid, event.excludeDates, event.duration);
    eventsList.push(eventObj);
  });
  createEvents(eventsList);
  return eventsList;
}

function createCalendar() {
  // eslint-disable-next-line no-undef
  calendar = new FullCalendar.Calendar(calendarEl, {
    timeZone: 'America/Vancouver',
    initialView: 'dayGridMonth',
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
    dayMaxEvents: true,
    // events: importedData,
    eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
    eventClick: (info) => {
      info.jsEvent.preventDefault(); // don't let the browser navigate
      if (info.event.url) {
        // eslint-disable-next-line max-len
        popupEvent(info.event.url, info.event.start, info.event.end, info.event.backgroundColor, info.event.extendedProps.readMore);
      }
    },
  });
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
          const filterData = importedData.filter((event) => normalizeString(event.divisionname) === normalizeString(division.name));
          createEventList(filterData, eventsList);
        }
      }
    });
  } else {
    events = createEventList(importedData, eventsList);
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

function filterEvents(divisionId) {
  if (divisionId === '1') {
    window.location.href = `https://${window.location.host}/calendar`;
    return;
  }
  window.location.href = `https://${window.location.host}/calendar/${normalizeString(divisions[divisionId - 1].name)}/`;
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

export default async function decorate(doc) {
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
              if (divisionId === '2') {
                window.location.href = `https://${window.location.host}/calendar/${normalizeString(divisions[divisionId - 1].name)}/`;
                getFeaturedEvents();
              } else {
                filterEvents(divisionId);
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
