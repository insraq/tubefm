/**
 * @param {String} url
 * @param {Object} options
 * @param {Function(Error, String)} callback
 * @return http.ClientRequest
 */
module.exports = function (url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (!options) {
    options = {};
  }
  return fetch(url, options)
    .then((r) => r.text())
    .then((t) => callback(null, t, t))
    .catch((err) => callback(err));
};
