import {
  div, iframe, section, p, button, a, ul, li,
} from '../../scripts/dom-helpers.js';

class Obj {
  // eslint-disable-next-line max-len
  constructor(title, start, end, allDay, daysOfWeek, startTime, endTime, startRecur, endRecur, url, backgroundColor, classNames, readMore, divisionid, excludedDates) {
    this.title = title;
    this.start = start;
    this.end = end;
    this.allDay = allDay;
    this.daysOfWeek = daysOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.startRecur = startRecur;
    this.endRecur = endRecur;
    this.url = url;
    this.backgroundColor = backgroundColor;
    this.classNames = classNames;
    this.readMore = readMore;
    this.divisionid = divisionid;
    this.excludedDates = excludedDates;
  }
}

let calendar = null;
let events = [];
let calendarEl = null;

// Array of divisions
const divisions = [
  { name: 'Events', color: '#312222', id: 1 },
  { name: 'Featured Events', color: '#3787d8', id: 2 },
  { name: 'County Commissioners', color: '#3787d8', id: 3 },
  { name: 'County Commission District A', color: '#da80c1', id: 4 },
  { name: 'County Commission District B', color: '#c0a6dd', id: 5 },
  { name: 'County Commissioners District C', color: '#48e7e2', id: 6 },
  { name: 'County Commissioners District D', color: '#7ad295', id: 7 },
  { name: 'County Commissioners District E', color: '#d4dbb6', id: 8 },
  { name: 'County Commissioners District F', color: '#f9a97f', id: 9 },
  { name: 'County Commissioners District G', color: '#2619e4', id: 10 },
  { name: 'Goodsprings Citizens Advisory Committee', color: '#ff8600', id: 11 },
  { name: 'Laughlin TAB', color: '#37d84e', id: 12 },
  { name: 'Lone Mountain Citizens Advisory Council', color: '#7237d8', id: 13 },
  { name: 'Lower Kyle Canyon Citizens Advisory Committee', color: '#d837d2', id: 14 },
  { name: 'Moapa Town Advisory Board', color: '#9d484d', id: 15 },
  { name: 'Paradise Town Advisory Board', color: '#058089', id: 16 },
  { name: 'Spring Valley Town Advisory Board', color: '#3a9500', id: 17 },
  { name: 'Winchester Town Advisory Board', color: '#3c8c98', id: 18 },
  { name: 'Enterprise Town Advisory Board', color: '#d5cd70', id: 19 },
  { name: 'Moapa Valley Town Advisory Board', color: '#89b5bc', id: 20 },
  { name: 'Red Rock Citizens Advisory Committee', color: '#fe0000', id: 21 },
  { name: 'Searchlight Town Advisory Board', color: '#37d891', id: 22 },
  { name: 'Bunkerville Town Advisory Board', color: '#b4ada6', id: 23 },
  { name: 'Mount Charleston Town Advisory Board', color: '#f3bbea', id: 24 },
  { name: 'Sunrise Manor Town Advisory Board', color: '#dadd32', id: 25 },
  { name: 'Whitney Town Advisory Board', color: '#07caf7', id: 26 },
  { name: 'PC', color: '#047c6d', id: 27 },
  { name: 'BCC', color: '#9086d8', id: 28 },
  { name: 'Mountain Springs Citizens Advisory Council', color: '#6aa85a', id: 29 },
  { name: 'Indian Springs Town Advisory Board', color: '#069874', id: 30 },
  { name: 'Sandy Valley Citizens Advisory Council Meeting', color: '#51277c', id: 31 },
  { name: 'Wetlands Park', color: '#3787d8', id: 32 },
  { name: 'Working Group to Address Homelessness', color: '#3787d8', id: 33 },
  { name: 'County Manager', color: '#edf77f', id: 34 },
  { name: 'Parks & Recreation', color: '#ddc08f', id: 35 },
  { name: 'American Rescue Plan Act', color: '#3787d8', id: 36 },
  { name: 'Truancy Prevention Outreach Program', color: '#37d847', id: 37 },
  { name: 'CJCC', color: '#3787d8', id: 38 },
  { name: 'Mojave Max and DCP Outreach Events / Volunteer Opportunities', color: '#f26d1e', id: 39 },
  { name: 'Family Services', color: '#3787d8', id: 40 },
  { name: 'Independent Living', color: '#3787d8', id: 41 },
];

