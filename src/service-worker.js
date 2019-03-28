workbox.core.setCacheNameDetails({prefix: "pwa"});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
workbox.skipWaiting();
workbox.clientsClaim();

// we're a singlepage app so register all navigation requests through index.html
workbox.routing.registerNavigationRoute('/index.html', {
  blacklist: [
    new RegExp('/admin'),
  ]
});
workbox.routing.registerNavigationRoute('/admin/index.html', {
  whitelist: [
    new RegExp('/admin'),
  ]
});

workbox.routing.registerRoute(new RegExp('/scheds'),
  workbox.strategies.networkFirst({
    cacheName: 'schedule-cache',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      })
    ]
  })
);

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const primaryKey = notification.data.primaryKey;
  const action = event.action;

  if (action == 'close') {
    notification.close();
  } else {

  }
});

self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  const primaryKey = notification.data.primaryKey;

  console.log('Closed Notification: ' + primaryKey);
});

self.addEventListener('push', event => {
  let obj;
  if (event.data) {
    obj = event.data.json();
  }

  const options = {
    body: obj.body,
    icon: 'img/icons/icon_256x256.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {action: 'close', title: 'Close the notification'}
    ]
  };

  event.waitUntil(
    self.registration.showNotification(obj.title, options)
  );
});
