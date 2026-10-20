document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("liftVideo");
  const stepCards = document.querySelectorAll(".step-card");
  const trackerItems = document.querySelectorAll(".tracker-item");

  // 1. Observer für die Steps rechts (Wechselt aktive Abschnitte beim Scrollen)
  const stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          stepCards.forEach((card) => card.classList.remove("active"));
          entry.target.classList.add("active");

          // Optional: Video passend zur Step-Nummer vorspulen
          const stepIndex = entry.target.dataset.step;
          if (video && video.duration) {
            video.currentTime =
              (video.duration / stepCards.length) * (stepIndex - 1);
          }
        }
      });
    },
    { threshold: 0.6 }
  );

  stepCards.forEach((step) => stepObserver.observe(step));

  // 2. Klick auf Kapitel-Tabs scrollt direkt dorthin
  trackerItems.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});
