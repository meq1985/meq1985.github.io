// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive, onMounted, h, nextTick } from 'vue';
const state = vi.hoisted(() => ({ store: null }));
vi.mock('../src/stores/user', () => ({ useUserStore: () => state.store }));
import App from '../src/App.vue';
it('recreates the route view when switching accounts so previous project data does not remain visible', async () => {
  state.store = reactive({ user: { uid: 'first' } });
  const mounted = vi.fn();
  const RouteView = { setup() { onMounted(mounted); const owner = state.store.user?.uid; return () => h('p', owner ?? 'guest'); } };
  const wrapper = mount(App, { global: { stubs: { RouterView: RouteView } } });
  expect(wrapper.text()).toBe('first');
  state.store.user = { uid: 'second' }; await nextTick();
  expect(wrapper.text()).toBe('second'); expect(mounted).toHaveBeenCalledTimes(2);
  state.store.user = null; await nextTick(); expect(wrapper.text()).toBe('guest'); wrapper.unmount();
});
