import {
  div, input, li, p, ul,
} from '../../scripts/dom-helpers.js';

function buildCategoryTags(categories) {
  const container = ul({ class: 'tag-container' });
  categories.forEach((category) => {
    const categoryTag = li({ class: `category-tag ${category.toLowerCase().replace(' ', '-')}` }, category);
    container.append(categoryTag);
  });
  return container;
}

function buildSearchForm() {
  return div(
    { class: 'search-form' },
    input({
      class: 'search-input', placeholder: 'Search...', name: 'business-search', type: 'text',
    }),
  );
}

export default function decorate(block) {
  const contentContainer = div({ class: 'business-list' });
  const categories = [];

  [...block.children].forEach((row) => {
    const backgroundImage = row.children[0].querySelector('a').getAttribute('href');
    const category = row.children[1].textContent;
    const descriptionEl = row.children[2];
    const contacts = row.children[3];

    categories.push(category);
    const businessBlock = div(
      { class: 'business-block' },
      div(
        { class: 'business-row' },
        div(
          { class: 'business-image', style: `background: url(${backgroundImage}) center center / cover no-repeat;` },
          p({ class: 'category' }, category),
        ),
        div(
          { class: 'business-info' },
          ...descriptionEl.children,
        ),
        div(
          { class: 'business-contacts' },
          ...contacts.children,
        ),
      ),
    );
    contentContainer.append(businessBlock);
  });
  const searchContainer = buildSearchForm();
  const categoryTagContainer = buildCategoryTags([...new Set(categories)]);
  block.innerHTML = '';
  block.append(searchContainer, categoryTagContainer, contentContainer);
}
