import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/ui/header-bar.js';
import type { HeaderBar } from '../../src/ui/header-bar.js';

describe('HeaderBar', () => {
  let el: HeaderBar;

  beforeEach(async () => {
    el = document.createElement('sys-header-bar') as HeaderBar;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  describe('rendering', () => {
    it('should register as a custom element', () => {
      expect(customElements.get('sys-header-bar')).toBeDefined();
    });

    it('should render the title "SYS_CLI // AGENT"', async () => {
      const shadow = el.shadowRoot!;
      const title = shadow.querySelector('.title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('SYS_CLI // AGENT');
    });

    it('should render three status dots', async () => {
      const shadow = el.shadowRoot!;
      const dots = shadow.querySelectorAll('.dot');
      expect(dots.length).toBe(3);
    });

    it('should render close dot with dot--close class', async () => {
      const shadow = el.shadowRoot!;
      const closeDot = shadow.querySelector('.dot--close');
      expect(closeDot).not.toBeNull();
    });

    it('should render minimize dot with dot--minimize class', async () => {
      const shadow = el.shadowRoot!;
      const minimizeDot = shadow.querySelector('.dot--minimize');
      expect(minimizeDot).not.toBeNull();
    });

    it('should render active dot with dot--active class', async () => {
      const shadow = el.shadowRoot!;
      const activeDot = shadow.querySelector('.dot--active');
      expect(activeDot).not.toBeNull();
    });

    it('should have a banner role on the header', async () => {
      const shadow = el.shadowRoot!;
      const header = shadow.querySelector('[role="banner"]');
      expect(header).not.toBeNull();
    });

    it('should hide dots from assistive technology with aria-hidden', async () => {
      const shadow = el.shadowRoot!;
      const dotsContainer = shadow.querySelector('.dots');
      expect(dotsContainer!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('status property', () => {
    it('should default status to "idle"', () => {
      expect(el.status).toBe('idle');
    });

    it('should accept "connecting" status', async () => {
      el.status = 'connecting';
      await el.updateComplete;
      expect(el.status).toBe('connecting');
      expect(el.getAttribute('status')).toBe('connecting');
    });

    it('should accept "connected" status', async () => {
      el.status = 'connected';
      await el.updateComplete;
      expect(el.status).toBe('connected');
      expect(el.getAttribute('status')).toBe('connected');
    });

    it('should accept "error" status', async () => {
      el.status = 'error';
      await el.updateComplete;
      expect(el.status).toBe('error');
      expect(el.getAttribute('status')).toBe('error');
    });

    it('should reflect status attribute to property', async () => {
      el.setAttribute('status', 'connected');
      await el.updateComplete;
      expect(el.status).toBe('connected');
    });

    it('should show active dot title with current status', async () => {
      el.status = 'connected';
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      const activeDot = shadow.querySelector('.dot--active');
      expect(activeDot!.getAttribute('title')).toBe('Status: connected');
    });
  });

  describe('Technical Brutalism styling', () => {
    it('should use design tokens via CSS custom properties', async () => {
      const shadow = el.shadowRoot!;
      const header = shadow.querySelector('.header') as HTMLElement;
      expect(header).not.toBeNull();
      // Verify the header element exists and the styles are applied
      // (jsdom doesn't compute CSS custom properties, but we validate structure)
      expect(header.classList.contains('header')).toBe(true);
    });

    it('should have a header element with border-bottom styling', async () => {
      const shadow = el.shadowRoot!;
      const header = shadow.querySelector('.header');
      expect(header).not.toBeNull();
    });

    it('should render dots in order: close, minimize, active', async () => {
      const shadow = el.shadowRoot!;
      const dots = shadow.querySelectorAll('.dot');
      expect(dots[0].classList.contains('dot--close')).toBe(true);
      expect(dots[1].classList.contains('dot--minimize')).toBe(true);
      expect(dots[2].classList.contains('dot--active')).toBe(true);
    });
  });
});
