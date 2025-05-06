import ffetch from '../../scripts/ffetch.js';
import { addPagingWidget, normalizeString } from '../../scripts/utils.js';
import {
  div, a, li, option,
  h3,
} from '../../scripts/dom-helpers.js';
import {
  buildBlock, decorateBlock, loadBlock, createOptimizedPicture,
} from '../../scripts/aem.js';

class News {
  // eslint-disable-next-line max-len
  constructor(newsTitle, newsDescription, newsPath, newsPublished, newsImage, newsCategory, newsYear) {
    this.newsTitle = newsTitle;
    this.newsDescription = newsDescription;
    this.newsPath = newsPath;
    this.newsPublished = newsPublished;
    this.newsImage = newsImage;
    this.newsCategory = newsCategory;
    this.newsYear = newsYear;
  }
}

// Result parsers parse the query results into a format that can be used by the block builder for
// the specific block types
const resultParsers = {
  // Parse results into a cards block
  columns: (results) => {
    const blockContents = [];
    results.forEach((result) => {
      let publishedDate;
      const cardleft = div({ class: 'card-left' });
      const row = [];
      if (result.newsImage.length > 0) {
        const cardImage = createOptimizedPicture(result.newsImage);
        cardleft.append(cardImage);
      } else {
        const cardImage = createOptimizedPicture('/news/media_1cd00e6d663e3a8f17a6a71845a2d09cc41f55b6d.png');
        cardleft.append(cardImage);
      }
      const cardright = div({ class: 'card-right' });
      if (result.newsPublished.length > 0) {
        publishedDate = new Date(result.newsPublished * 1000).toDateString();
      }
      const divTitle = div();
      if (result.newsCategory && publishedDate) {
        divTitle.textContent = `${result.newsCategory} - ${publishedDate.slice(4)}`;
      } else {
        // eslint-disable-next-line no-nested-ternary
        const available = publishedDate ? publishedDate.slice(4) : result.newsCategory ? result.newsCategory : '';
        divTitle.textContent = available;
      }
      cardright.append(divTitle);

      const divDescription = div({ class: 'description' });
      const pageTitle = h3({ class: 'pagetitle' }, result.newsTitle);
      divDescription.textContent = result.newsDescription;
      const aEle = a({ class: 'description' });
      aEle.href = window.location.origin + result.newsPath;
      aEle.append(pageTitle, divDescription);
      cardright.append(aEle);
      const divReadmore = div({ class: 'readmore' });
      const aEle1 = a({ class: 'readmore' }, 'Read More');
      aEle1.href = window.location.origin + result.newsPath;
      divReadmore.append(aEle1);
      cardright.append(divReadmore);
      row.push(cardleft, cardright);
      blockContents.push(row);
    });
    return blockContents;
  },
};

