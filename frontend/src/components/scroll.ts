import { useEffect, useMemo, useRef, useState } from 'react';

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

export function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY || 0));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return y;
}

export function useParallax(strength = 0.06) {
  const y = useScrollY();
  return useMemo(() => Math.round(y * strength), [y, strength]);
}

export function useSectionProgress(sectionEl: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = sectionEl.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress: 0 when section top at bottom of viewport, 1 when section bottom at top of viewport
      const raw = (vh - r.top) / (vh + r.height);
      setP(clamp01(raw));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sectionEl]);
  return p;
}

export function useRevealOnView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setVisible(true);
        }
      },
      { root: null, threshold: 0.15, ...options },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [options]);

  return { ref, visible };
}

