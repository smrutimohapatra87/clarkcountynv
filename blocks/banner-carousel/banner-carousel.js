// eslint-disable-next-line import/named
import { fetchPlaceholders, getMetadata, createOptimizedPicture } from '../../scripts/aem.js';

let autoInterval;
const autoDuration = 8000; // default if not set in block
let isInitialLoad = true;
// const scrollSpeed = 1000;

function updateActiveSlide(slide) {
  const block = slide.closest('.banner-carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');
  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    if (colIdx === 0) {
      column.classList.add('carousel-slide-image');
      column.classList.add(`slide-image-${slideIndex}`);
    } else {
      column.classList.add('carousel-slide-content');
      column.classList.add(`slide-content-${colIdx}`);
      column.classList.add(`slide-content-${colIdx}-slide-${slideIndex + 1}`);
    }

    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

// auto slide functions
function startAuto(block) {
  if (!autoInterval) {
    autoInterval = setInterval(() => {
      // get data-active-slide attribute from block
      const activeSlide = parseInt(block.dataset.activeSlide, 10);
      // if activeSlide is the last slide, go to the first slide
      if (activeSlide === block.querySelectorAll('.carousel-slide').length - 1) {
        showSlide(block, 0);
      }
      showSlide(block, activeSlide + 1);
    }, autoDuration);
  }
}

function stopAuto() {
  clearInterval(autoInterval);
  autoInterval = undefined;
}

function initAuto(block) {
  block.dataset.activeSlide = 0;
  const autoSlide = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // delay first auto slide to allow for initial load
        if (isInitialLoad) {
          setTimeout(() => startAuto(block), 1000);
          isInitialLoad = false;
        } else {
          startAuto(block);
        }
      } else {
        stopAuto();
      }
    });
  };
  const autoObserver = new IntersectionObserver(autoSlide, { threshold: 0.5 });
  autoObserver.observe(block);

  // pause when mouse is over
  block.addEventListener('mouseenter', () => stopAuto());
  block.addEventListener('mouseleave', () => startAuto(block));

  // pause when tab is not active or window is not focused
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') stopAuto();
    else startAuto(block);
  });
  window.addEventListener('blur', () => {
    stopAuto();
  });
  window.addEventListener('focus', () => {
    startAuto(block);
  });
}

let carouselId = 0;
export default async function decorate(block) {
  let cardImage;
  [...block.children].forEach((row) => {
    [...row.children].forEach((col, index) => {
      if (index === 0) {
        const imageLinkEl = col.querySelector('a');
        if (imageLinkEl) {
          const imgSrc = imageLinkEl.getAttribute('href');
          cardImage = createOptimizedPicture(imgSrc, imgSrc.split('/').pop());
          col.innerHTML = '';
          col.append(cardImage);
        } else {
          cardImage = col.querySelector('picture');
        }
      }
    });
  });
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button"><span>${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}</span></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  const bannerTitleDiv = document.createElement('div');
  bannerTitleDiv.classList.add('banner-title');
  bannerTitleDiv.classList.add('desktop');
  bannerTitleDiv.classList.add('short');

  bannerTitleDiv.innerHTML = `
    <h3> ${getMetadata('page-title')} </h3>
    `;
  block.append(bannerTitleDiv);

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
    initAuto(block);
  }
}