// Fetching events from individual calendar sheets
export async function fetchPlaceholders(prefix) {
  window.placeholders = window.placeholders || {};
  const TRANSLATION_KEY = prefix;
  const loaded = window.placeholders[`${TRANSLATION_KEY}-loaded`];

  if (!loaded) {
    window.placeholders[`${TRANSLATION_KEY}-loaded`] = new Promise((resolve) => {
      fetch(`/calendar/${prefix}.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          window.placeholders[prefix] = json;
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
  return window.placeholders[`${TRANSLATION_KEY}`];
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
  if (readMore.length > 0) {
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

function createEvents(eventsList) {
  eventsList.forEach((event) => {
    if (event.daysOfWeek.length > 0) {
      // calendar.addEvent({
      //   title: event.title,
      //   allDay: false,
      //   daysOfWeek: event.daysOfWeek,
      //   startTime: event.startTime,
      //   endTime: event.endTime,
      //   startRecur: event.startRecur,
      //   endRecur: event.endRecur,
      //   url: event.url,
      //   backgroundColor: event.backgroundColor,
      //   classNames: event.classNames,
      //   groupId: event.divisionid,
      //   extendedProps: { readMore: event.readMore },
      // });
      calendar.addEvent({
        title: event.title,
        allDay: false,
        rrule: {
          freq: 'weekly',
          byweekday: event.daysOfWeek.split(','),
          dtstart: event.startRecur,
          until: event.endRecur,
        },
        duration: '02:00',
        exdate: event.excludedDates.split(','),
        url: event.url,
        backgroundColor: event.backgroundColor,
        classNames: event.classNames,
        groupId: event.divisionid,
        extendedProps: { readMore: event.readMore },
      });
    } else {
      calendar.addEvent({
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        url: event.url,
        backgroundColor: event.backgroundColor,
        classNames: event.classNames,
        groupId: event.divisionid,
        extendedProps: { readMore: event.readMore },
      });
    }
  });
}

function createEventList(importedData, eventsList) {
  importedData.forEach((event) => {
    const startTime = event.startRecur.split('T')[1];
    const endTime = event.endRecur.split('T')[1];
    const url = window.location.origin + event.path;
    const eventObj = new Obj(event.title, event.start, event.end, event.allDay, event.daysOfWeek, startTime, endTime, event.startRecur, event.endRecur, url, event['division-color'], event.classNames, event.readMore, event.divisionid);
    eventsList.push(eventObj);
  });
  createEvents(eventsList);
  return eventsList;
}

function createCalendar() {
  // eslint-disable-next-line no-undef
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    views: {
      listMonth: { buttonText: 'list' },
    },
    headerToolbar: {
      left: 'prev,next,today dayGridMonth,timeGridWeek,timeGridDay,listMonth',
      center: '',
      right: 'title',
    },
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

async function initializeCalendar() {
  let importedData = [];
  const eventsList = [];
  calendarEl = document.getElementById('calendar');
  // const data = getEventsManual();
  const normalizeCalendar = 'events';
  const placeholders = await fetchPlaceholders(normalizeCalendar);
  importedData = [...importedData, ...placeholders.data];
  createCalendar();
  events = createEventList(importedData, eventsList);
}

export function loadrrtofullcalendar() {
  const scriptrrtofullcalendar = document.createElement('script');
  scriptrrtofullcalendar.setAttribute('type', 'text/javascript');
  scriptrrtofullcalendar.src = 'https://cdn.jsdelivr.net/npm/@fullcalendar/rrule@6.1.15/index.global.min.js';
  scriptrrtofullcalendar.addEventListener('load', initializeCalendar);
  document.head.append(scriptrrtofullcalendar);
}

export function loadfullcalendar() {
  const scriptfullcalendar = document.createElement('script');
  scriptfullcalendar.setAttribute('type', 'text/javascript');
  scriptfullcalendar.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js';
  scriptfullcalendar.addEventListener('load', loadrrtofullcalendar);
  document.head.append(scriptfullcalendar);
}

export function loadrrule() {
  const scriptrrule = document.createElement('script');
  scriptrrule.setAttribute('type', 'text/javascript');
  scriptrrule.src = 'https://cdn.jsdelivr.net/npm/rrule@2.6.4/dist/es5/rrule.min.js';
  scriptrrule.addEventListener('load', loadfullcalendar);
  document.head.append(scriptrrule);
}

function filterEvents(divisionId) {
  if (divisionId === '1') {
    calendar.destroy();
    createCalendar();
    createEvents(events);
    return;
  }
  const filteredEvents = events.filter((event) => event.divisionid === divisionId);
  calendar.destroy();
  createCalendar();
  createEvents(filteredEvents);
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

// Get the featured events for the Calendar panel
export async function fetchFeatured() {
  window.placeholders = window.placeholders || {};
  const TRANSLATION_KEY_EVENTS = 'featured-events';
  const loaded = window.placeholders[`${TRANSLATION_KEY_EVENTS}-loaded`];

  if (!loaded) {
    window.placeholders[`${TRANSLATION_KEY_EVENTS}-loaded`] = new Promise((resolve, reject) => {
      fetch('/featured.json?sheet=events')
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          throw new Error(`${resp.status}: ${resp.statusText}`);
        })
        .then((json) => {
          window.placeholders[TRANSLATION_KEY_EVENTS] = json;
          resolve();
        }).catch((error) => {
        // Error While Loading Placeholders
          window.placeholders[TRANSLATION_KEY_EVENTS] = {};
          reject(error);
        });
    });
  }
  await window.placeholders[`${TRANSLATION_KEY_EVENTS}-loaded`];
  return [window.placeholders[TRANSLATION_KEY_EVENTS]];
}

async function getFeaturedEvents() {
  const placeholders = await fetchFeatured();
  const yesArray = placeholders[0].data.filter((item) => item.featured === 'yes');
  calendar.destroy();
  createCalendar();
  const eventsList = [];
  createEventList(yesArray, eventsList);
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
  calendarfilters.appendChild(calendarButton);
  calendarfilters.appendChild(closeButton);
  calendarfilters.appendChild(calendarList);
  $searchSection.appendChild(calendarfilters);
  $searchSection.appendChild(bottomDiv);

  $main.appendChild($searchSection);
  const calDiv = div({ id: 'calendar' });
  $calendarSection.append(calDiv);
  $main.append($calendarSection);
  // loadfullcalendar();
  loadrrule();
  createModal(doc);
  calendarList.querySelectorAll('.fc-calendar-list-item').forEach((divisionLi, _, parent) => {
    divisionLi.addEventListener('click', () => {
      parent.forEach((liele) => {
        liele.classList.toggle('active', liele === divisionLi);
        if (liele.classList.contains('active')) {
          const divisionId = liele.id;
          divisions.forEach((division) => {
            if (division.id === parseInt(divisionId, 10)) {
              liele.style.backgroundColor = division.color;
              liele.querySelector('.fc-calendar-list-button').style.backgroundColor = division.color;
              if (divisionId === '2') {
                getFeaturedEvents();
              } else { filterEvents(divisionId); }
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
