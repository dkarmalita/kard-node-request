# node-request

## Usage pattern

```sh
npm add -S @kard/node-request
```

```js
const Request = require('@kard/node-request');

const request = new Request({
  timeout: config.httpTimeout || 10000,
  // Optional. Default itmeout is 10s (10000ms)

  headers: {
  // Optional. These default headers will be added to each request.
    Authorization: `Basic ${authToken}`,
  },
})

await request(`https://httpstat.us/200?sleep=200`)
await request(
  `https://httpstat.us/200?sleep=200`, 
  { 
    method: 'POST', 
    // Optional, Default is 'GET'
    
    postData: { user: 'User Name', password: 'password' },
    // Optional. Default is {}
    
    headers: {},
    // Optional. Will be combained with the default headers.
  }
)

```

