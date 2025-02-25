import {
  div, h3, p, h1, a,
} from '../../scripts/dom-helpers.js';
import { getMetadata } from '../../scripts/aem.js';
import ArticleList from '../../scripts/article-list.js';
import { loadTemplate } from '../../scripts/scripts.js';

export default async function decorate(doc) {
  await loadTemplate(doc, 'default');
  const $page = doc.querySelector('main .section');
  const $articles = div({ class: 'articles' });
  const $pagination = div({ class: 'pagination' });
  const articlesPerPage = Number(getMetadata('articles-per-page')) || 10;
  const paginationMaxBtns = 4;

  const $articleCard = (article) =>
  // eslint-disable-next-line function-paren-newline, implicit-arrow-linebreak
    div({ class: 'card' },
      // eslint-disable-next-line function-paren-newline
      a({ href: article.path },
        // eslint-disable-next-line indent, function-paren-newline
        h3(article.title)),
      p(article.description),
    );

  const newsTitle = 'News';
  // eslint-disable-next-line object-curly-spacing
  const $newsPage = div(
    h1(`${newsTitle}`),
    $articles,
    $pagination,
  );

  $page.append($newsPage);

  // TODO: add proper location for query index
  await new ArticleList({
    jsonPath: '/news/query-index.json',
    articleContainer: $articles,
    articleCard: $articleCard,
    articlesPerPage,
    paginationContainer: $pagination,
    paginationMaxBtns,
  }).render();
}
