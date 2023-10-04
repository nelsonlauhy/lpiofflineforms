self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('my-cache').then(function(cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/styles.css',
                '/app.js'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('sync', function(event) {
  if (event.tag == 'submitForm') {
    event.waitUntil(syncFormSubmission());
  }
});

async function syncFormSubmission() {
  const storedData = await caches.open('formData').then(cache => {
    return cache.match('offlineForm');
  });

  if (storedData) {
    // We are sending a post message back to the main app.js to reuse the same logic
    self.clients.matchAll().then(all => {
      return all.map(client => {
        client.postMessage(storedData);
      });
    });
  }
}

