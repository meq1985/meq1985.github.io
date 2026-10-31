import { paymentSummary } from './promotions';
import { sketchMaterials } from './sketchMaterials';
const clean = value => value == null ? '' : String(value).trim().replaceAll('→', ' a ').replaceAll('↔', ' / ').replaceAll('–', '-').replaceAll('—', '-');
const money = value => '$ ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const NAVY = [32, 48, 68], BLUE = [36, 117, 185], MUTED = [85, 101, 120];
export async function buildBudgetPdf(budget, profile, { example = false, sketch = null } = {}) {
  // Validate all financial alternatives before drawing: no hidden discount on financed options.
  const payment = paymentSummary(budget.total, budget.paymentOptions);
  const materials = sketchMaterials(sketch);
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF(), left = 16, right = 194, width = right - left;
  const timestamp = new Date(budget.createdAt ?? Date.now());
  if (Number.isNaN(timestamp.getTime())) throw new Error('La fecha del presupuesto no es válida.');
  const issued = timestamp.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  doc.setProperties({ title: `Presupuesto - ${clean(budget.cliente)}`, subject: 'Mano de obra eléctrica y materiales del croquis', creator: 'Electricista Xpress' });
  function text(value, x, y, size = 10, color = NAVY, weight = 'normal', options) {
    doc.setFont('helvetica', weight); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(Array.isArray(value) ? value.map(clean) : clean(value), x, y, options);
  }
  function wrapped(value, x, y, maxWidth, size = 10, color = NAVY, weight = 'normal') {
    doc.setFont('helvetica', weight); doc.setFontSize(size);
    const lines = doc.splitTextToSize(clean(value), maxWidth); text(lines, x, y, size, color, weight);
    return y + lines.length * size * 0.405;
  }
  function continuation(title = 'PRESUPUESTO') {
    text(title, left, 18, 14, NAVY, 'bold');
    text(`Fecha: ${issued}`, right, 18, 9, MUTED, 'normal', { align: 'right' });
    doc.setDrawColor(...BLUE); doc.setLineWidth(.6); doc.line(left, 24, right, 24);
  }
  doc.setFillColor(...BLUE); doc.roundedRect(left, 12, 10, 12, 2, 2, 'F');
  doc.setDrawColor(255,255,255); doc.setLineWidth(.8);
  doc.line(22,14,19,18); doc.line(19,18,23,18); doc.line(23,18,20,22);
  text('PRESUPUESTO', 31, 19, 19, NAVY, 'bold');
  text('Instalación eléctrica | Mano de obra', 31, 25, 8, MUTED);
  text(`Fecha: ${issued}`, right, 18, 10, NAVY, 'bold', { align: 'right' });
  doc.setDrawColor(...NAVY); doc.setLineWidth(.5); doc.line(left, 29, right, 29);
  // Compact two-column identity: preserve every field without a large fixed-height card.
  const name = [clean(profile.nombre1), clean(profile.apellido1)].filter(Boolean).join(' ') || 'Electricista';
  const identity = [clean(profile.empresa1), [profile.cuit1 && `CUIT: ${clean(profile.cuit1)}`, profile.matricula1 && `Matrícula: ${clean(profile.matricula1)}`].filter(Boolean).join(' · ')].filter(Boolean);
  let iy = wrapped(name, left, 36, 94, 11, NAVY, 'bold');
  for (const line of identity) iy = wrapped(line, left, iy + 1, 94, 8.5, MUTED);
  let cy = 35;
  for (const [label, value] of [['Teléfono',profile.telefono1],['Correo',profile.correo],['Dirección',profile.direccion1]]) if (clean(value)) cy = wrapped(`${label}: ${clean(value)}`, 116, cy, 78, 8, MUTED) + 1;
  const clientY = Math.max(iy, cy) + 5;
  doc.setFillColor(243,246,250);
  // Draw client details after measuring their real height, keeping long text readable.
  doc.setFontSize(10); doc.setFont('helvetica','bold');
  const clientLines = doc.splitTextToSize('Cliente: ' + clean(budget.cliente), width - 10);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  const propertyLines = clean(budget.tipoInmueble) ? doc.splitTextToSize('Tipo de inmueble: ' + clean(budget.tipoInmueble), width - 10) : [];
  const clientHeight = clientLines.length * 4.1 + propertyLines.length * 3.3 + 6;
  doc.roundedRect(left, clientY - 3, width, clientHeight, 1.5, 1.5, 'F');
  text(clientLines, left + 5, clientY + 2, 10, NAVY, 'bold');
  if (propertyLines.length) text(propertyLines, left + 5, clientY + 3 + clientLines.length * 4.1, 8, MUTED);
  const rows = budget.items.filter(item => item.cantidad !== 0).map(item => [clean(item.codigo), clean(item.descripcion), `${item.cantidad}${item.unidad ? ' ' + clean(item.unidad) : ''}`, money(item.precioUnitario), money(item.precioTotal)]);
  const dense = rows.length > 12;
  autoTable(doc, {
    head: [['Código','Detalle','Cantidad / unidad','Precio unitario','Importe']], body: rows,
    startY: clientY + clientHeight + 1, margin: { left, right: left, top: 30, bottom: 28 },
    theme:'plain', showHead:'everyPage', rowPageBreak:'avoid',
    styles: { font:'helvetica',fontSize:dense ? 8 : 8.5,textColor:NAVY,cellPadding:dense ? 1.7 : 2.2,overflow:'linebreak',lineColor:[221,228,236],lineWidth:{bottom:.2} },
    headStyles:{fillColor:NAVY,textColor:[255,255,255],fontStyle:'bold',fontSize:7.5},alternateRowStyles:{fillColor:[247,249,252]},
    columnStyles:{0:{cellWidth:19,fontSize:7.5,textColor:MUTED},1:{cellWidth:65},2:{cellWidth:28},3:{cellWidth:33,halign:'right'},4:{cellWidth:33,halign:'right',fontStyle:'bold'}},
    willDrawPage: data => { if(data.pageNumber > 1) continuation(); },
  });
  let y = doc.lastAutoTable.finalY + 5;
  if (y + 23 > 269) { doc.addPage(); continuation(); y = 32; }
  doc.setFillColor(...NAVY);doc.roundedRect(left,y,width,17,2,2,'F');
  text('TOTAL MANO DE OBRA',left+5,y+7,9,[255,255,255],'bold');
  text('Pesos argentinos (ARS)',left+5,y+12.5,7,[201,218,234]);
  doc.setFont('helvetica','bold');doc.setFontSize(17);
  text(money(payment.base),right-5,y+11,Math.min(17,17*78/doc.getTextWidth(money(payment.base))),[255,255,255],'bold',{align:'right'});
  text('Mano de obra. Materiales no incluidos en este importe.',left,y+22,7.5,MUTED);y += 28;
  const alternatives = [];
  if(payment.discountPercent > 0) alternatives.push(['Contado',`${payment.discountPercent} % de descuento`,money(payment.cashTotal),money(payment.cashTotal)]);
  for(const p of payment.plans) alternatives.push([`${p.count} cuotas`,`${p.surchargePercent} % de recargo`,p.installment===p.lastInstallment ? `${p.count} x ${money(p.installment)}` : `${p.count-1} x ${money(p.installment)} + última ${money(p.lastInstallment)}`,money(p.total)]);
  if(alternatives.length) {
    if(y+24>269){doc.addPage();continuation();y=32;}
    text('ALTERNATIVAS DE PAGO',left,y,8,NAVY,'bold');
    autoTable(doc,{head:[['Forma de pago','Condición','Importe de las cuotas','Total a pagar']],body:alternatives,startY:y+3,margin:{left,right:left,top:30,bottom:28},theme:'plain',rowPageBreak:'avoid',styles:{font:'helvetica',fontSize:7.5,cellPadding:1.6,textColor:NAVY},headStyles:{fillColor:[232,240,248],fontStyle:'bold'},columnStyles:{0:{cellWidth:25},1:{cellWidth:37},2:{cellWidth:78},3:{cellWidth:38,halign:'right',fontStyle:'bold'}},willDrawPage:data=>{if(data.pageNumber>1)continuation();}});

  }
  const laborPages = doc.getNumberOfPages();
  if(materials?.rows.length) {
    doc.addPage(); continuation('LISTA DE MATERIALES');
    let start=wrapped(`Cliente: ${clean(budget.cliente)}`,left,32,width,10,NAVY,'bold');
    start=wrapped('Estimación del croquis - cantidades para revisar. No incluye precios ni se suma a la mano de obra.',left,start+2,width,8,MUTED)+4;
    const quantity=value=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(value);
    autoTable(doc,{head:[['Material / especificación','Unidad','Calculado','Con reserva']],body:materials.rows.map(r=>[clean(r.description),clean(r.unit),quantity(r.quantity),quantity(r.purchaseQuantity)]),startY:start,margin:{left,right:left,top:30,bottom:20},theme:'plain',rowPageBreak:'avoid',styles:{font:'helvetica',fontSize:8,cellPadding:2,textColor:NAVY,overflow:'linebreak'},headStyles:{fillColor:NAVY,textColor:[255,255,255],fontStyle:'bold'},alternateRowStyles:{fillColor:[247,249,252]},columnStyles:{0:{cellWidth:112},1:{cellWidth:16},2:{cellWidth:25,halign:'right'},3:{cellWidth:25,halign:'right'}},willDrawPage:data=>{if(data.pageNumber>1)continuation('LISTA DE MATERIALES');}});
    y=doc.lastAutoTable.finalY+7;
    for(const warning of materials.warnings){doc.setFontSize(7);const lines=doc.splitTextToSize(clean(warning),width);for(const line of lines){if(y+4>275){doc.addPage();continuation('LISTA DE MATERIALES');y=32;}text(line,left,y,7,MUTED);y+=3;}y+=2;}
  }
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    doc.setPage(page);
    if (alternatives.length && page <= laborPages) text('Contado: descuento sobre el total. Cuotas: recargo sobre el total original. Alternativas no acumulables.',left,275,7,MUTED);
    doc.setDrawColor(218,225,233);doc.setLineWidth(.2);doc.line(left,280,right,280);
    text(example?'EJEMPLO | DATOS FICTICIOS | VALORES ILUSTRATIVOS':page>laborPages?'MATERIALES | ESTIMACIÓN PARA REVISAR':'PRESUPUESTO | MANO DE OBRA',left,286,7,MUTED);
    text(`Página ${page} de ${pages}`,right,286,8,MUTED,'normal',{align:'right'});
  }
  return doc;
}
