<script>
import { useUserStore } from '../stores/user';
import { onMounted, watch } from 'vue';
import { ref } from "vue";
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";
import {jsPDF} from 'jspdf';
import 'jspdf-autotable';

export default {
  setup() {
    const userStore = useUserStore();
    const costosStore = costoStore();
    const store = PostStore()
    const nombre = ref('')
    const apellido = ref('')
    const cuit = ref('')
    const empresa = ref('')
    const telefono = ref('')
    const direccion = ref('')
    const canalizacionLosa = ref('');
    const canalizacionMamposteria = ref('');
    const canalizacionConstruccionSeca = ref('');
    const cableadoObraNueva = ref('');
    const cableadoRecableado = ref('');
    const conexionSimple = ref('');
    const conexionDoble = ref('');
    const conexionCombinacion = ref('');
    const tableroPrincipal = ref('');
    const tableroSeccional8 = ref('');
    const tableroSeccional36 = ref('');
    const tableroSeccional54 = ref('');
    const acometidaGabinete = ref('');
    const acometidaPat = ref('');
    const acometidaPilar = ref('');
    const documentacionProyecto = ref('');
    const documentacionPlano = ref('');
    const documentacionLista = ref(''); 
    
    const createFila = (propName, descripcion) => {
      const refProp = ref(costosStore[propName]);
      // Observa los cambios en costosStore y actualiza los valores correspondientes en las filas
      watch(() => costosStore[propName], (value) => {
        refProp.value = value;
      });
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
      createFila('documentacionProyecto', 'Documentacion Proyecto x m2'),
      createFila('documentacionPlano', 'Planos x m2'),
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
        const image = "data:image/jpeg;base64,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";
        doc.setFontSize(20);
        doc.addImage(image, 'PNG', 15, 10, 25, 15);
        doc.text(`PRESUPUESTO`, 75, 15)
        doc.setFontSize(10);
        doc.text(`Fecha: ${dateString}`, 150, 15);
        doc.text(`Nombre: ${store.nombre1} ${store.apellido1}`, 14, 30);
        doc.text(`Cuit: ${store.cuit1}`, 14, 35);
        doc.text(`Empresa: ${store.empresa1}`, 14, 40);
        doc.text(`Telefono: ${store.telefono1}`, 14, 45);
        doc.setFontSize(15);
        doc.text(`Total: $${total}`, 160, doc.autoTable.previous.finalY + 10);
        doc.save('presupuesto.pdf');
      }

    const logout = () => {
      userStore.logout();
    };

    onMounted(async () => {
      await store.obtenerDato()
      await costosStore.obtenerCostos(); 
    })

    return {
      nombre,
      apellido,
      cuit,
      empresa,
      telefono,
      direccion,
      canalizacionLosa,
      canalizacionMamposteria,
      canalizacionConstruccionSeca,
      cableadoObraNueva,
      cableadoRecableado,
      conexionSimple,
      conexionDoble,
      conexionCombinacion,
      tableroPrincipal,
      tableroSeccional8,
      tableroSeccional36,
      tableroSeccional54,
      acometidaGabinete,
      acometidaPat,
      acometidaPilar,
      documentacionProyecto,
      documentacionPlano,
      documentacionLista,
      
      filas,
      calcularTotal,
      calcularTotalPorFila,
      agregarFila,
      eliminarFila,
      exportarPDF,
      logout
    }
  }
}
</script>


<template>
  <header class="head">
    <img class="img" src="../assets/logoelec.jpg">
    <h2 class="logo">Dashboard</h2>
    <nav class="navigation">
      <router-link class="config__config" to="/config">Configuracion</router-link>
      <button class="btnLogin-popup" @click.prevent="logout">Logout</button>
    </nav>
  </header>
  <body>
  <div class="configuracion">
    <h2>Presupuesto</h2>
    <table class="table">
      <thead class="tableHead">
        <tr>
          <th class="descripcion">Descripcion</th>
          <th class="cantidad">Cantidad</th>
          <th class="precio">Precio unitario</th>
          <th class="total">Precio total</th>
        </tr>
      </thead>
      
        <tbody class="tableBody">
        <tr v-for="(fila, index) in filas">
          <td class="descripcion"><input class="descripcion_input" v-model="fila.descripcion" /></td>
          <td class="cantidad"><input class="cantidad_input" v-model="fila.cantidad" /></td>
          <td class="precio"><input class="precio_input" v-model="fila.precioUnitario" /></td>
          <td class="total">{{calcularTotalPorFila()[index]}}</td>
        </tr>
      </tbody>
      <tfoot class="tableFoot">
        <tr>
          <td colspan="3">Total:</td>
          <td>{{ calcularTotal() }}</td>
        </tr>
        <tr class="row_btn">
            <button class="btn" @click="agregarFila()">Agregar fila</button>
            <button class="btn" @click="exportarPDF()">Exportar a PDF</button>
        </tr>
      </tfoot>
    </table>
    
  </div>
  </body>
  
</template>

<style scoped>
@import "../styles/navbar.css";

.configuracion {
  margin: 100px auto;
  width: 1400px;
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
  margin: 0px auto 0px auto;
  width: 100%;
}
.table .tableBody{
  width: 100%;
}
.table .tableHead th{
  padding: 15px 20px;
  font-weight: 700;
  text-transform: uppercase;
}
.table .tableFoot {
  font-weight: 700;
  text-transform: uppercase;
  
}
.table .tableFoot td{
  padding: 20px 10px;
  font-size: 18px;
}
.table .tableFoot .row_btn {
  width: 1000px;
  padding: 20px 10px;
  display: flex;
  justify-content:end;
}
.table .tableBody td {
  padding: 10px 20px;
  width: 100%;
}
.descripcion {
  width: 300px;
}
.descripcion_input{
  width: 300px;
  height: 30px;
  font-size: 14px;
}
.cantidad_input{
  width: 200px;
  height: 30px;
  font-size: 14px;
}
.precio_input{
  width: 200px;
  height: 30px;
  font-size: 14px;
}
.total{
  font-size: 18px;
}
.configuracion h2 {
  margin-bottom: 30px;
  color: #fff;
  text-align: center;
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

.btn {
  width: 200px;
  height: 50px;
  background: transparent;
  border: 2px solid white;
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  color: white;
  font-weight: 500;
  margin-left: 10px;
  transition: .5s;
  
}
.btn:hover{
  background: white;
  color:black;
}
</style>
