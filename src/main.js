
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

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useUserStore } from './stores/user';
import { PostStore } from './stores/dbUsers';
import { costoStore } from './stores/dbCostos';
import App from './App.vue'
import router from './router'

// Retire public aliases while keeping Firebase's own Auth handler domain intact.
if (import.meta.env.PROD && ['electricistaxpress.web.app', 'electricistaxpress.firebaseapp.com', 'www.electricistaxpress.com.ar'].includes(window.location.hostname)) {
    window.location.replace('https://electricistaxpress.com.ar' + window.location.pathname + window.location.search + window.location.hash);
}
const app = createApp(App)

const pinia = createPinia();

pinia.use(({ store }) => {
    store.$router = markRaw(router);
});

app.use(pinia)
let previousUid;
onAuthStateChanged(auth, user => {
    if (previousUid !== user?.uid) {
        PostStore(pinia).$reset();
        costoStore(pinia).$reset();
    }
    previousUid = user?.uid;
    useUserStore(pinia).user = user;
    if (!user && router.currentRoute.value.meta.auth) router.replace('/');
});
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
