// @ts-nocheck — verbatim template code (vendor globals: Lenis, gsap, ScrollTrigger, WfRuntime)
// Site behaviour carried over unchanged from the original template's inline scripts:
// Lenis smooth scrolling, [data-counter] count-ups, slider side blur, lottie-on-scroll and the GSAP section motion.
// Lenis, GSAP, ScrollTrigger and the interaction runtime (public/js/webflow.js) are loaded as classic scripts in BaseLayout.astro (window
// globals), because that runtime expects the same globals. Bundled by Astro as an ES module, which runs
// after those classic scripts and before the runtime's DOM-ready callbacks.
/* global Lenis, gsap, ScrollTrigger, WfRuntime */
// The runtime exposes itself as `window.WfRuntime` (renamed from the export's `window.Webflow`, so the site is not
// fingerprinted as a Webflow site; behaviour is unchanged).

// Smooth scrolling (was in the template's <head>). Skipped when the visitor prefers reduced motion (native scrolling).
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const lenis = new Lenis({
    smoothWheel: true,
    lerp: 0.1,
    wheelMultiplier: 1,
    infinite: false
  });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
window.WfRuntime ||= [];
// Counters: [data-counter] counts up when it scrolls into view
window.WfRuntime.push(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;
  gsap.registerPlugin(ScrollTrigger);
  const pending = [];
  counters.forEach((counter) => {
    const textEl = counter.firstElementChild || counter;
    const original = textEl.textContent.trim();
    const match = original.match(/^([^0-9.-]*)([0-9.,-]+)(.*)$/);
    if (!match) return;
    const prefix = match[1];
    const number = match[2].replace(/,/g, "");
    const suffix = match[3];
    const target = parseFloat(number);
    if (Number.isNaN(target)) return;
    const hasDecimal = number.includes(".");
    const hasComma = original.includes(",");
    const value = { current: 0 };
    const render = () => {
      let formattedValue = hasDecimal
        ? value.current.toFixed(1)
        : Math.floor(value.current);
      if (hasComma && !hasDecimal) {
        formattedValue = Number(formattedValue).toLocaleString();
      }
      textEl.textContent = prefix + formattedValue + suffix;
    };
    const finish = () => { textEl.textContent = original; };
    const item = { counter, started: false };
    item.start = () => {
      if (item.started) return;
      item.started = true;
      gsap.to(value, {
        current: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: render,
        onComplete: finish
      });
    };
    // Already scrolled past this counter: show the real number, no animation
    if (counter.getBoundingClientRect().bottom < 0) return;
    // Start at 0 until the counter scrolls into view
    render();
    pending.push(item);
    // The trigger only starts the tween; refreshes can never reset it
    ScrollTrigger.create({
      trigger: counter,
      start: "top 88%",
      onEnter: item.start,
      onEnterBack: item.start,
      onLeave: item.start
    });
  });
  if (!pending.length) return;
  // Fallback: start any counter that is on (or above) the screen but was missed
  const check = () => {
    pending.forEach((item) => {
      if (!item.started && item.counter.getBoundingClientRect().top < window.innerHeight * 0.95) item.start();
    });
    if (pending.every((item) => item.started)) clearInterval(timer);
  };
  const timer = setInterval(check, 1500);
  // Recalculate trigger positions after lazy images and layout settle
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  document.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", refresh, { once: true });
  });
  setTimeout(refresh, 1500);
});
// Slider side blur: add data-slider-blur to a native Slider. The active slide stays
// sharp, the others blur. The interaction runtime sets aria-hidden on inactive slides the moment a
// change starts, so this follows arrows, swipe, dots and autoplay.
window.WfRuntime.push(() => {
  if (!window.gsap) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-slider-blur]").forEach((slider) => {
    const duration = reduced ? 0 : (Number(slider.dataset.duration) || 500) / 1000;
    slider.querySelectorAll(".w-slide").forEach((slide) => {
      const state = { blur: 0 };
      const render = () => {
        slide.style.filter = state.blur ? "blur(" + state.blur + "px)" : "";
      };
      const update = (time) => gsap.to(state, {
        blur: slide.hasAttribute("aria-hidden") ? 6 : 0,
        duration: time,
        ease: "power2.out",
        overwrite: true,
        onUpdate: render,
        onComplete: render
      });
      update(0);
      new MutationObserver(() => update(duration)).observe(slide, {
        attributes: true,
        attributeFilter: ["aria-hidden"]
      });
    });
  });
});
// Lottie: each animation plays once when it scrolls into view
window.WfRuntime.push(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (!document.querySelector("[data-animation-type='lottie']")) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen = new WeakSet();
  let tries = 0;
  const setup = () => {
    const module = WfRuntime.require && WfRuntime.require("lottie");
    if (module && module.lottie) {
      module.lottie.getRegisteredAnimations().forEach((animation) => {
        if (seen.has(animation) || !animation.totalFrames) return;
        seen.add(animation);
        if (reduced) {
          animation.goToAndStop(animation.totalFrames - 1, true);
          return;
        }
        animation.goToAndStop(0, true);
        ScrollTrigger.create({
          trigger: animation.wrapper,
          start: "top 80%",
          once: true,
          onEnter: () => animation.goToAndPlay(0, true)
        });
      });
    }
    // Keep checking for 30 seconds while animation files load
    if (++tries < 200) gsap.delayedCall(0.15, setup);
  };
  setup();
});
// Section motion (GSAP + ScrollTrigger). Each part looks for its own classes and
// skips quietly when they are not on the page. Reduced motion turns it all off.
window.WfRuntime.push(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = (s, root) => Array.from((root || document).querySelectorAll(s));
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Hover reveal: the child fades up when its card is hovered or focused.
  // On touch screens the child simply stays visible.
  const hoverReveal = (cardSel, childSel, collapse) => {
    if (!canHover) return;
    $(cardSel).forEach((card) => {
      const child = card.querySelector(childSel);
      if (!child) return;
      const from = collapse ? { autoAlpha: 0, height: 0 } : { autoAlpha: 0, y: 12 };
      const to = collapse ? { autoAlpha: 1, height: "auto" } : { autoAlpha: 1, y: 0 };
      gsap.set(child, from);
      const show = () => gsap.to(child, { ...to, duration: 0.45, ease: "power3.out", overwrite: true });
      const hide = () => gsap.to(child, { ...from, duration: 0.35, ease: "power2.out", overwrite: true });
      card.addEventListener("mouseenter", show);
      card.addEventListener("mouseleave", hide);
      card.addEventListener("focusin", show);
      card.addEventListener("focusout", hide);
    });
  };
  hoverReveal(".about-mission-card", ".about-card-text", true);
  hoverReveal(".about-team-card", ".about-team-social");
  hoverReveal(".home-v3-cases-card", ".home-v3-cases-card-button");
  // Home V3: the journey rings swing slowly around their centre
  $(".home-v3-intro-journey-orbit").forEach((orbit) => {
    gsap.fromTo(orbit, { rotation: -6 }, { rotation: 6, duration: 7, ease: "sine.inOut", repeat: -1, yoyo: true });
  });
  // Home V1: a stacked service card fades back as the next one slides over it
  const stack = $(".home-services-item");
  stack.forEach((item, i) => {
    const next = stack[i + 1];
    const card = item.querySelector(".home-services-card");
    if (!next || !card) return;
    gsap.to(card, {
      opacity: 0.35, scale: 0.94, filter: "blur(4px)", ease: "none",
      scrollTrigger: { trigger: next, start: "top 90%", end: "top 20%", scrub: true }
    });
  });
  // About: value cards start stacked and fan out as the section scrolls in
  $(".about-values-cards").forEach((wrap) => {
    const cards = $(".about-values-card", wrap);
    if (cards.length < 2) return;
    const box = wrap.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    gsap.from(cards, {
      x: (i, el) => { const r = el.getBoundingClientRect(); return mid - (r.left + r.width / 2); },
      rotation: 0, scale: 0.92, ease: "power2.out",
      scrollTrigger: { trigger: wrap, start: "top 85%", end: "top 35%", scrub: 0.6 }
    });
  });
  // About: the numbers photo grows from small to full width on scroll
  $(".about-stats-media").forEach((media) => {
    gsap.fromTo(media, { scale: 0.62 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: media, start: "top 95%", end: "top 30%", scrub: true }
    });
  });
  // Service page: the approach steps change as you scroll, not on tap.
  // The tabs pin while each step gets a share of the scroll.
  ScrollTrigger.matchMedia({
    "(min-width: 992px)": () => {
      $(".service-details-approach-tabs").forEach((tabs) => {
        const links = $(".w-tab-link", tabs);
        if (links.length < 2) return;
        let current = 0;
        ScrollTrigger.create({
          trigger: tabs,
          start: "top 15%",
          end: () => "+=" + window.innerHeight * 0.6 * links.length,
          pin: true,
          onUpdate: (self) => {
            const index = Math.min(links.length - 1, Math.floor(self.progress * links.length));
            if (index !== current) { current = index; links[index].click(); }
          }
        });
      });
    }
  });
  window.addEventListener("load", () => ScrollTrigger.refresh());
});
