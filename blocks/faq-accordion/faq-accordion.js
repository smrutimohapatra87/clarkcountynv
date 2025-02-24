import { div, input } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const sections = {};
  let currentSection = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];

    // Check if this is a section header (single cell with strong/bold text)
    if (cells.length === 1) {
      // Create new section
      currentSection = {
        title: cells[0].textContent.trim(),
        items: [],
      };
      sections[currentSection.title] = currentSection;
    } else if (cells.length === 2 && currentSection) {
      // If we have 2 cells, it's a Q&A pair
      const questionItem = {
        question: cells[0].textContent.trim(),
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

      // Show/hide section based on whether it has visible questions
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
    const sectionTitle = div({ class: 'section-title active' }, section.title);
    const sectionContent = div({
      class: 'section-content show',
      'data-section': section.title,
    });

    sectionTitle.addEventListener('click', () => {
      sectionTitle.classList.toggle('active');
      sectionContent.classList.toggle('show');
    });

    sectionContainer.appendChild(sectionTitle);
    sectionContainer.appendChild(sectionContent);

    section.items.forEach((item, index) => {
      const questionEl = div({
        class: 'question',
        'data-index': index,
      }, item.question);
      const answerEl = div({ class: 'answer' }, item.answer);

      questionEl.addEventListener('click', () => {
        questionEl.classList.toggle('active');
        answerEl.classList.toggle('show');
      });

      sectionContent.appendChild(questionEl);
      sectionContent.appendChild(answerEl);
    });

    block.appendChild(sectionContainer);
  });
}
