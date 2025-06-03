/*
 * Table Block
 * Recreate a table with row count selector
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function getMaxColumns(block) {
  let maxColumns = 0;
  [...block.children].forEach((row) => {
    const columnCount = [...row.children].length;
    maxColumns = Math.max(maxColumns, columnCount);
  });
  return maxColumns;
}

export default async function decorate(block) {
  // Gather all rows from the block
  const allRows = [...block.children];

  // Remove all original rows from the block
  allRows.forEach((row) => block.removeChild(row));
  const header = !block.classList.contains('no-header');
  const maxColumns = getMaxColumns(block);

  // Create controls container
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'tablelist-controls';

  // Row selector (existing)
  const filterDiv = document.createElement('div');
  filterDiv.className = 'table-row-filter';
  filterDiv.innerHTML = `
    <label for="row-selector">Rows per page:</label>
    <select id="row-selector">
      <option value="5">5</option>
      <option value="10" selected>10</option>
      <option value="20">20</option>
    </select>
  `;

  // Search bar (new)
  const searchDiv = document.createElement('div');
  searchDiv.className = 'tablelist-search';
  searchDiv.innerHTML = `<input type="search" placeholder="Search..." id="tablelist-search-input" />`;

  controlsDiv.appendChild(filterDiv);
  controlsDiv.appendChild(searchDiv);
  block.appendChild(controlsDiv);

  // Create a container for the table
  let tableContainer = block.querySelector('.table-container');
  if (!tableContainer) {
    tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    block.appendChild(tableContainer);
  }

  // Pagination controls container
  let paginationDiv = block.querySelector('.tablelist-pagination');
  if (!paginationDiv) {
    paginationDiv = document.createElement('div');
    paginationDiv.className = 'tablelist-pagination';
    block.appendChild(paginationDiv);
  }

  let currentSearch = '';
  let currentRowCount = 10;
  let currentPage = 1;

  function renderTable() {
    tableContainer.innerHTML = '';
    paginationDiv.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    if (header) table.append(thead);
    table.append(tbody);

    // Filter rows by search
    let filteredRows = allRows.filter((row, idx) => {
      if (header && idx === 0) return true;
      return row.textContent.toLowerCase().includes(currentSearch);
    });

    // Pagination logic
    const dataRows = header ? filteredRows.slice(1) : filteredRows;
    const totalRows = dataRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / currentRowCount));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * currentRowCount;
    const endIdx = startIdx + currentRowCount;
    const pageRows = dataRows.slice(startIdx, endIdx);

    const rowsToShow = header
      ? [filteredRows[0], ...pageRows]
      : pageRows;

    rowsToShow.forEach((child, i) => {
      // Skip filter and container nodes
      if (child.classList && (child.classList.contains('table-row-filter') || child.classList.contains('table-container'))) return;

      const row = document.createElement('tr');
      if (header && i === 0) thead.append(row);
      else tbody.append(row);

      const childColumns = [...child.children];

      if (maxColumns === 2 && childColumns.length === 1) {
        const cell = buildCell(header ? i : i + 1);
        cell.innerHTML = childColumns[0].innerHTML;
        cell.setAttribute('colspan', '2');
        row.append(cell);
      } else if (childColumns.length === 1 && block.classList.contains('mixed-columns')) {
        const cell = buildCell(header ? i : i + 1);
        cell.innerHTML = childColumns[0].innerHTML;
        cell.setAttribute('colspan', maxColumns);
        row.append(cell);
      } else {
        childColumns.forEach((col) => {
          const cell = buildCell(header ? i : i + 1);
          cell.innerHTML = col.innerHTML;
          row.append(cell);
        });
      }
    });

    // Fix for extra space after underline
    table.querySelectorAll('u').forEach((el) => {
      const next = el.nextSibling;
      if (next && next.nodeName === '#text') {
        next.textContent = next.textContent.replace(/^ +/, '');
      }
    });

    tableContainer.append(table);

    // Pagination controls
    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '<<Previous';
      prevBtn.disabled = currentPage === 1;
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      };
      paginationDiv.appendChild(prevBtn);

      const pageInfo = document.createElement('span');
      pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;
      paginationDiv.appendChild(pageInfo);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next>>';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.onclick = () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      };
      paginationDiv.appendChild(nextBtn);
    }
  }

  // Initial render
  renderTable();

  // Listen for row count changes
  filterDiv.querySelector('#row-selector').addEventListener('change', (e) => {
    currentRowCount = Number(e.target.value);
    currentPage = 1;
    renderTable();
  });

  // Listen for search input
  searchDiv.querySelector('#tablelist-search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    currentPage = 1;
    renderTable();
  });
}