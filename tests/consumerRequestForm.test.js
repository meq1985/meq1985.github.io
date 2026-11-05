// @vitest-environment jsdom
import {it,expect,vi,beforeEach} from 'vitest';import {mount,flushPromises} from '@vue/test-utils';
vi.mock('../src/services/consumerManagement',()=>({submitConsumerManagement:vi.fn()}));
import {submitConsumerManagement} from '../src/services/consumerManagement';import Form from '../src/components/ConsumerRequestForm.vue';
const render=()=>mount(Form,{global:{stubs:{BotCheck:{template:'<button type="button" @click="$emit(\'verified\',\'fake-token\')">Validación ficticia</button>'},RouterLink:{template:'<a><slot/></a>'}}}});
beforeEach(()=>{vi.resetAllMocks();window.history.replaceState({},'','/gestiones');});
it('submits without login and returns a receipt without claiming cancellation or refund',async()=>{
 submitConsumerManagement.mockResolvedValue({receipt:'EX-FICTICIO',status:'received'});const w=render();
 expect(w.get('button[type=submit]').element.disabled).toBe(true);await w.get('input[type=email]').setValue('owner@example.invalid');await w.get('button[type=button]').trigger('click');await w.get('form').trigger('submit');await flushPromises();
 expect(submitConsumerManagement).toHaveBeenCalledTimes(1);expect(w.text()).toContain('EX-FICTICIO');expect(w.text()).toContain('no confirma una baja o devolución ya completada');expect(w.text()).toContain('Descargar comprobante');w.unmount();
});
it('keeps an unsuccessful request retryable without displaying a false receipt',async()=>{
 submitConsumerManagement.mockRejectedValue(Error('private'));const w=render();await w.get('input[type=email]').setValue('owner@example.invalid');await w.get('button[type=button]').trigger('click');await w.get('form').trigger('submit');await flushPromises();expect(w.get('[role=alert]').text()).toContain('No pudimos registrar');expect(w.text()).not.toContain('private');expect(w.text()).not.toContain('Solicitud recibida');w.unmount();
});
