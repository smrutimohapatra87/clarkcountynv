/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Replace all instances of a substring in a string with empty string
 * @param {string} str - The original string
 * @param {string} searchStr - The substring to be replaced
 * @returns {string} The string with all replacements made
 */
function replaceString(str, searchStr) {
  return str.replace(new RegExp(searchStr, 'g'), '');
}

/**
 * Returns the selected option label for a given dropdown
 * @param {object} dropdown - The dropdown component
 * @returns {string} The selected option label
 */
function getSelectedOptionLabel(dropdown) {
  const enums = dropdown.$enum;
  const value = dropdown.$value;
  const index = enums.indexOf(value);
  return index !== -1 ? dropdown.$enumNames[index] : undefined;
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, replaceString, getSelectedOptionLabel,
};
