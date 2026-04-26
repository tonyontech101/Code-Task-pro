// Intersection observer for scroll reveals
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));

  // Task row hover interaction in preview
  document.querySelectorAll('.task-row').forEach(row => {
    row.addEventListener('click', () => {
      document.querySelectorAll('.task-row').forEach(r => r.style.background = '');
      row.style.background = 'var(--surface2)';
    });
  });