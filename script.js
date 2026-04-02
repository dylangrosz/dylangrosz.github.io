/* ═══════════════════════════════════════════════════
   Dylan Grosz — Personal Website
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────
  var currentView = 'professional'; // 'professional' | 'music'
  var keystrokeBuffer = '';
  var keystrokeTimer = null;
  var TRIGGER_WORD = 'music';
  var transitioning = false;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── DOM refs ───────────────────────────────────
  var proSection = document.getElementById('professional');
  var musicSection = document.getElementById('music');
  var overlay = document.getElementById('transition-overlay');
  var circle = document.getElementById('transition-circle');
  var heroPhoto = document.getElementById('hero-photo-wrapper');
  var heroName = document.getElementById('hero-name');
  var keystrokeHint = document.getElementById('keystroke-hint');
  var navToggle = document.getElementById('nav-toggle');
  var musicNavToggle = document.getElementById('music-nav-toggle');
  var backBtn = document.getElementById('back-to-pro');
  var musicBack = document.getElementById('music-back');

  // ─── Initialize ─────────────────────────────────
  function init() {
    // Check URL for /music (path, hash, or query param from redirect)
    var params = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes('/music') ||
        window.location.hash === '#/music' ||
        params.get('view') === 'music') {
      showView('music', false);
      // Ensure history state is set and URL is clean
      history.replaceState({ view: 'music' }, '', '/music');
    } else {
      showView('professional', false);
      history.replaceState({ view: 'professional' }, '', '/');
    }

    setupNavigation();
    setupScrollReveal();
    setupNavHide();
    setupKeystrokeListener();
    setupPhotoTrigger();
    setupMusicBackLinks();

    window.addEventListener('popstate', handlePopState);
  }


  // ─── View Switching ─────────────────────────────

  function showView(view, animated, skipPush) {
    if (animated === undefined) animated = true;
    if (view === currentView && proSection.classList.contains('active')) return;

    if (!animated) {
      // Instant switch (page load)
      proSection.classList.toggle('active', view === 'professional');
      musicSection.classList.toggle('active', view === 'music');
      currentView = view;
      document.body.style.background = view === 'music' ? '#0a0a0a' : '#fafaf8';
      window.scrollTo(0, 0);
      return;
    }

    // Animated transition
    transitionTo(view, undefined, undefined, skipPush);
  }

  function transitionTo(targetView, originX, originY, skipPush) {
    if (transitioning) return;
    transitioning = true;

    // Default origin: center of viewport
    if (originX === undefined) originX = window.innerWidth / 2;
    if (originY === undefined) originY = window.innerHeight / 2;

    var direction = targetView === 'music' ? 'to-music' : 'to-pro';

    // Position circle at origin
    circle.style.left = originX + 'px';
    circle.style.top = originY + 'px';
    circle.className = 'transition-circle ' + direction;

    // If going to music, spin the photo first
    if (targetView === 'music' && heroPhoto) {
      heroPhoto.classList.add('spinning');
      setTimeout(function () {
        expandCircle(targetView, skipPush);
      }, 500);
    } else {
      expandCircle(targetView, skipPush);
    }
  }

  function expandCircle(targetView, skipPush) {
    circle.classList.add('expanding');

    // Halfway through, swap the views
    setTimeout(function () {
      proSection.classList.toggle('active', targetView === 'professional');
      musicSection.classList.toggle('active', targetView === 'music');
      currentView = targetView;
      document.body.style.background = targetView === 'music' ? '#0a0a0a' : '#fafaf8';
      window.scrollTo(0, 0);

      // Move focus to the new view's heading
      var targetHeading = targetView === 'music'
        ? document.querySelector('#music-home h1')
        : document.querySelector('#hero h1');
      if (targetHeading) targetHeading.focus();

      // Update URL (skip during popstate to avoid corrupting history)
      if (!skipPush) {
        var path = targetView === 'music' ? '/music' : '/';
        history.pushState({ view: targetView }, '', path);
      }
    }, 400);

    // Collapse circle after transition complete
    setTimeout(function () {
      circle.className = 'transition-circle';
      if (heroPhoto) heroPhoto.classList.remove('spinning');
      transitioning = false;
    }, 900);
  }

  function handlePopState(e) {
    if (e.state && e.state.view) {
      showView(e.state.view, true, true);
    } else if (window.location.pathname.includes('/music')) {
      showView('music', true, true);
    } else {
      showView('professional', true, true);
    }
  }


  // ─── Navigation ─────────────────────────────────

  function setupNavigation() {
    // Mobile hamburger
    [navToggle, musicNavToggle].forEach(function (toggle) {
      if (toggle) {
        toggle.addEventListener('click', function () {
          var links = this.closest('.nav-inner').querySelector('.nav-links');
          var isOpen = links.classList.toggle('open');
          this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          return;
        }
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          // Close mobile nav if open
          var openNav = document.querySelector('.nav-links.open');
          if (openNav) {
            openNav.classList.remove('open');
            var toggle = openNav.closest('.nav-inner').querySelector('.nav-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
          }

          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
  }


  // ─── Nav Auto-Hide on Scroll ────────────────────

  function setupNavHide() {
    var lastScroll = 0;
    var nav = document.getElementById('main-nav');

    window.addEventListener('scroll', function () {
      var current = window.scrollY;
      if (current <= 0) {
        nav.classList.remove('hidden');
        return;
      }
      if (current > lastScroll && current > 100) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastScroll = current;
    }, { passive: true });
  }


  // ─── Scroll Reveal ──────────────────────────────

  function setupScrollReveal() {
    // Tag elements for reveal
    var selectors = [
      '.timeline-item',
      '.pub-card',
      '.education-card',
      '.about-content',
      '.contact-links'
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.classList.add('reveal');
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }


  // ─── Keystroke Listener ("music") ───────────────

  function setupKeystrokeListener() {
    document.addEventListener('keydown', function (e) {
      // Ignore if typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // Ignore modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      var key = e.key.toLowerCase();

      // Only track lowercase letters
      if (key.length !== 1 || !/[a-z]/.test(key)) {
        resetKeystroke();
        return;
      }

      keystrokeBuffer += key;

      // Reset timer — user has 2s between keystrokes
      clearTimeout(keystrokeTimer);
      keystrokeTimer = setTimeout(resetKeystroke, 2000);

      // Check if buffer matches the trigger so far
      if (TRIGGER_WORD.startsWith(keystrokeBuffer)) {
        updateKeystrokeHint(keystrokeBuffer);

        if (keystrokeBuffer === TRIGGER_WORD) {
          // Trigger the transition
          resetKeystroke();
          if (currentView === 'professional') {
            transitionTo('music');
          } else {
            transitionTo('professional');
          }
        }
      } else {
        resetKeystroke();
      }
    });
  }

  function updateKeystrokeHint(typed) {
    if (typed.length < 2) {
      keystrokeHint.classList.remove('visible');
      return;
    }

    var remaining = TRIGGER_WORD.slice(typed.length);

    // Build hint using safe DOM methods (no innerHTML)
    while (keystrokeHint.firstChild) {
      keystrokeHint.removeChild(keystrokeHint.firstChild);
    }

    var typedSpan = document.createElement('span');
    typedSpan.className = 'typed';
    typedSpan.textContent = typed;

    var untypedSpan = document.createElement('span');
    untypedSpan.className = 'untyped';
    untypedSpan.textContent = remaining;

    keystrokeHint.appendChild(typedSpan);
    keystrokeHint.appendChild(untypedSpan);
    keystrokeHint.classList.add('visible');
  }

  function resetKeystroke() {
    keystrokeBuffer = '';
    clearTimeout(keystrokeTimer);
    keystrokeHint.classList.remove('visible');
  }


  // ─── Photo / Name Right-Click Trigger ───────────

  function setupPhotoTrigger() {
    var triggers = [heroPhoto, heroName].filter(Boolean);

    triggers.forEach(function (el) {
      el.addEventListener('contextmenu', function (e) {
        e.preventDefault();

        // Get click position for circle origin
        var rect = heroPhoto.getBoundingClientRect();
        var originX = rect.left + rect.width / 2;
        var originY = rect.top + rect.height / 2;

        if (currentView === 'professional') {
          transitionTo('music', originX, originY);
        } else {
          transitionTo('professional', originX, originY);
        }
      });
    });
  }


  // ─── Music Section Back Links ───────────────────

  function setupMusicBackLinks() {
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        transitionTo('professional');
      });
    }
    if (musicBack) {
      musicBack.addEventListener('click', function (e) {
        e.preventDefault();
        transitionTo('professional');
      });
    }
  }


  // ─── Go ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
