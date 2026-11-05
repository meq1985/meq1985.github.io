// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
const mocked=vi.hoisted(()=>({consent:vi.fn(()=>null),apply:vi.fn()}));
vi.mock('../src/services/analytics',()=>({CONSENT_KEY:'ex.analytics.v1',analytics:()=>mocked}));
import AnalyticsConsent from '../src/components/AnalyticsConsent.vue';
afterEach(()=>{mocked.consent.mockReturnValue(null);mocked.apply.mockClear();});
it('offers equal accept/reject choices and applies rejection without restricting the app',async()=>{
  const w=mount(AnalyticsConsent,{global:{stubs:{RouterLink:true}}});
  await flushPromises(); const buttons=w.findAll('button');expect(buttons.map(b=>b.text())).toEqual(['Rechazar Analytics','Aceptar Analytics']);
  await buttons[0].trigger('click');expect(mocked.apply).toHaveBeenCalledWith('denied');expect(w.find('aside').exists()).toBe(false);
  expect(w.find('button').exists()).toBe(false);w.unmount();
});
it('acceptance is an explicit separate action and can be reviewed later',async()=>{
  const w=mount(AnalyticsConsent,{global:{stubs:{RouterLink:true}}});await flushPromises(); expect(mocked.apply).not.toHaveBeenCalled();
  await w.findAll('button')[1].trigger('click');
  expect(mocked.apply).toHaveBeenCalledWith('granted');
  expect(w.text()).toBe('');
  w.vm.openPreferences();
  await flushPromises();
  expect(w.find('aside').exists()).toBe(true);
  w.unmount();
});
it.each(['granted', 'denied'])('stays hidden on a return visit after choosing %s',async choice=>{
  mocked.consent.mockReturnValue(choice);
  const w=mount(AnalyticsConsent,{global:{stubs:{RouterLink:true}}});
  await flushPromises();
  expect(w.text()).toBe('');
  expect(mocked.apply).not.toHaveBeenCalled();
  w.unmount();
});
