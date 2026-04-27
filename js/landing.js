// Landing Page Interaction Logic

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mouse Glow Effect
  const glow = document.getElementById('mouseGlow');
  document.addEventListener('mousemove', (e) => {
    if (glow) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }
  });

  // 2. Scroll Reveal Observer
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // observer.unobserve(entry.target); // Keep observing if we want it to repeat
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));

  // 3. Sticky Header Logic
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  });

  // 4. Typewriter Hero Effect
  const words = ["Not chaos.", "Not complexity.", "Just quality.", "Faster than ever."];
  const target = document.querySelector('.hero-title .line2');
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 150;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      target.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      target.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 150;
    }

    if (!isDeleting && charIndex === currentWord.length) {
      isDeleting = true;
      typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  if (target) setTimeout(type, 1000);

  // 5. Preview Task Interaction
  document.querySelectorAll('.task-row').forEach(row => {
    row.addEventListener('click', () => {
      document.querySelectorAll('.task-row').forEach(r => {
        r.style.background = '';
        r.style.borderColor = 'rgba(31,37,53,0.5)';
      });
      row.style.background = 'rgba(0,229,196,0.05)';
      row.style.borderColor = 'rgba(0,229,196,0.2)';
    });
  });
});