'use strict';

/**
 * Create test that a CSS property computes to the expected value.
 * The document element #target is used to perform the test.
 *
 * @param {string} specified A specified value for the color.
 * @param {string} computed   The expected computed color. If omitted, defaults
 *                            to specified.
 * @param {object} options  Additional test information, such as a custom
 *                          comparison function and epsilon.
 */
function fuzzy_test_computed_color(specified, computed, options = {}) {
  if (!computed) {
    computed = specified;
  }

  if (!options.epsilon) {
    options.epsilon = 0.0001;
  }

  function fuzzy_compare_colors(color1, color2) {
    const colorElementDividers = /( |\(|,)/;
    // Return the string stripped of numbers.
    function getNonNumbers(color) {
      return color.replace(/[0-9]/g, '');
    }
    // Return an array of all numbers in the color.
    function getNumbers(color) {
      const result = [];
      color.split(colorElementDividers).forEach(element => {
        const numberElement = parseFloat(element);
        if (!isNaN(numberElement)) {
          result.push(numberElement);
        }
      });
      return result;
    }

    assert_array_approx_equals(getNumbers(color1), getNumbers(color2), options.epsilon, "Numeric parameters are approximately equal.");
    // Assert that the text of the two colors are equal. i.e. colorSpace, colorFunction and format.
    assert_equals(getNonNumbers(color1), getNonNumbers(color2), "Color format is correct.");
  }

  test_computed_value("color", specified, computed, options.titleExtra, {comparisonFunction: fuzzy_compare_colors});
}

/**
 * Create test that a CSS property computes to the expected value.
 * The document element #target is used to perform the test.
 *
 * @param {string} value A specified value for the property.
 * @param {string} computed  The expected parsed color.
*                            If omitted, defaults to specified.
 * @param {object} options  Additional test information, such as a custom
 *                          comparison function and epsilon.
 */
function fuzzy_test_valid_color(value, serializedValue, options = {}) {
  if (!serializedValue) {
    test_valid_value("color", value);
    return;
  }

  if (!options.epsilon) {
    options.epsilon = 0.0001;
  }

  function fuzzy_compare_colors(color1, color2) {
    const colorElementDividers = /( |\(|,)/;
    // Return the string stripped of numbers.
    function getNonNumbers(color) {
      return color.replace(/[0-9]/g, '');
    }
    // Return an array of all numbers in the color.
    function getNumbers(color) {
      const result = [];
      color.split(colorElementDividers).forEach(element => {
        const numberElement = parseFloat(element);
        if (!isNaN(numberElement)) {
          result.push(numberElement);
        }
      });
      return result;
    }

    assert_array_approx_equals(getNumbers(color1), getNumbers(color2), options.epsilon, "Numeric parameters are approximately equal.");
    // Assert that the text of the two colors are equal. i.e. colorSpace, colorFunction and format.
    assert_equals(getNonNumbers(color1), getNonNumbers(color2), "Color format is correct.");
  }

  test_valid_value("color", value, serializedValue, fuzzy_compare_colors);
}
