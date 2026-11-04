/* LitVM nav safety layer.
   Hover-open is handled in CSS. This script keeps dropdowns clickable on
   touch/keyboard and makes navbar scroll links deterministic instead of
   relying on the old Webflow/GSAP handler. */
(function () {
  var SCROLL_TARGETS = {
    about: '#about',
    mission: '#mission-section, #mission',
    infrastructure: '[data-scroll-target="infrastructure"], #infrastructure',
    usecases: '[data-scroll-target="usecases"], #usecases',
    ecosystem: '[data-scroll-target="ecosystem"], #ecosystem'
  };

  function closeDropdowns(dropdowns, except) {
    dropdowns.forEach(function (dd) {
      if (except && dd === except) return;
      var toggle = dd.querySelector('.w-dropdown-toggle');
      var list = dd.querySelector('.w-dropdown-list');
      if (toggle) toggle.classList.remove('w--open');
      if (list) list.classList.remove('w--open');
      dd.classList.remove('w--open');
    });
  }

  function getScrollKeyFromUrl(url) {
    try {
      var parsed = new URL(url, window.location.href);
      return parsed.searchParams.get('scroll') || (parsed.hash ? parsed.hash.slice(1) : '');
    } catch (e) {
      return '';
    }
  }

  function getTarget(key) {
    var selector = SCROLL_TARGETS[key] || (key ? '#' + key : '');
    if (!selector) return null;
    // querySelector with a comma list returns the first match in document
    // order. Walk the selectors so their declared priority remains explicit.
    var parts = selector.split(',');
    for (var i = 0; i < parts.length; i++) {
      var el = document.querySelector(parts[i].trim());
      if (el) return el;
    }
    return null;
  }

  function getScrollY(key, target, navOffset) {
    var storyPhases = { about: 1.5, mission: 2.8 };
    var story = document.querySelector('.hero-about-mission');
    var isPinnedStory = story && window.matchMedia('(min-width: 768px)').matches;

    // About and Mission are layered inside a 500vh sticky story on desktop,
    // so their DOM offsets both sit near the top of the page. Target stable
    // points in that story instead of detached absolutely positioned anchors.
    if (isPinnedStory && storyPhases[key]) {
      return story.getBoundingClientRect().top + window.pageYOffset +
        (window.innerHeight * storyPhases[key]) - navOffset - 12;
    }

    return target.getBoundingClientRect().top + window.pageYOffset - navOffset - 12;
  }

  function scrollToKey(key, updateUrl) {
    var target = getTarget(key);
    if (!target) return false;

    var nav = document.querySelector('.nav-wrap');
    var navOffset = nav ? Math.min(nav.offsetHeight, 96) : 0;
    var y = getScrollY(key, target, navOffset);

    // Jump directly so scrubbed GSAP timelines do not rapid-play every section
    // between the current position and the destination.
    window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });

    if (updateUrl && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname || '/');
    }
    return true;
  }

  function initDropdowns() {
    var dropdowns = Array.prototype.slice.call(document.querySelectorAll('.nav-wrap .w-dropdown'));
    if (!dropdowns.length) return;

    dropdowns.forEach(function (dd) {
      var toggle = dd.querySelector('.w-dropdown-toggle');
      var list = dd.querySelector('.w-dropdown-list');
      if (!toggle || !list) return;

      toggle.setAttribute('role', 'button');
      toggle.setAttribute('tabindex', '0');

      // A single tap on a touch device fires BOTH touchend and a synthesized
      // click. Without a guard those two events open then immediately re-close
      // the dropdown, so it looks like tapping "Learn More" does nothing and you
      // can never reach the page links inside it. Ignore the paired second event.
      var lastToggle = 0;
      function toggleOpen(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();

        var now = (Date && Date.now) ? Date.now() : +new Date();
        if (now - lastToggle < 500) return;
        lastToggle = now;

        var wasOpen = toggle.classList.contains('w--open') || list.classList.contains('w--open');
        closeDropdowns(dropdowns, dd);
        toggle.classList.toggle('w--open', !wasOpen);
        list.classList.toggle('w--open', !wasOpen);
        dd.classList.toggle('w--open', !wasOpen);
      }

      toggle.addEventListener('click', toggleOpen, true);
      toggle.addEventListener('touchend', toggleOpen, true);
      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') toggleOpen(e);
        if (e.key === 'Escape') closeDropdowns(dropdowns);
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-wrap .w-dropdown')) closeDropdowns(dropdowns);
    });
  }

  function initAnchorScroll() {
    document.querySelectorAll('.nav-wrap [data-scroll-to], .nav-wrap a[href*="scroll="]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var key = link.getAttribute('data-scroll-to') || getScrollKeyFromUrl(link.getAttribute('href') || '');
        if (!key) return;

        if (scrollToKey(key, false)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          closeDropdowns(Array.prototype.slice.call(document.querySelectorAll('.nav-wrap .w-dropdown')));
        }
      }, true);
    });

    var requested = getScrollKeyFromUrl(window.location.href);
    if (requested) {
      window.setTimeout(function () { scrollToKey(requested, true); }, 250);
    }
  }

  function init() {
    initDropdowns();
    initAnchorScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
