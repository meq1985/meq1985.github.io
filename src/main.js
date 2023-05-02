import { createApp, markRaw } from 'vue'
import { createPinia } from 'pinia'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faUserSecret,faUser,faEnvelope,faThumbsUp,faUnlockKeyhole,faComments,faCameraRetro,faXmark,faDownload,faShare,faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faFilePdf } from '@fortawesome/free-regular-svg-icons'
/* add icons to the library */
library.add(faUserSecret,faUser,faEnvelope,faThumbsUp,faUnlockKeyhole,faComments,faCameraRetro,faXmark,faDownload,faShare,faWhatsapp,faFilePdf,faTrashCan)

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia();

pinia.use(({ store }) => {
    store.$router = markRaw(router);
});

app.use(pinia)
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
