<script>
import { useUserStore } from '../stores/user';
import { onMounted, watch } from 'vue';
import { ref } from "vue";
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";
import {jsPDF} from 'jspdf';
import 'jspdf-autotable';
import { ref as firebaseRef, getStorage, uploadBytes} from "firebase/storage";
import { imageBase64 } from '../assets/image';
import { getAuth } from "firebase/auth";

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
    const codigoLosa = ref('');
    const codigoMamposteria = ref('');
    const codigoConstruccionSeca = ref('');
    const codigoObraNueva = ref('');
    const codigoRecableado = ref('');
    const codigoSimple = ref('');
    const codigoDoble = ref('');
    const codigoCombinacion = ref('');
    const codigoPrincipal = ref('');
    const codigoSeccional8 = ref('');
    const codigoSeccional36 = ref('');
    const codigoSeccional54 = ref('');
    const codigoGabinete = ref('');
    const codigoPat = ref('');
    const codigoPilar = ref('');
    const codigoProyecto = ref('');
    const codigoPlano = ref('');
    const codigoLista = ref('');
    const cliente = ref('');
    costosStore.obtenerCodigos();
  
    const createFila = (propCodigo, propName, descripcion) => {
      const refProp = ref(costosStore[propName]);
      const refProp1 = ref(costosStore[propCodigo]);
      // Observa los cambios en costosStore y actualiza los valores correspondientes en las filas
      watch(() => costosStore[propName], (value) => {
        refProp.value = value;
      });
      
      return {
        get codigo(){
          return refProp1.value;
        },
        descripcion,
        cantidad: 0,
        get precioUnitario() {
          return refProp.value;
        }
      }
    }
    
    const filas = ref([
      createFila('codigoLosa','canalizacionLosa', 'Canalización en Losa'),
      createFila('codigoMamposteria','canalizacionMamposteria', 'Canalización en Mampostería'),
      createFila('codigoConstruccionSeca','canalizacionConstruccionSeca', 'Canalización en Construcción Seca'),
      createFila('codigoObraNueva','cableadoObraNueva', 'Cableado Obra Nueva'),
      createFila('codigoRecableado','cableadoRecableado', 'Recableado'),
      createFila('codigoSimple','conexionSimple', 'Conexión Simple'),
      createFila('codigoDoble','conexionDoble', 'Conexión Doble'),
      createFila('codigoCombinacion','conexionCombinacion', 'Conexión Combinada'),
      createFila('codigoPrincipal','tableroPrincipal', 'Tablero Principal'),
      createFila('codigoSeccional8','tableroSeccional8', 'Tablero Seccional 8DIM'),
      createFila('codigoSeccional36','tableroSeccional36', 'Tablero Seccional 36DIM'),
      createFila('codigoSeccional54','tableroSeccional54', 'Tablero Seccional 54DIM'),
      createFila('codigoGabinete','acometidaGabinete', 'Acometida Gabinete'),
      createFila('codigoPat','acometidaPat', 'Acometida PAT'),
      createFila('codigoPilar','acometidaPilar', 'Acometida Pilar'),
      createFila('codigoProyecto','documentacionProyecto', 'Documentación Proyecto x m2'),
      createFila('codigoPlano','documentacionPlano', 'Planos x m2'),
      createFila('codigoLista','documentacionLista', 'Lista de Materiales'),
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
    let codigo = 700;
    
    const agregarFila = () => {
      filas.value.push({ codigo:codigo+1,descripcion: '', cantidad: 0, precioUnitario: 0 });
      codigo ++ ;
    }
    const eliminarFila = (index) => {
      filas.value.splice(index, 1);
    }

    const exportarPDF = () => {
      const doc = new jsPDF();
      const rows = [];
      filas.value.forEach((fila) => {
        if (fila.cantidad !== 0) {
          rows.push([fila.codigo, fila.descripcion, fila.cantidad, fila.precioUnitario, fila.cantidad * fila.precioUnitario]);
        }
      });
      doc.autoTable({
          head: [['Codigo','Descripcion', 'Cantidad', 'Precio Unitario', 'Subtotal']],
          body: rows,
          startY: 55
        });
        const total = calcularTotal();
        const date = new Date();
        const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const image = imageBase64;
        doc.setFontSize(20);
        doc.addImage(image, 'PNG', 15, 10, 25, 15);
        doc.text(`PRESUPUESTO`, 75, 15)
        doc.setFontSize(10);
        doc.text(`Fecha: ${dateString}`, 150, 15);
        doc.text(`Nombre: ${store.nombre1} ${store.apellido1}`, 14, 30);
        doc.text(`Cuit: ${store.cuit1}`, 14, 35);
        doc.text(`Empresa: ${store.empresa1}`, 14, 40);
        doc.text(`Matricula: ${store.matricula1}`, 14, 45);
        doc.text(`Telefono: ${store.telefono1}`, 14, 50);
        doc.text(`Cliente: ${cliente.value}`, 150, 30);
        doc.setFontSize(15);
        doc.text(`Total: $${total}`, 160, doc.autoTable.previous.finalY + 10);
        doc.save('presupuesto.pdf');
      }

    const guardarPDF = () => {
      const doc = new jsPDF();
      const rows = [];
      filas.value.forEach((fila) => {
        if (fila.cantidad !== 0) {
          rows.push([fila.codigo, fila.descripcion, fila.cantidad, fila.precioUnitario, fila.cantidad * fila.precioUnitario]);
        }
      });
      doc.autoTable({
          head: [['Codigo','Descripcion', 'Cantidad', 'Precio Unitario', 'Subtotal']],
          body: rows,
          startY: 55
        });
        const total = calcularTotal();
        const date = new Date();
        const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const image = imageBase64;
        doc.setFontSize(20);
        doc.addImage(image, 'PNG', 15, 10, 25, 15);
        doc.text(`PRESUPUESTO`, 75, 15)
        doc.setFontSize(10);
        doc.text(`Fecha: ${dateString}`, 150, 15);
        doc.text(`Nombre: ${store.nombre1} ${store.apellido1}`, 14, 30);
        doc.text(`Cuit: ${store.cuit1}`, 14, 35);
        doc.text(`Empresa: ${store.empresa1}`, 14, 40);
        doc.text(`Matricula: ${store.matricula1}`, 14, 45);
        doc.text(`Telefono: ${store.telefono1}`, 14, 50);
        doc.text(`Cliente: ${cliente.value}`, 150, 30);
        doc.setFontSize(15);
        doc.text(`Total: $${total}`, 160, doc.autoTable.previous.finalY + 10);
      
        const pdfFile = doc.output('blob');
        const auth = getAuth();
        const user = auth.currentUser;  
        const id = user.email;
        const fileName = dateString + '-' + cliente.value + '.pdf';
        // Subir el archivo PDF al Storage de Firebase
        const storage = getStorage();
        const storageRef = firebaseRef(storage, 'pdfs/' + id+'/' + fileName);
        uploadBytes(storageRef, pdfFile).then((snapshot) => {
         console.log('Uploaded a blob or file!');
        });
        
      }    
      
    const logout = () => {
      userStore.logout();
    };
    onMounted(async () => {
      await store.obtenerDato()
      await costosStore.obtenerCostos(); 
      await costosStore.obtenerCodigos();
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
      codigoLosa,
      codigoMamposteria,
      codigoConstruccionSeca,
      codigoObraNueva,
      codigoRecableado,
      codigoSimple,
      codigoDoble,
      codigoCombinacion,
      codigoPrincipal,
      codigoSeccional8,
      codigoSeccional36,
      codigoSeccional54,
      codigoGabinete,
      codigoPat,
      codigoPilar,
      codigoProyecto,
      codigoPlano,
      codigoLista,
      filas,
      cliente,
      calcularTotal,
      calcularTotalPorFila,
      agregarFila,
      eliminarFila,
      exportarPDF,
      guardarPDF,
      logout
    }
  }
}
</script>

<template>
  <header class="head">
    <img class="img" src="../assets/logoelec.jpg">
    <h2 class="logo"></h2>
    <nav class="navigation">
      <router-link class="config__config" to="/mispresupuestos">Mis Presupuestos</router-link>
      <router-link class="config__config" to="/config">Configuracion</router-link>
      <button class="btnLogin-popup" @click.prevent="logout">Logout</button>
    </nav>
  </header>
  <body>
  <div class="configuracion">
    <h2>Presupuesto</h2>
    <div class="cliente_input">
      
      <input  v-model="cliente" />
      <label>Cliente:</label>
    </div>
    <table class="table">
      <thead class="tableHead">
        <tr>
          <th class="descripcion">Codigo</th>
          <th class="descripcion">Descripcion</th>
          <th class="cantidad">Cantidad</th>
          <th class="precio">Precio unitario</th>
          <th class="total">Precio total</th>
        </tr>
      </thead>
        <tbody class="tableBody">
        <tr v-for="(fila, index) in filas">
          <td class="codigo"><input class="codigo_input" v-model="fila.codigo" /></td>
          <td class="descripcion"><input class="descripcion_input" v-model="fila.descripcion" /></td>
          <td class="cantidad"><input class="cantidad_input" v-model="fila.cantidad" /></td>
          <td class="precio"><input class="precio_input" v-model="fila.precioUnitario" /></td>
          <td class="total">{{calcularTotalPorFila()[index]}}</td>
        </tr>
      </tbody>
      <tfoot class="tableFoot">
        <tr>
          <td colspan="4">Total:</td>
          <td>{{ calcularTotal() }}</td>
        </tr>
        <tr class="row_btn">
            <button class="btn" @click="agregarFila()">Agregar fila</button>
            <button class="btn" @click="guardarPDF()">Guardar</button>
            <button class="btn" @click="exportarPDF()">Exportar a PDF</button>
        </tr>
        <tr>
          <td></td>
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
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
}

