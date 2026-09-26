// sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "https://cdn-icons-png.flaticon.com/512/3114/3114883.png", // A generic bell icon
  });
});