const loadresults = async (jsonDataNews, resultsDiv, page, newsbox) => {
  const newsResults = [];
  jsonDataNews.forEach((news) => {
    // eslint-disable-next-line max-len
    const obj = new News(news.pagetitle, news.brief, news.path, news.publishDate, news.bannerUrl, news.category, news.year);
    newsResults.push(obj);
  });
  newsResults.sort((x, y) => y.newsPublished - x.newsPublished);

  const blockType = 'columns';
  const resultsPerPage = 10;
  const startResult = page * resultsPerPage;

  // eslint-disable-next-line max-len
  const curPage = [...newsResults].slice(startResult, startResult + resultsPerPage);

  const blockContents = resultParsers[blockType](curPage);
  const builtBlock = buildBlock(blockType, blockContents);

  const parentDiv = div(
    builtBlock,
  );

  // Pagination logic
  const totalResults = jsonDataNews.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  addPagingWidget(parentDiv, page, totalPages);
  const paginationblock = parentDiv.querySelector('ul');
  const paginationLimit = 5;
  if (totalPages > paginationLimit) {
    let elementForward = 0;
    const threeDotsAfter = li();
    const ata = a();
    ata.innerText = '...';
    threeDotsAfter.appendChild(ata);

    const threeDotsBefore = li();
    const atb = a();
    atb.innerText = '...';
    threeDotsBefore.appendChild(atb);

    const firstElement = paginationblock.querySelector('.prev.page').nextElementSibling;
    const lastElement = paginationblock.querySelector('.next.page').previousElementSibling;
    firstElement.after(threeDotsBefore);
    lastElement.before(threeDotsAfter);

    if (page < (paginationLimit - 1)) {
      firstElement.nextElementSibling.classList.add('notvisible');
      const currentElement = paginationblock.querySelector('.active');
      // eslint-disable-next-line max-len
      elementForward = (page === 0) ? currentElement.nextElementSibling.nextElementSibling.nextElementSibling : currentElement.nextElementSibling.nextElementSibling;
      while (elementForward) {
        elementForward.classList.add('notvisible');
        elementForward = elementForward.nextElementSibling;
        if (elementForward.innerText === '...') break;
      }
    }
    if (page > (paginationLimit - 2) && (page < (totalPages - 3))) {
      const currentElement = paginationblock.querySelector('.active');
      elementForward = currentElement.nextElementSibling.nextElementSibling;
      while (elementForward) {
        elementForward.classList.add('notvisible');
        elementForward = elementForward.nextElementSibling;
        if (elementForward.innerText === '...') break;
      }
      // eslint-disable-next-line max-len
      let elementBefore = currentElement.previousElementSibling.previousElementSibling.previousElementSibling;
      while (elementBefore) {
        elementBefore.classList.add('notvisible');
        elementBefore = elementBefore.previousElementSibling;
        if (elementBefore.innerText === '...') break;
      }
    } else if (page > (totalPages - 4)) {
      const currentElement = paginationblock.querySelector('.active');
      lastElement.previousElementSibling.classList.add('notvisible');
      // eslint-disable-next-line max-len
      let elementBefore = currentElement.previousElementSibling.previousElementSibling.previousElementSibling;
      while (elementBefore) {
        elementBefore.classList.add('notvisible');
        elementBefore = elementBefore.previousElementSibling;
        if (elementBefore.innerText === '...') break;
      }
    }
  }
  resultsDiv.append(parentDiv);
  decorateBlock(builtBlock);
  await loadBlock(builtBlock);
  builtBlock.classList.add('newsItems');
  builtBlock.querySelectorAll(':scope > div').forEach((newsitem) => {
    newsitem.classList.add('news');
  });
  newsbox.append(builtBlock);
  newsbox.append(paginationblock.parentElement);
};

async function getYear(block, newsbox) {
  const years = new Set();
  const jsonDataNewsAll = await ffetch('/news/query-index.json')
    .chunks(1000)
    .all();
  const jsonDataNews = jsonDataNewsAll.filter((news) => news.category === 'Environment and Sustainability');
  // Get year from array of Objects
  jsonDataNews.forEach((news) => {
    if (news.year) {
      years.add(news.year);
    }
  });
  const params = new URLSearchParams(window.location.search);
  const catNews = params.get('year');
  if (!catNews) {
    params.set('year', normalizeString('All News'));
    window.location.search = params.toString();
  }
  let curPage = params.get('pg');
  if (!curPage) {
    curPage = 0;
  } else {
    // convert the current page to a number
    curPage = parseInt(curPage, 10);
  }

  // Allot options to the select element
  const select = block.querySelector('#news-filter');
  const firstOption = option({ value: normalizeString('All News') }, 'All News');
  select.append(firstOption);
  years.forEach((year) => {
    const $option = option({ value: normalizeString(year) });
    $option.textContent = year;
    select.append($option);
  });

  select.querySelectorAll('option').forEach(($option) => {
    if (normalizeString($option.value) === normalizeString(catNews)) {
      $option.setAttribute('selected', true);
      if (normalizeString(catNews) === normalizeString('All News')) {
        loadresults(jsonDataNews, block, curPage, newsbox);
      } else {
        // eslint-disable-next-line max-len
        const filteredNews = jsonDataNews.filter((news) => normalizeString(news.year) === normalizeString(catNews));
        loadresults(filteredNews, block, curPage, newsbox);
      }
    } else {
      $option.removeAttribute('selected');
    }
  });

  // Select option change event
  select.addEventListener('change', (e) => {
    const selectedYear = e.target.value;
    // remove the query parameter from the URL
    const paramsv1 = new URLSearchParams(window.location.search);
    paramsv1.set('year', selectedYear);
    paramsv1.delete('pg');
    window.location.search = paramsv1.toString();
  });
}

export default async function decorate(block) {
  block.innerHTML = '';
  const newscontrol = div({ class: 'news-control' });
  const newsbox = div({ class: 'news-box' });
  newscontrol.innerHTML = `
  <div id="news-controls">
    <label for="news-categories">Show : </label>
    <select id="news-filter" name="news-categories">                 
    </select>
</div>`;
  block.append(newscontrol);
  block.append(newsbox);
  await getYear(block, newsbox);
}
