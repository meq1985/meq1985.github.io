import { imageBase64 } from '../assets/image';

export async function buildBudgetPdf(budget, profile) {
      const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new jsPDF();
      const rows = [];
      budget.items.forEach((fila) => {
        if (fila.cantidad !== 0) {
          rows.push([fila.codigo, fila.descripcion, fila.cantidad, fila.precioUnitario, fila.precioTotal]);
        }
      });
      autoTable(doc, {
          head: [['Codigo','Descripcion', 'Cantidad', 'Precio Unitario', 'Subtotal']],
          body: rows,
          startY: 55
        });
        const total = budget.total;
        const date = new Date();
        const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const image = imageBase64;
        doc.setFontSize(20);
        doc.addImage(image, 'PNG', 15, 10, 25, 15);
        doc.text(`PRESUPUESTO`, 75, 15)
        doc.setFontSize(10);
        doc.text(`Fecha: ${dateString}`, 150, 15);
        doc.text(`Nombre: ${profile.nombre1} ${profile.apellido1}`, 14, 30);
        doc.text(`Cuit: ${profile.cuit1}`, 14, 35);
        doc.text(`Empresa: ${profile.empresa1}`, 14, 40);
        doc.text(`Matricula: ${profile.matricula1}`, 14, 45);
        doc.text(`Telefono: ${profile.telefono1}`, 14, 50);
        doc.text(`Cliente: ${budget.cliente}`, 150, 30);
        doc.setFontSize(15);
        doc.text(`Total: $${total}`, 160, doc.lastAutoTable.finalY + 10);
        return doc;
    }
