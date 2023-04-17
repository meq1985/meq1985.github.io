<script setup>
import { useUserStore } from '../stores/user';
import { onMounted, watch } from 'vue';
import { ref } from "vue";
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";
import {jsPDF} from 'jspdf';
import 'jspdf-autotable';

const userStore = useUserStore();
const store = PostStore();
const costosStore = costoStore();

const createFila = (propName, descripcion) => {
  const refProp = ref(costosStore[propName]);
  return {
    descripcion,
    cantidad: 0,
    get precioUnitario() {
      return refProp.value;
    }
  }
}

const filas = ref([
  createFila('canalizacionLosa', 'Canalizacion en Losa'),
  createFila('canalizacionMamposteria', 'Canalizacion en Mamposteria'),
  createFila('canalizacionConstruccionSeca', 'Canalizacion en Construccion Seca'),
  createFila('cableadoObraNueva', 'Cableado Obra Nueva'),
  createFila('cableadoRecableado', 'Recableado'),
  createFila('conexionSimple', 'Conexion Simple'),
  createFila('conexionDoble', 'Conexion Doble'),
  createFila('conexionCombinacion', 'Conexion Combinada'),
  createFila('tableroPrincipal', 'Tablero Principal'),
  createFila('tableroSeccional8', 'Tablero Seccional 8DIM'),
  createFila('tableroSeccional36', 'Tablero Seccional 36DIM'),
  createFila('tableroSeccional54', 'Tablero Seccional 54DIM'),
  createFila('acometidaGabinete', 'Acometida Gabinete'),
  createFila('acometidaPat', 'Acometida PAT'),
  createFila('acometidaPilar', 'Acometida Pilar'),
  createFila('documentacionProyecto', 'Documentacion Proyecto'),
  createFila('documentacionPlano', 'Planos'),
  createFila('documentacionLista', 'Lista de Materiales'),
]);

const calcularTotal = () => {
  let total = 0;
  filas.value.forEach(fila => {
    total += fila.cantidad * fila.precioUnitario;
  });
  return total;
}

const calcularTotalPorFila = () => {
  const totalesPorFila = filas.value.map(fila => fila.cantidad * fila.precioUnitario);
  return totalesPorFila;
}

const agregarFila = () => {
  filas.value.push({ descripcion: '', cantidad: 0, precioUnitario: 0 });
}

const eliminarFila = (index) => {
  filas.value.splice(index, 1);
}

const logout = () => {
  userStore.logout();
};

const exportarPDF = () => {
  const doc = new jsPDF();
  const rows = [];

  filas.value.forEach((fila) => {
    if (fila.cantidad !== 0) {
      rows.push([fila.descripcion, fila.cantidad, fila.precioUnitario, fila.cantidad * fila.precioUnitario]);
    }
  });

  doc.autoTable({
    head: [['Descripcion', 'Cantidad', 'Precio Unitario', 'Subtotal']],
    body: rows,
    startY: 55
  });
  const total = calcularTotal();
  const date = new Date();
  const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const image = "data:image/png;base64,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";
  doc.setFontSize(20);
  doc.addImage(image, 'PNG', 15, 10, 15, 15);
  doc.text(`PRESUPUESTO`, 75, 15)
  doc.setFontSize(10);
  doc.text(`Fecha: ${dateString}`, 150, 15);
  doc.text(`Nombre: ${store.nombre1} ${store.apellido1}`, 14, 30);
  doc.text(`Cuit: ${store.cuit1}`, 14, 35);
  doc.text(`Empresa: ${store.empresa1}`, 14, 40);
  doc.text(`Telefono: ${store.telefono1}`, 14, 45);

  doc.text(`Total: $${total}`, 14, doc.autoTable.previous.finalY + 10);

  doc.save('presupuesto.pdf');
}
</script>


<template>
  <body>
    <header class="head">
    <div class="config__var">
      <button class="config__logout" @click.prevent="logout">Logout</button>    
      <router-link class="config__config" to="/config">Config</router-link
    >
    </div> 
  </header>
  <div class="configuracion">
    <h2>Dash</h2>
    <table class="table">
      <thead class="tableHead">
        <tr>
          <th>Descripcion</th>
          <th>Cantidad</th>
          <th>Precio unitario</th>
          <th>Precio total</th>
        </tr>
      </thead>
      
        <tbody class="tableBody">
        <tr v-for="(fila, index) in filas">
          <td><input class="inputDes" v-model="fila.descripcion" /></td>
          <td><input v-model="fila.cantidad" /></td>
          <td><input v-model="fila.precioUnitario" /></td>
          <td>{{calcularTotalPorFila()[index]}}</td>
          
        </tr>
      </tbody>
      <tfoot class="tableFoot">
        <tr>
          <td colspan="3">Total:</td>
          <td>{{ calcularTotal() }}</td>
          <td>
            <button @click="agregarFila()">Agregar fila</button>
            <button @click="exportarPDF()">Exportar a PDF</button>
          </td>
        </tr>
      </tfoot>
    </table>
    
  </div>
  </body>
  
</template>

<style scoped>
.head {
  width: auto;
  height: 200px;
  margin-bottom: 0px;
  background-image: url(../assets/focos.jpg);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  color: #fff;
  text-align: center;
  clip-path: polygon(100% 0, 100% 100%, 50% 100%, 0 100%, 0 0);
  margin-bottom: 10px;
}
.configuracion {
  margin: 100px auto;
  width: 850px;
  padding: 40px;
  background: #282828;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
}

.table {
  color: #fff;
  text-align: center;
  table-layout: fixed;
  border-collapse: collapse;
}
.table .tableHead th{
  padding: 15px 20px;
  font-weight: 700;
  text-transform: uppercase;
}
.table .tableBody td {
  padding: 10px 20px;
  
}
.table .tableBody .inputDes {
  padding: 1px 30px;
  text-align: center; 
}

.configuracion h2 {
  margin-bottom: 30px;
  color: #fff;
  text-align: center;
}

.configuracion .config__input {
  position: relative;
}

.configuracion .config__input input {
  font-size: 18px;
  width: 100%;
  padding: 10px 0;
  color: #fff;
  margin-bottom: 30px;
  border: none;
  border-bottom: 1px solid #fff;
  outline: none;
  background: transparent;
}
.configuracion .config__input label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: #fff;
  pointer-events: none;
  transition: 0.5s;
}

.configuracion .config__input input:focus ~ label,
.configuracion .config__input input:valid ~ label {
  top: -20px;
  left: 0;
  color: #03e9f4;
  font-size: 12px;
}

.config__btn {
  display:flex;
  justify-content: center;
}

.config__submit {
  color: #1b1c1b;
  padding: 0.7em 1.7em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  margin-right: 2em;
}

.config__var {
  display:flex;
  justify-content:end;
}

.config__logout {
  color: #1b1c1b;
  padding: 0.7em 1.2em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  margin-top: 10px;
}

.config__config {
  color: #1b1c1b;
  padding: 0.7em 1.2em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  margin-top: 10px;
  outline: none;
  text-decoration: none;
}

</style>
