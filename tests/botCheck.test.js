// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BotCheck from '../src/components/BotCheck.vue';
afterEach(() => { delete window.turnstile; vi.unstubAllEnvs(); });
it('requires the provider token, invalidates expired tokens and removes its widget', async () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'public-test-key'); let options;
  window.turnstile = { render: vi.fn((el, config) => { options = config; return 'widget'; }), remove: vi.fn() };
  const w = mount(BotCheck); await flushPromises();
  expect(options.action).toBe('signup'); expect(w.emitted('verified').at(-1)).toEqual(['']);
  options.callback('temporary-token'); expect(w.emitted('verified').at(-1)).toEqual(['temporary-token']);
  options['expired-callback'](); expect(w.emitted('verified').at(-1)).toEqual(['']);
  w.unmount(); expect(window.turnstile.remove).toHaveBeenCalledWith('widget');
});
it('fails closed with an accessible retry when no provider is configured', async () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', ''); const w = mount(BotCheck); await flushPromises();
  expect(w.get('[role="alert"]').text()).toContain('verificación');
  expect(w.emitted('verified').at(-1)).toEqual(['']); w.unmount();
});
