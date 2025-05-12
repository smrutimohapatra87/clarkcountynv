import ffetch from '../../scripts/ffetch.js';
import {
  div, a, img,
} from '../../scripts/dom-helpers.js';
import {
  buildBlock, decorateBlock, loadBlock, createOptimizedPicture,
} from '../../scripts/aem.js';

class News {
  constructor(newsTitle, newsDescription, newsPath, newsPublished, newsImage, newsCategory) {
    this.newsTitle = newsTitle;
    this.newsDescription = newsDescription;
    this.newsPath = newsPath;
    this.newsPublished = newsPublished;
    this.newsImage = newsImage;
    this.newsCategory = newsCategory;
  }
}

// Result parsers parse the query results into a format that can be used by the block builder for
// the specific block types
const resultParsers = {
  // Parse results into a cards block
  cards: (results) => {
    const blockContents = [];
    results.forEach((result) => {
      const cardtop = div({ class: 'card-top' });
      const row = [];
      if (result.newsImage.length > 0) {
        const cardImage = createOptimizedPicture(result.newsImage);
        cardtop.append(cardImage);
      } else {
        const cardImage = createOptimizedPicture('/news/media_1cd00e6d663e3a8f17a6a71845a2d09cc41f55b6d.png');
        cardtop.append(cardImage);
      }
      const cardbottom = div({ class: 'card-bottom' });

      const divTitle = div({ class: 'category' });
      if (result.newsCategory) {
        divTitle.textContent = `${result.newsCategory}`;
      }
      cardbottom.append(divTitle);

      const pageTitle = div({ class: 'pagetitle' }, result.newsTitle);
      cardbottom.append(pageTitle);
      const aEle1 = div({ class: 'learnmore' }, a({ href: `${result.newsPath}` }, 'Learn More', img({ src: '/assets/images/general/white-arrow-right.png' })));
      cardbottom.append(aEle1);
      row.push(cardtop, cardbottom);
      blockContents.push(row);
    });
    return blockContents;
  },
};

const loadresults = async (jsonDataNews, resultsDiv) => {
  const newsResults = [];
  jsonDataNews.forEach((news) => {
    // eslint-disable-next-line max-len
    const obj = new News(news.pagetitle, news.brief, news.path, news.publishDate, news.bannerUrl, news.category);
    newsResults.push(obj);
  });
  newsResults.sort((x, y) => y.newsPublished - x.newsPublished);

  const blockType = 'cards';

  // eslint-disable-next-line max-len
  const curPage = [...newsResults].slice(0, 6);

  const blockContents = resultParsers[blockType](curPage);
  const builtBlock = buildBlock(blockType, blockContents);

  const parentDiv = div(
    builtBlock,
  );

  const newsTop = div({ class: 'news-top' }, div({ class: 'date' }));

  // Get today's date along with sufgfix
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth(); // Months are zero-based
  const year = today.getFullYear();
  const suffix = ['th', 'st', 'nd', 'rd'][((day % 10) < 4 && ((day % 100) - (day % 10)) !== 10) ? day % 10 : 0];
  const formattedDate = `${monthNames[month]} ${day}${suffix} ${year}`;
  newsTop.querySelector('.date').textContent = formattedDate;

  resultsDiv.append(newsTop, parentDiv);
  decorateBlock(builtBlock);
  await loadBlock(builtBlock);
  builtBlock.classList.add('newsitems');
  builtBlock.querySelectorAll(':scope > div').forEach((newsitem) => {
    newsitem.classList.add('news');
  });
};

async function getCategories(block) {
  const jsonDataNews = await ffetch('/news/query-index.json')
    .chunks(1000)
    .all();
  loadresults(jsonDataNews, block);
}

export default async function decorate(block) {
  block.innerHTML = '';
  await getCategories(block);
}
