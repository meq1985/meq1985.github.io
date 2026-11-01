// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BudgetShare from '../src/components/BudgetShare.vue';
const file=new File(['%PDF-ficticio'],'presupuesto-demo.pdf',{type:'application/pdf'});
const payload={file,filename:file.name,title:'Presupuesto EX-DEMO',message:'Hola Cliente. Total $1.000.'};
beforeEach(()=>{
 Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:pdf-ficticio')});
 Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(){this.open=true;}});
 Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
 Object.defineProperty(navigator,'canShare',{configurable:true,value:undefined});
});
afterEach(()=>vi.restoreAllMocks());
it('provides truthful manual attachment links and revokes the private download URL on close',async()=>{
 const w=mount(BudgetShare,{props:{payload,authorize:vi.fn()}});await flushPromises();
 expect(w.get('dialog').element.open).toBe(true);
 expect(w.text()).toContain('sin adjuntar el archivo');expect(w.text()).toContain('Descargá el PDF');
 expect(w.findAll('button').some(b=>b.text().includes('Compartir PDF con otra aplicación'))).toBe(false);
 expect(w.get('a[download]').attributes('href')).toBe('blob:pdf-ficticio');
 expect(w.get('a[href^="https://wa.me/"]').attributes('rel')).toContain('noopener');
 w.unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf-ficticio');
});
it('shares a prepared file on a direct user gesture without claiming delivery',async()=>{
 const share=vi.fn().mockResolvedValue();Object.defineProperty(navigator,'share',{configurable:true,value:share});Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 const authorize=vi.fn(),w=mount(BudgetShare,{props:{payload,authorize}});await flushPromises();
 await w.findAll('button').find(b=>b.text().includes('Compartir PDF')).trigger('click');await flushPromises();
 expect(share).toHaveBeenCalledExactlyOnceWith({files:[file],title:payload.title,text:payload.message});expect(authorize).toHaveBeenCalledOnce();
 expect(w.get('[role="status"]').text()).toContain('no puede comprobar su entrega');w.unmount();
});
it('treats cancellation as cancellation and prevents sharing after the session changes',async()=>{
 const share=vi.fn().mockRejectedValue(Object.assign(new Error(),{name:'AbortError'}));Object.defineProperty(navigator,'share',{configurable:true,value:share});Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 const authorize=vi.fn(),w=mount(BudgetShare,{props:{payload,authorize}});await flushPromises();
 const button=w.findAll('button').find(b=>b.text().includes('Compartir PDF'));
 await button.trigger('click');await flushPromises();expect(w.text()).toContain('Compartir cancelado');
 authorize.mockImplementation(()=>{throw new Error('La sesión cambió');});await button.trigger('click');await flushPromises();
 expect(share).toHaveBeenCalledOnce();expect(w.get('[role="alert"]').text()).toContain('La sesión cambió');w.unmount();
});

it('copies only the reviewed text as a local fallback for webmail',async()=>{
 const writeText=vi.fn().mockResolvedValue();Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
 const w=mount(BudgetShare,{props:{payload,authorize:vi.fn()}});await flushPromises();
 await w.get('textarea').setValue('Mensaje revisado por el profesional');
 await w.findAll('button').find(b=>b.text()==='Copiar mensaje').trigger('click');await flushPromises();
 expect(writeText).toHaveBeenCalledExactlyOnceWith('Mensaje revisado por el profesional');expect(w.get('[role="status"]').text()).toContain('Mensaje copiado');w.unmount();
});
