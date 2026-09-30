// Shared UI behavior: active nav link + footer year.
(function () {
  const links = document.querySelectorAll(".nav-links a");
  const here = window.location.pathname.split("/").pop() || "index.html";
  links.forEach((link) => {
    const target = (link.getAttribute("href") || "").split("/").pop();
    if (target === here) link.classList.add("active");
  });
})();
