import {
  div, input, li, p, ul,
} from '../../scripts/dom-helpers.js';

function searchBlocks(searchValue, searchTarget) {
  const blocks = document.querySelectorAll('.business-block');
  blocks.forEach((block) => {
    const elToSearch = block.querySelector(searchTarget);
    if (elToSearch) {
      const text = elToSearch.textContent.toUpperCase();
      if (text.indexOf(searchValue.toUpperCase()) === -1) {
        block.style.display = 'none';
      } else {
        block.style.display = 'block';
      }
    }
  });
}

function displayAllBlocks() {
  const blocks = document.querySelectorAll('.business-block');
  blocks.forEach((block) => {
    block.style.display = 'block';
  });
}

function handleTagSearch(element) {
  if (element.classList.contains('selected-category')) {
    element.classList.remove('selected-category');
    displayAllBlocks();
    return;
  }

  document.querySelectorAll('.selected-category').forEach((el) => {
    el.classList.remove('selected-category');
  });

  element.classList.add('selected-category');

  const searchValue = element.textContent.trim();
  if (searchValue != null && searchValue.length > 0) {
    searchBlocks(searchValue, '.business-row .business-image p.category');
  }
}

function handleTextSearch() {
  const searchValue = document.querySelector('.hotline-search-input').value.trim();
  if (searchValue != null && searchValue.length === 0) {
    displayAllBlocks();
  }
  searchBlocks(searchValue, '.business-row .business-info h2');
}

function buildCategoryTags(categories) {
  const container = ul({ class: 'tag-container' });
  const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));
  sortedCategories.forEach((category) => {
    const categoryTag = li({ class: `category-tag ${category.toLowerCase().replace(' ', '-')}`, onclick(e) { handleTagSearch(this, e); } }, category);
    container.append(categoryTag);
  });
  return container;
}

function buildSearchForm() {
  const form = div(
    { class: 'hotline-search-form' },
    input({
      class: 'hotline-search-input', placeholder: 'Search...', name: 'business-search', type: 'text',
    }),
  );

  const searchInput = form.querySelector('input');
  searchInput.addEventListener('input', handleTextSearch);
  searchInput.addEventListener('click', handleTextSearch);

  return form;
}

export default function decorate(block) {
  const contentContainer = div({ class: 'business-list' });
  const categories = [];

  [...block.children].forEach((row) => {
    const backgroundImage = row.children[0].querySelector('img')?.getAttribute('src');
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
          p({ class: `category ${category.toLowerCase().replace(' ', '-')}` }, category),
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
