// Step 25: Keep input validation in a separate local module.
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function fieldsOf(value, partial = false) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new HttpError(400, 'A JSON object is required');
  }
  const keys = Object.keys(value);
  if (keys.some((key) => !['name', 'department'].includes(key))) {
    throw new HttpError(400, 'Only name and department are allowed');
  }
  if (partial && keys.length === 0) throw new HttpError(400, 'Give at least one field');
  const fields = partial ? keys : ['name', 'department'];
  const result = {};
  for (const key of fields) {
    if (typeof value[key] !== 'string' || !value[key].trim()) {
      throw new HttpError(400, `${key} must be a non-empty string`);
    }
    result[key] = value[key].trim();
  }
  return result;
}
function positiveId(text) {
  if (!/^[1-9]\d*$/.test(text)) throw new HttpError(400, 'ID must be a positive integer');
  const id = Number(text);
  if (!Number.isSafeInteger(id)) throw new HttpError(400, 'ID is too large');
  return id;
}
module.exports = { HttpError, fieldsOf, positiveId };
