var _ = require('lodash'),
    request = require('supertest'),
    cookie = require('cookie');

module.exports = function (config) {

  function Session () {
    this.app = config.app;
  }

  Session.prototype.request = function (meth, route) {
    var req, self = this;
    req = request(this.app);
    req = req[meth](route);
    req.cookies = _.map(this.cookies, function (c) {
      return _.compact(_.map(c, function (v, k) {
        if (k != 'Path') return cookie.serialize(k, v);
      }));
    }).join('; ');

    req.end = _.wrap(_.bind(req.end, req), function (end, callback) {
      return end(_.wrap(callback, function (callback, err, res) {
        if (err === null && _.has(res.headers, 'set-cookie')) {
          self.cookies = _.map(res.headers['set-cookie'], cookie.parse);
        }
        return callback(err, res);
      }));
    });

    return req;
  };

  Session.prototype.destroy = function () {
    this.cookies = null;
  };

  if (_.isObject(config.helpers)) {
    _.extend(Session.prototype, config.helpers);
  }

  return Session;
};

