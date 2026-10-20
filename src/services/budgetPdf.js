const clean = value => value == null ? '' : String(value).trim();
const money = value => '$ ' + new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value);
const NAVY = [32, 48, 68];
const BLUE = [36, 117, 185];
const MUTED = [85, 101, 120];

export async function buildBudgetPdf(budget, profile) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF();
  const left = 16, right = 194, width = right - left;
  const timestamp = new Date(budget.createdAt ?? Date.now());
  if (Number.isNaN(timestamp.getTime())) throw new Error('La fecha del presupuesto no es válida.');
  const issued = timestamp.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  doc.setProperties({ title: `Presupuesto - ${clean(budget.cliente)}`, subject: 'Presupuesto de mano de obra eléctrica', creator: 'Electricidad Domiciliaria' });

  function text(value, x, y, size = 10, color = NAVY, weight = 'normal', options) {
    doc.setFont('helvetica', weight); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(value, x, y, options);
  }
  function wrapped(value, x, y, maxWidth, size = 10, color = NAVY, weight = 'normal') {
    doc.setFont('helvetica', weight); doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, maxWidth);
    text(lines, x, y, size, color, weight);
    return y + lines.length * size * 0.405;
  }
  function continuation() {
    text('PRESUPUESTO', left, 18, 15, NAVY, 'bold');
    text(`Fecha: ${issued}`, right, 18, 9, MUTED, 'normal', { align: 'right' });
    doc.setDrawColor(...BLUE); doc.setLineWidth(.6); doc.line(left, 24, right, 24);
  }

  // A vector mark stays sharp on screen and on paper.
  doc.setFillColor(...BLUE); doc.roundedRect(left, 15, 12, 14, 2, 2, 'F');
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(1);
  doc.line(23, 18, 20, 22); doc.line(20, 22, 24, 22); doc.line(24, 22, 21, 26);
  text('PRESUPUESTO', 33, 22, 22, NAVY, 'bold');
  text('Instalación eléctrica | Mano de obra', 33, 29, 9, MUTED);
  text('FECHA DEL PRESUPUESTO', right, 19, 7, MUTED, 'bold', { align: 'right' });
  text(issued, right, 26, 11, NAVY, 'bold', { align: 'right' });
  doc.setDrawColor(...NAVY); doc.setLineWidth(.7); doc.line(left, 37, right, 37);

  const name = [clean(profile.nombre1), clean(profile.apellido1)].filter(Boolean).join(' ');
  const company = clean(profile.empresa1);
  const identity = [
    ['CUIT', clean(profile.cuit1)], ['Matrícula', clean(profile.matricula1)],
  ].filter(([, value]) => value);
  const contact = [
    ['Teléfono', clean(profile.telefono1)], ['Correo', clean(profile.correo)], ['Dirección', clean(profile.direccion1)],
  ].filter(([, value]) => value);
  // Measure both columns before drawing the background so long names and addresses fit.
  const lineCount = (value, maxWidth, size) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size);
    return doc.splitTextToSize(value, maxWidth).length;
  };
  const titleHeight = lineCount(name || 'Electricista', 88, 14) * 6;
  const companyHeight = company ? lineCount(company, 88, 10) * 4.5 + 2 : 0;
  const identityHeight = identity.reduce((sum, [label, value]) => sum + lineCount(`${label}: ${value}`, 88, 9) * 4 + 2, 0);
  const contactHeight = contact.reduce((sum, [label, value]) => sum + lineCount(`${label}: ${value}`, 65, 9) * 4 + 2, 0);
  const panelHeight = Math.max(31, titleHeight + companyHeight + identityHeight + 18, contactHeight + 20);
  doc.setFillColor(243, 246, 250); doc.roundedRect(left, 44, width, panelHeight, 2, 2, 'F');
  text('PROFESIONAL', left + 6, 52, 7, MUTED, 'bold');
  let identityY = wrapped(name || 'Electricista', left + 6, 60, 88, 14, NAVY, 'bold') + 1;
  if (company) identityY = wrapped(company, left + 6, identityY, 88, 10) + 2;
  for (const [label, value] of identity) identityY = wrapped(`${label}: ${value}`, left + 6, identityY, 88, 9, MUTED) + 2;
  text('CONTACTO', 123, 52, 7, MUTED, 'bold');
  let contactY = 60;
  for (const [label, value] of contact) contactY = wrapped(`${label}: ${value}`, 123, contactY, 65, 9, MUTED) + 2;

  const clientY = 44 + panelHeight + 13;
  text('PREPARADO PARA', left, clientY, 7, MUTED, 'bold');
  const clientEnd = wrapped(clean(budget.cliente), left, clientY + 8, width, 14, NAVY, 'bold');
  const rows = budget.items.filter(item => item.cantidad !== 0).map(item => [
    clean(item.codigo), clean(item.descripcion), `${item.cantidad}${item.unidad ? ' ' + item.unidad : ''}`,
    money(item.precioUnitario), money(item.precioTotal),
  ]);
  autoTable(doc, {
    head: [['Código', 'Detalle', 'Cantidad / unidad', 'Precio unitario', 'Importe']], body: rows,
    startY: clientEnd + 7, margin: { left, right: left, top: 33, bottom: 24 },
    theme: 'plain', showHead: 'everyPage', rowPageBreak: 'avoid',
    styles: { font: 'helvetica', fontSize: 9, textColor: NAVY, cellPadding: 3.5, overflow: 'linebreak', lineColor: [221, 228, 236], lineWidth: { bottom: .2 } },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    columnStyles: { 0: { cellWidth: 19, fontSize: 8, textColor: MUTED }, 1: { cellWidth: 62 },
      2: { cellWidth: 29 }, 3: { cellWidth: 34, halign: 'right' }, 4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' } },
    willDrawPage: data => { if (data.pageNumber > 1) continuation(); },
  });
  let totalY = doc.lastAutoTable.finalY + 10;
  if (totalY + 31 > 273) { doc.addPage(); continuation(); totalY = 36; }
  doc.setFillColor(...NAVY); doc.roundedRect(left, totalY, width, 23, 2, 2, 'F');
  text('TOTAL MANO DE OBRA', left + 6, totalY + 10, 9, [255, 255, 255], 'bold');
  text('Pesos argentinos (ARS)', left + 6, totalY + 17, 8, [201, 218, 234]);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  const totalFontSize = Math.min(20, 20 * 78 / doc.getTextWidth(money(budget.total)));
  text(money(budget.total), right - 6, totalY + 14, totalFontSize, [255, 255, 255], 'bold', { align: 'right' });
  text('Importes correspondientes a mano de obra. Materiales no incluidos.', left, totalY + 30, 8, MUTED);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setDrawColor(218, 225, 233); doc.setLineWidth(.2); doc.line(left, 280, right, 280);
    text('PRESUPUESTO | MANO DE OBRA', left, 286, 7, MUTED);
    text(`Página ${page} de ${pages}`, right, 286, 8, MUTED, 'normal', { align: 'right' });
  }
  return doc;
}
