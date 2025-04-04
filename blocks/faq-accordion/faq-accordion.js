import { div, input } from '../../scripts/dom-helpers.js';
import { scrollWithHeaderOffset } from '../../scripts/utils.js';

function createHashId(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

export default function decorate(block) {
  const sections = {};
  let currentSection = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];

    // Check if this is a section header (single cell)
    if (cells.length === 1) {
      // Create new section
      currentSection = {
        title: cells[0].textContent.trim(),
        id: createHashId(cells[0].textContent.trim()),
        items: [],
      };
      sections[currentSection.title] = currentSection;
    } else if (cells.length === 2 && currentSection) {
      // If we have 2 cells, it's a Q&A pair
      const questionText = cells[0].textContent.trim();
      const questionItem = {
        question: questionText,
        id: `${currentSection.id}-${createHashId(questionText)}`,
        answer: cells[1],
      };
      currentSection.items.push(questionItem);
    }
  });

  block.textContent = '';

  const searchContainer = div({ class: 'search-container' });
  const searchBox = input({
    type: 'text',
    class: 'search-box',
    placeholder: 'Search the FAQs...',
  });
  const searchResults = div({ class: 'search-results' });
  searchContainer.append(searchBox, searchResults);
  block.appendChild(searchContainer);

  const performSearch = () => {
    const searchTerm = searchBox.value.toLowerCase();
    let matchCount = 0;

    Object.values(sections).forEach((section) => {
      const sectionContent = block.querySelector(`[data-section="${section.title}"]`);
      if (!sectionContent) return;

      section.items.forEach((item, index) => {
        const questionEl = sectionContent.querySelector(`.question[data-index="${index}"]`);
        const answerEl = questionEl?.nextElementSibling;
        if (!questionEl || !answerEl) return;

        const questionText = item.question.toLowerCase();
        const answerText = item.answer.textContent.toLowerCase();
        const isMatch = questionText.includes(searchTerm) || answerText.includes(searchTerm);

        questionEl.style.display = searchTerm && !isMatch ? 'none' : '';
        answerEl.style.display = searchTerm && !isMatch ? 'none' : '';

        if (isMatch && searchTerm) {
          matchCount += 1;
        }
      });

      const hasVisibleQuestions = [...sectionContent.querySelectorAll('.question')]
        .some((q) => q.style.display !== 'none');
      sectionContent.parentElement.style.display = hasVisibleQuestions ? '' : 'none';
    });

    // Update search results count
    if (searchTerm) {
      searchResults.textContent = `${matchCount} item${matchCount !== 1 ? 's' : ''} found. Please see below for details.`;
    } else {
      searchResults.textContent = '';
    }
  };

  searchBox.addEventListener('input', performSearch);

  Object.values(sections).forEach((section) => {
    const sectionContainer = div({ class: 'section' });
    const sectionTitle = div({
      class: 'section-title active',
      id: section.id,
    }, section.title);
    const sectionContent = div({
      class: 'section-content show',
      'data-section': section.title,
    });

    // Check if this section should be open based on hash
    const shouldOpenSection = window.location.hash === `#${section.id}`;
    if (shouldOpenSection) {
      sectionTitle.classList.add('active');
      sectionContent.classList.add('show');
      setTimeout(() => scrollWithHeaderOffset(sectionTitle), 100);
    }

    sectionTitle.addEventListener('click', () => {
      sectionTitle.classList.toggle('active');
      sectionContent.classList.toggle('show');
      // Update URL hash when section is opened
      if (sectionTitle.classList.contains('active')) {
        window.history.pushState(null, '', `#${section.id}`);
      }
    });

    sectionContainer.appendChild(sectionTitle);
    sectionContainer.appendChild(sectionContent);

    section.items.forEach((item, index) => {
      const questionEl = div({
        class: 'question',
        id: item.id,
        'data-index': index,
      }, item.question);
      const answerEl = div({ class: 'answer' }, item.answer);

      // Check if this question should be open based on hash
      const shouldOpenQuestion = window.location.hash === `#${item.id}`;
      if (shouldOpenQuestion) {
        sectionTitle.classList.add('active');
        sectionContent.classList.add('show');
        questionEl.classList.add('active');
        answerEl.classList.add('show');
        setTimeout(() => scrollWithHeaderOffset(questionEl), 100);
      }

      questionEl.addEventListener('click', () => {
        questionEl.classList.toggle('active');
        answerEl.classList.toggle('show');
        // Update URL hash when question is opened
        if (questionEl.classList.contains('active')) {
          window.history.pushState(null, '', `#${item.id}`);
        }
      });

      sectionContent.appendChild(questionEl);
      sectionContent.appendChild(answerEl);
    });

    block.appendChild(sectionContainer);
  });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    // Find and open the target section or question
    const targetEl = document.getElementById(hash);
    if (targetEl) {
      if (targetEl.classList.contains('section-title')) {
        // Open section
        targetEl.classList.add('active');
        targetEl.nextElementSibling.classList.add('show');
        scrollWithHeaderOffset(targetEl);
      } else if (targetEl.classList.contains('question')) {
        // Open section and question
        const sectionContent = targetEl.closest('.section-content');
        const sectionTitle = sectionContent.previousElementSibling;
        sectionTitle.classList.add('active');
        sectionContent.classList.add('show');
        targetEl.classList.add('active');
        targetEl.nextElementSibling.classList.add('show');
        scrollWithHeaderOffset(targetEl);
      }
    }
  });
}
