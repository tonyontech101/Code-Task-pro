// Landing Page Interaction Logic

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mouse Glow Effect
  const glow = document.getElementById('mouseGlow');
  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    currentX += (mouseX - currentX) * 0.1;
    currentY += (mouseY - currentY) * 0.1;
    if (glow) {
      glow.style.left = currentX + 'px';
      glow.style.top = currentY + 'px';
    }
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // 2. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const body = document.body;

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isActive = menuToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      body.style.overflow = isActive ? 'hidden' : '';
    });

    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        body.style.overflow = '';
      });
    });
  }

  // 3. Scroll Reveal Observer
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  reveals.forEach(el => observer.observe(el));

  // 4. Sticky Header Logic
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  });

  // 5. Typewriter Hero Effect
  const words = ["Not chaos.", "Not complexity.", "Just quality.", "Faster than ever."];
  const target = document.querySelector('.hero-title .line2');
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

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
      typeSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  if (target) setTimeout(type, 1000);

  // 6. Preview Task Interaction
  document.querySelectorAll('.task-row').forEach(row => {
    row.addEventListener('click', () => {
      document.querySelectorAll('.task-row').forEach(r => {
        r.classList.remove('active-task');
      });
      row.classList.add('active-task');
    });
  });
});