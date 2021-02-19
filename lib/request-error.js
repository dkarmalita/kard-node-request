const util = require('util');
const chalk = require('chalk');

const inspect = (x) => util.inspect(x, {
  colors: true,
  depth: Infinity,
});

const getCodeStack = (shiftCount = 0) => {
  const stack = new Error().stack.split(/\r?\n/);
  stack.splice(0, 3 + shiftCount);
  return stack;
};

const parseDetails = (txt) => {
  const result = txt.split(/\r?\n/).filter((s) => s.trim() !== '');
  const [method, path, httpVersion] = result[0].split(' ');
  result.shift();
  const hostIndex = result.findIndex((s) => s.startsWith('Host'));
  const host = result[hostIndex].split(' ')[1];
  result.splice(hostIndex, 1);
  const headers = {};
  result.filter((s) => !s.startsWith('Connection')).forEach((el) => {
    const [name, value] = el.split(':');
    headers[name] = value.trim();
  });
  return {
    method, path, httpVersion, host, headers,
  };
};

// *** ref : https://stackoverflow.com/a/62053603
function RequestError(msg, postData, responseData) {
  const that = {};
  that.name = 'RequestError';
  that.stack = getCodeStack();

  if (typeof msg === 'string') {
    that.message = msg;
  } else

  if (typeof msg === 'object') {
    that.code = msg.statusCode;
    that.message = `${msg.statusCode} ${msg.statusMessage}`;
    // eslint-disable-next-line no-underscore-dangle
    that.details = parseDetails(msg.req._header);
    if (postData) { that.details.postData = postData; }
    if (responseData) { that.details.responseData = responseData; }
  }

  that[util.inspect.custom] = () => that.inspect();
  // `${that.name}: ${that.message}\r\nDetails: ${util.inspect(that.details)}\r\n${that.stack}\r\n`;

  that.inspect = () => {
    let txt = chalk.red(`${that.name}: ${that.message}\r\n`);
    if (that.details) {
      txt += `${inspect(that.details)}\r\n`;
    }
    const stack = [...that.stack];
    stack[0] = chalk.white(stack[0]);
    txt += `${stack.join('\r\n')}\r\n`;
    return chalk.gray(txt);
  };

  return that;
}

module.exports = RequestError;
