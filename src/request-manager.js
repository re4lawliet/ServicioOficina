const fetch = require('node-fetch')

const fetchQuery = (url, method, body, head) => {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', ...head }
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: method,
      body: JSON.stringify(body),
      headers
    })
      .then(response => {
        if (!response.ok) {
          reject(response)
        }
        resolve(response.json())
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = fetchQuery;