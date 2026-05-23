self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "ExameCare", body: "Voce tem um lembrete de cuidado." };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/vite.svg",
      badge: "/vite.svg"
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
