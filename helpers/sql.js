const { BadRequestError } = require("../expressError");

/**
 * Generates the SQL SET clause and corresponding values for a partial update operation.
 * @param {Object} dataToUpdate - The object containing the data to be updated.
 * Keys represent column names, and values represent the new data.
 * @param {Object} jsToSql - An optional mapping object that specifies the SQL column
 * names corresponding to the JavaScript object keys. This is useful when the JavaScript and SQL column names differ.
 *
 * @returns {Object} An object with two properties:
 * @throws {BadRequestError} Throws a BadRequestError if no data is provided for the update.
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