.cliente_input {
  position: relative;
  padding: 20px;
  margin-left: 10px;
}
.cliente_input input {
  font-size: 18px;
  width: 40%;
  padding: 10px 0;
  color: rgb(212, 212, 212);
  margin-bottom: 40px;
  border: none;
  border-bottom: 1px solid rgb(212, 212, 212);
  outline: none;
  background: transparent;
}
.cliente_input label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 20px 20px;
  color: rgb(212, 212, 212);
  pointer-events: none;
  transition: 0.5s;
}
.cliente_input input:focus ~ label,
.cliente_input input:valid ~ label {
  top: -20px;
  left: 0;
  color: rgb(212, 212, 212);
  font-size: 18px;
}
.table {
  color: rgb(212, 212, 212);
  text-align: center;
  table-layout: fixed;
  border-collapse: collapse;
  margin: 0px auto 0px auto;
  width: 100%;
}
.table .tableBody{
  width: 100%;
}
tbody tr:nth-child(odd) {
  background-color: #4a4a4b;
}
tbody tr:nth-child(even) {
  background-color: #282828;
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
.codigo_input{
  width: 200px;
  height: 30px;
  font-size: 14px;
  background: transparent;
  border: none;
  color: rgb(212, 212, 212);
  text-align: center;
}
.descripcion_input{
  width: 300px;
  height: 30px;
  font-size: 14px;
  background: transparent;
  border: none;
  color: rgb(212, 212, 212);
  text-align:justify;
}
.cantidad_input{
  width: 200px;
  height: 30px;
  font-size: 14px;
  background: transparent;
  border: none;
  color: rgb(212, 212, 212);
  text-align: center;
}
.precio_input{
  width: 200px;
  height: 30px;
  font-size: 14px;
  background: transparent;
  border: none;
  color: rgb(212, 212, 212);
  text-align: center;
}
.total{
  font-size: 18px;
}
.configuracion h2 {
  margin-bottom: 30px;
  color: rgb(212, 212, 212);
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
  background: rgb(212, 212, 212);
  border: none;
  cursor: pointer;
  margin-right: 10px;
  margin-top: 10px;
}
.btn {
  width: 200px;
  height: 50px;
  background: transparent;
  border: 2px solid rgb(212, 212, 212);
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  color: rgb(212, 212, 212);
  font-weight: 500;
  margin-left: 10px;
  transition: .5s;
}
.btn:hover{
  background: rgb(212, 212, 212);
  color:black;
}
</style>