/**
 * @param {String} url
 * @param {Object} options
 * @param {Function(Error, String)} callback
 * @return http.ClientRequest
 */
module.exports = function(url, options, callback) {
  return fetch(url, options)
    .then((r) => r.text())
    .then((t) => callback(null, t))
    .catch((err) => callback(err));
};
