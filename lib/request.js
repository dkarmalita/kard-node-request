const { parse: parseUrl } = require('url');
const RequestError = require('./request-error');

const parseContent = (contentType, data) => {
  if (contentType.includes('json')) { return JSON.parse(data.toString()); }
  if (contentType.includes('text')) { return data.toString(); }
  return data;
};

function Request(config = {}) {
  return async (url, params) => new Promise((resolve, reject) => {
    const method = params.method || 'GET';
    const { postData } = params;
    const requestHeaders = params.headers || [];

    const u = parseUrl(url);

    // eslint-disable-next-line import/no-dynamic-require, global-require
    const agent = require(u.protocol.slice(0, -1)); // http || https

    const data = method !== 'GET' ? JSON.stringify(postData || {}) : null;

    const contentType = method !== 'PATCH' ? 'application/json' : 'application/json-patch+json';

    const defaultHeaders = config.headers || {};

    const options = {
      timeout: config.timeout || 10000,
      hostname: u.hostname,
      port: u.protocol === 'https:' ? 443 : 80,
      path: u.path,
      method,
      headers: {
        ...defaultHeaders,
        ...requestHeaders,
        'Content-Type': contentType,
      },
    };

    if (data) { options.headers['Content-Length'] = data.length; }

    const req = agent.request(options, (res) => {
      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        contentType: res.headers['content-type'],
        contentLength: Number.parseInt(res.headers['content-length'], 10),
      };

      if (response.status >= 400 && response.contentLength === 0) {
        reject(new RequestError(res, postData));
      }

      res.on('data', (content) => {
        response.data = parseContent(response.contentType, content);
        if (response.status >= 400) {
          reject(new RequestError(res, postData, response.data));
        }
        resolve(response);
      });
    });

    req.on('error', (error) => {
      // eslint-disable-next-line no-param-reassign
      error.options = options;
      reject(error);
    });

    req.on('timeout', () => {
      req.abort();
      reject(new RequestError(`The request has timed out ${options.timeout} ms: ${method}: ${url}`));
    });

    if (data) { req.write(data); }

    req.end();
  });
}

module.exports = Request;
