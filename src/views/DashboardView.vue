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
import { computed } from 'vue';

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
    const canalizacionEmbutidaPVC = ref('');
    const canalizacionALaVistaPVC = ref('');
    const canalizacionDurlockPvc = ref('');
    const cableadoPvcEmbutido = ref('');
    const cableadoPvcALaVista = ref('');
    const cableadoSubterraneoXmetro = ref('');
    const conexionArtefactoExtractor = ref('');
    const conexionArtefactoCampana = ref('');
    const conexionArtefactoVentilador = ref('');
    const conexionLuminariaAplique = ref('');
    const conexionLuminariaColgante = ref('');
    const conexionLuminariaExterior = ref('');
    const conexionLuminariaLuzEmergencia = ref('');
    const tableroTermomagneticaMonofasico = ref('');
    const tableroTermomagneticaTrifasico = ref('');
    const tableroDiferencialMonofasico = ref('');
    const tableroDiferencialTrifasico = ref('');
    const acometidaMonofasica = ref('');
    const acometidaTrifasica = ref('');
    const acometidaInstalacionMedidorMonofasico = ref('');
    const acometidaInstalacionMedidorTrifasico = ref('');
    const acometidaArmadoPilarMonofasico = ref('');
    const acometidaArmadoPilarTrifasico = ref('');
    const documentacionHasta30Bocas = ref('');
    const documentacionHasta50Bocas = ref('');
    const documentacionHasta100Bocas = ref('');
    const emergenciasDiasHabiles = ref('');
    const emergenciasFindesFeriados = ref('');
    const codigoEmbutidaPVC = ref('');
    const codigoALaVistaPVC = ref('');
    const codigoDurlockPvc = ref('');
    const codigoPvcEmbutido = ref('');
    const codigoPvcALaVista = ref('');
    const codigoSubterraneoXmetro = ref('');
    const codigoArtefactoExtractor = ref('');
    const codigoArtefactoCampana = ref('');
    const codigoArtefactoVentilador = ref('');
    const codigoLuminariaAplique = ref('');
    const codigoLuminariaColgante = ref('');
    const codigoLuminariaExterior = ref('');
    const codigoLuminariaLuzEmergencia = ref('');
    const codigoTermomagneticaMonofasico = ref('');
    const codigoTermomagneticaTrifasico = ref('');
    const codigoDiferencialMonofasico = ref('');
    const codigoDiferencialTrifasico = ref('');
    const codigoMonofasica = ref('');
    const codigoTrifasica = ref('');
    const codigoInstalacionMedidorMonofasico = ref('');
    const codigoInstalacionMedidorTrifasico = ref('');
    const codigoArmadoPilarMonofasico = ref('');
    const codigoArmadoPilarTrifasico = ref('');
    const codigoHasta30Bocas = ref('');
    const codigoHasta50Bocas = ref('');
    const codigoHasta100Bocas = ref('');
    const codigoDiasHabiles = ref('');
    const codigoFindesFeriados = ref('');
    const cliente = ref('');
    costosStore.obtenerCodigos();
    const tabla = ref([]);

    
    const selectedOption = ref('');
    
    const options = [
      'Canalización en Losa',
      'Canalización en Mampostería',
      'Canalización en Construcción Seca',
      'Canalizacion Embutida con PVC',
      'Canalizacion a la Vista con PVC',
      'Canalizacion en Placa de yeso con PVC',
      'Cableado Obra Nueva',
      'Recableado',
      'Cableado Embutido con PVC',
      'Cableado a la Vista con PVC',
      'Cableado Subterraneo por metro',
      'Conexión Simple',
      'Conexión Doble',
      'Conexión Combinada',
      'Colocacion Extractor',
      'Colocacion Campana',
      'Colocacion Ventilador',
      'Luminaria: Aplique',
      'Luminaria: Colgante',
      'Luminaria: Exterior',
      'Luminaria: Luz de Emergencia',
      'Tablero Principal',
      'Tablero Seccional 8DIM',
      'Tablero Seccional 36DIM',
      'Tablero Seccional 54DIM',
      'Termomagnetica Monofasica',
      'Termomagnetica Trifasica',
      'Diferencial Monofasico',
      'Acometida Gabinete',
      'Acometida PAT',
      'Acometida Pilar',
      'Acometida Monofasica',
      'Acometida Trifasica',
      'Instalacion Medidor Monofasico',
      'Instalacion Medidor Trifasico',
      'Armado Pilar Completo Monofasico',
      'Armado Pilar Completo Trifasico',
      'Documentación Proyecto x m2',
      'Planos x m2',
      'Lista de Materiales',
      'Proyecto completo hasta 30 bocas',
      'Proyecto completo hasta 50 bocas',
      'Proyecto completo hasta 100 bocas',
      'Urgencias Dias Habiles',
      'Urgencias Domingos y Feriados'
    ];

    const filteredFilas = computed(() => {
      return filas.value.filter((fila) => {
        return fila.descripcion === selectedOption.value;
      });
    });

    const agregarFilas = (descripcion) => {
      filteredFilas.value.forEach((option) => {
        tabla.value.push({
          codigo: option.codigo,
          descripcion,
          cantidad: 1,
          precioUnitario: option.precioUnitario,
          precioTotal: 0,
        });
      });
    };

    
    const agregarEliminar = (fila) => {
      fila.eliminar = (index) => {
        filas.value.splice(index, 1);
      }; 
    };
    
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
    
    const tablaConPrecioTotal = computed(() => {
      return this.tabla.map((fila) =>{
        return {
          ...fila,
          precioTotal: fila.cantidad * fila.precioUnitario,
        };
      });
    });
    watch(() => tabla.value, (filas) => {
      filas.forEach((fila) => {
        fila.precioTotal = fila.cantidad * fila.precioUnitario;
      });
    }, { deep: true });

    const filas = ref([
      createFila('codigoLosa','canalizacionLosa', 'Canalización en Losa'),
      createFila('codigoMamposteria','canalizacionMamposteria', 'Canalización en Mampostería'),
      createFila('codigoConstruccionSeca','canalizacionConstruccionSeca', 'Canalización en Construcción Seca'),
      createFila('codigoEmbutidaPVC','canalizacionEmbutidaPVC','Canalizacion Embutida con PVC'),
      createFila('codigoALaVistaPVC','canalizacionALaVistaPVC','Canalizacion a la Vista con PVC'),
      createFila('codigoDurlockPvc','canalizacionDurlockPvc','Canalizacion en Placa de yeso con PVC'),
      createFila('codigoObraNueva','cableadoObraNueva', 'Cableado Obra Nueva'),
      createFila('codigoRecableado','cableadoRecableado', 'Recableado'),
      createFila('codigoPvcEmbutido','cableadoPvcEmbutido','Cableado Embutido con PVC'),
      createFila('codigoPvcALaVista','cableadoPvcALaVista','Cableado a la Vista con PVC'),
      createFila('codigoSubterraneoXmetro','cableadoSubterraneoXmetro','Cableado Subterraneo por metro'),
      createFila('codigoSimple','conexionSimple', 'Conexión Simple'),
      createFila('codigoDoble','conexionDoble', 'Conexión Doble'),
      createFila('codigoCombinacion','conexionCombinacion', 'Conexión Combinada'),
      createFila('codigoArtefactoExtractor','conexionArtefactoExtractor','Colocacion Extractor'),
      createFila('codigoArtefactoCampana','conexionArtefactoCampana','Colocacion Campana'),
      createFila('codigoArtefactoVentilador','conexionArtefactoVentilador','Colocacion Ventilador'),
      createFila('codigoLuminariaAplique','conexionLuminariaAplique','Luminaria: Aplique'),
      createFila('codigoLuminariaColgante','conexionLuminariaColgante','Luminaria: Colgante'),
      createFila('codigoLuminariaExterior','conexionLuminariaExterior','Luminaria: Exterior'),
      createFila('codigoLuminariaLuzEmergencia','conexionLuminariaLuzEmergencia','Luminaria: Luz de Emergencia'),
      createFila('codigoPrincipal','tableroPrincipal', 'Tablero Principal'),
      createFila('codigoSeccional8','tableroSeccional8', 'Tablero Seccional 8DIM'),
      createFila('codigoSeccional36','tableroSeccional36', 'Tablero Seccional 36DIM'),
      createFila('codigoSeccional54','tableroSeccional54', 'Tablero Seccional 54DIM'),
      createFila('codigoTermomagneticaMonofasico','tableroTermomagneticaMonofasico','Termomagnetica Monofasica'),
      createFila('codigoTermomagneticaTrifasico','tableroTermomagneticaTrifasico','Termomagnetica Trifasica'),
      createFila('codigoDiferencialMonofasico','tableroDiferencialMonofasico','Diferencial Monofasico'),
      createFila('codigoGabinete','acometidaGabinete', 'Acometida Gabinete'),
      createFila('codigoPat','acometidaPat', 'Acometida PAT'),
      createFila('codigoPilar','acometidaPilar', 'Acometida Pilar'),
      createFila('codigoMonofasica','acometidaMonofasica','Acometida Monofasica'),
      createFila('codigoTrifasica','acometidaTrifasica','Acometida Trifasica'),
      createFila('codigoInstalacionMedidorMonofasico','acometidaInstalacionMedidorMonofasico','Instalacion Medidor Monofasico'),
      createFila('codigoInstalacionMedidorTrifasico','acometidaInstalacionMedidorTrifasico','Instalacion Medidor Trifasico'),
      createFila('codigoArmadoPilarMonofasico','acometidaArmadoPilarMonofasico','Armado Pilar Completo Monofasico'),
      createFila('codigoArmadoPilarTrifasico','acometidaArmadoPilarTrifasico','Armado Pilar Completo Trifasico'),
      createFila('codigoProyecto','documentacionProyecto', 'Documentación Proyecto x m2'),
      createFila('codigoPlano','documentacionPlano', 'Planos x m2'),
      createFila('codigoLista','documentacionLista', 'Lista de Materiales'),
      createFila('codigoHasta30Bocas','documentacionHasta30Bocas','Proyecto completo hasta 30 bocas'),
      createFila('codigoHasta50Bocas','documentacionHasta50Bocas','Proyecto completo hasta 50 bocas'),
      createFila('codigoHasta100Bocas','documentacionHasta100Bocas','Proyecto completo hasta 100 bocas'),
      createFila('codigoDiasHabiles','emergenciasDiasHabiles','Urgencias Dias Habiles'),
      createFila('codigoFindesFeriados','emergenciasFindesFeriados','Urgencias Domingos y Feriados'),
    ]);
 
    const calcularTotal = () => {
      let total = 0;
      tabla.value.forEach(fila => {
        total += fila.cantidad * fila.precioUnitario;
      });
      return total;
    }
    const calcularTotalPorFila = () => {
      const totalesPorFila = tabla.value.map(fila => fila.cantidad * fila.precioUnitario);
      return totalesPorFila;
    }
    let codigo = 700;
    
    
    const agregarFila = () => {
      tabla.value.push({ codigo:codigo+1,descripcion: '', cantidad: 0, precioUnitario: 0 });
      codigo ++ ;
      };
      
    const eliminarFila = (index) => {
      tabla.value.splice(index, 1);
    }

    const exportarPDF = () => {
      const doc = new jsPDF();
      const rows = [];
      tabla.value.forEach((fila) => {
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
      tabla.value.forEach((fila) => {
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
      agregarEliminar,
      tablaConPrecioTotal,
      selectedOption,
      options,
      filteredFilas,
      tabla,
      agregarFilas,
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
      canalizacionEmbutidaPVC,
      canalizacionALaVistaPVC,
      canalizacionDurlockPvc,
      cableadoPvcEmbutido,
      cableadoPvcALaVista,
      cableadoSubterraneoXmetro,
      conexionArtefactoExtractor,
      conexionArtefactoCampana,
      conexionArtefactoVentilador,
      conexionLuminariaAplique,
      conexionLuminariaColgante,
      conexionLuminariaExterior,
      conexionLuminariaLuzEmergencia,
      tableroTermomagneticaMonofasico,
      tableroTermomagneticaTrifasico,
      tableroDiferencialMonofasico,
      tableroDiferencialTrifasico,
      acometidaMonofasica,
      acometidaTrifasica,
      acometidaInstalacionMedidorMonofasico,
      acometidaInstalacionMedidorTrifasico,
      acometidaArmadoPilarMonofasico,
      acometidaArmadoPilarTrifasico,
      documentacionHasta30Bocas,
      documentacionHasta50Bocas,
      documentacionHasta50Bocas,
      documentacionHasta100Bocas,
      emergenciasDiasHabiles,
      emergenciasFindesFeriados,
      codigoEmbutidaPVC,
      codigoALaVistaPVC,
      codigoDurlockPvc,
      codigoPvcEmbutido,
      codigoPvcALaVista,
      codigoSubterraneoXmetro,
      codigoArtefactoExtractor,
      codigoArtefactoCampana,
      codigoArtefactoVentilador,
      codigoLuminariaAplique,
      codigoLuminariaColgante,
      codigoLuminariaExterior,
      codigoLuminariaLuzEmergencia,
      codigoTermomagneticaMonofasico,
      codigoTermomagneticaTrifasico,
      codigoDiferencialMonofasico,
      codigoDiferencialTrifasico,
      codigoMonofasica,
      codigoTrifasica,
      codigoInstalacionMedidorMonofasico,
      codigoInstalacionMedidorTrifasico,
      codigoArmadoPilarMonofasico,
      codigoArmadoPilarTrifasico,
      codigoHasta30Bocas,
      codigoHasta50Bocas,
      codigoHasta100Bocas,
      codigoDiasHabiles,
      codigoFindesFeriados,
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
    <div class="cliente_input">
      <h3>Seleccionar item:</h3>
      <select class="selectOption" v-model="selectedOption" @change="agregarFilas(selectedOption)">
        <option v-for="option in options" :key="option.codigo" :value="option">{{ option }}</option>
      </select>
    </div>
    <div>
      <table class="table">
        <thead class="tableHead">
          <tr>
            <th class="codigo">Código</th>
            <th class="descripcion">Descripción</th>
            <th class="cantidad">Cantidad</th>
            <th class="precio">Precio Unitario</th>
            <th class="total">Precio total</th>
            <th></th>
          </tr>
        </thead>
        <tbody class="tableBody">
          <tr v-for="(fila, index) in tabla" :key="fila.codigo">
            <td class="codigo">{{ fila.codigo }}</td>
            <td class="descripcion"><input class="descripcion_input" v-model="fila.descripcion" /></td>
            <td class="cantidad"><input class="cantidad_input" v-model.number="fila.cantidad"></td>
            <td class="precio"><input class="precio_input" v-model="fila.precioUnitario" /></td>
            <td class="total">{{fila.precioTotal}}</td>
            <td><span class="icon" @click.prevent="() => eliminarFila(index)" ><font-awesome-icon icon="fa-solid fa-trash-can"  /></span></td>  
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
.icon{
  cursor: pointer;
}
.cliente_input {
  position: relative;
  padding: 20px;
  margin-left: 10px;
}
.cliente_input .selectOption{
  width: 400px;
  font-size: 18px;
  
}
.cliente_input h3{
  color: rgb(212, 212, 212);
  font-size: 20px;
  padding: 20px;
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