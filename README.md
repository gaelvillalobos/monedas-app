# Monedas · app para iOS y Android

Educación financiera para chicos: misiones, monedas, frascos de ahorro / inversión / gustos,
meta de ahorro, "Banco de Papá y Mamá" y **varios chicos** en el mismo dispositivo.

El código de la app vive entero en `www/`. Ese mismo `www/` sirve para las dos formas de instalarla:

| | Qué necesitás | Dónde corre |
|---|---|---|
| **PWA** (instalable desde el navegador) | Nada. Solo publicar `www/` en una URL con HTTPS | iPhone y Android |
| **App nativa** (`.apk` / App Store) | Node.js + Android Studio (Android), Mac + Xcode (iOS) | iPhone y Android |

---

## 1. Probarla en la PC

```bash
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

Abrí <http://localhost:5173>. Para cortar, Ctrl+C.

Para abrirla desde el celular estando en la misma red WiFi (PowerShell **como administrador**):

```bash
powershell -ExecutionPolicy Bypass -File tools\serve.ps1 -Lan
```

El script imprime la dirección `http://192.168.x.x:5173` que tenés que poner en el celular.
Ojo: por `http://` la app anda, pero **no** se instala como app ni guarda para usar sin internet.
Para eso hace falta HTTPS → paso 2.

---

## 2. Instalarla en el celular hoy (PWA)

Hace falta una URL con **HTTPS**. Dos caminos:

- **GitHub Pages** (recomendado, y además habilita el APK automático del paso 3).
  Subí el proyecto a un repo y activá Pages con *Source: GitHub Actions*. El workflow
  `.github/workflows/pages.yml` publica `www/` en cada push y te da la URL
  `https://TU-USUARIO.github.io/monedas-app/`.
- **Netlify Drop** — <https://app.netlify.com/drop> — arrastrás la carpeta `www` y listo, sin repo.

Después, en el celular:

- **iPhone (Safari)**: abrí la URL → botón Compartir → *Agregar a inicio*.
- **Android (Chrome)**: abrí la URL → menú ⋮ → *Instalar aplicación* / *Agregar a pantalla principal*.

Queda con ícono propio, a pantalla completa, sin barra del navegador y funcionando sin internet.

> Al publicarla, probá una vez en Chrome o Safari de verdad que el *service worker* quede registrado
> (DevTools → Application → Service Workers). El navegador embebido que usé para probar no los permite.

---

## 3. APK de Android sin instalar nada (GitHub Actions)

Con el proyecto en GitHub, `.github/workflows/android.yml` compila el APK en los servidores
de GitHub: no necesitás Node, ni Java, ni Android Studio en tu PC.

1. Pestaña **Actions** → *Generar APK de Android* → **Run workflow**.
2. Cuando termina (~5 min), abrís la ejecución y bajás el artifact **monedas-apk**.
3. Descomprimís y pasás el `app-debug.apk` al celular. Android va a pedir permiso para
   *instalar apps de orígenes desconocidos*: es normal en un APK que no viene de Play Store.

Ese APK es de **debug**: sirve para uso propio y familiar. Para publicar en Google Play hay que
generar un `.aab` firmado (ver paso 4) y pagar el alta de cuenta de desarrollador (USD 25, una vez).

Para iOS, `.github/workflows/ios.yml` verifica que el proyecto compile en una Mac de GitHub, pero
**no** produce algo instalable: eso necesita cuenta de Apple Developer y certificados de firma.

## 4. App nativa compilada en tu PC

### Lo que hay que instalar primero

- **Node.js LTS** (para las dos) — <https://nodejs.org>
- **Android**: Android Studio + JDK 17 — <https://developer.android.com/studio>
- **iOS**: una **Mac** con Xcode. Desde Windows no se puede compilar iOS.
  Alternativa sin Mac: un servicio de build en la nube (Codemagic, Ionic Appflow, GitHub Actions con runner macOS).

### Pasos

```bash
npm install
npx cap init Monedas ar.com.monedas.app --web-dir www
```

*(el `cap init` solo la primera vez; si ya existe `capacitor.config.json` te lo va a respetar)*

Android:

```bash
npx cap add android
npx cap sync
npx cap open android
```

Se abre Android Studio → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
Para publicar en Google Play generás un **Android App Bundle (.aab)** firmado desde
*Build → Generate Signed Bundle / APK*.

iOS (en la Mac):

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

Se abre Xcode → elegís tu equipo de firma en *Signing & Capabilities* → Run o Archive.

### Íconos y splash nativos

```bash
npm run assets
```

Usa `www/icons/icon-1024.png` como base y genera todos los tamaños de Android e iOS.

### Cada vez que cambies algo de `www/`

```bash
npx cap sync
```

---

## 5. Publicar en Google Play

Costo: **USD 25 por única vez** (alta de cuenta de desarrollador). Sin cuotas anuales.

### 5.1 Cargar la clave de firma en GitHub (una sola vez)

La clave está en `C:\Users\GVILLALOBOS\monedas-claves` — **fuera del repo, nunca se sube**.
Hacele una copia en un lugar seguro: si la perdés no podés publicar actualizaciones sin pedirle
a Google un reseteo de la clave de subida.

En el repo → **Settings → Secrets and variables → Actions → New repository secret**, dos secrets:

| Nombre | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | todo el contenido de `monedas-claves\upload.p12.base64` |
| `ANDROID_KEYSTORE_PASSWORD` | el contenido de `monedas-claves\password.txt` |

### 5.2 Generar el paquete firmado

**Actions → Release para Google Play → Run workflow**, poniendo la versión (`1.0.0` la primera vez).
Deja dos archivos para descargar:

- `monedas-play-aab` → el `.aab` que se sube a Play.
- `monedas-release-apk` → un APK firmado para probar en un celular antes de publicar.

El `versionCode` sale del número de ejecución del workflow, así que sube solo en cada release.
Play rechaza un envío con un `versionCode` repetido.

### 5.3 Crear la app en Play Console

1. Cuenta de desarrollador en <https://play.google.com/console> (USD 25, tarjeta, verificación de identidad).
2. **Crear aplicación**: nombre, idioma español, tipo Aplicación, gratuita.
3. Completar, en **Contenido de la aplicación**, todos los formularios. Las respuestas exactas están
   en [`store/ficha-play.md`](store/ficha-play.md): política de privacidad, acceso a la app, anuncios,
   clasificación de contenido, público objetivo y **seguridad de los datos**.
4. **Ficha de Play Store**: pegar los textos y subir los gráficos, también listados en `store/ficha-play.md`.
5. **Versiones → Producción → Crear versión**: subir el `.aab`.
6. Enviar a revisión. La primera suele tardar varios días; Google además exige **12 testers durante
   14 días** para cuentas personales nuevas antes de habilitar producción.

> Al ser una app para chicos aplica la **Política de Familias** de Google Play. Como no tiene
> publicidad, ni compras, ni recolección de datos, se cumple sin cambios en el código — pero hay
> que declararlo correctamente en los formularios.

## Estructura

```
monedas-app/
├─ .github/workflows/       compilan y publican solos en GitHub
│  ├─ pages.yml             publica www/ en GitHub Pages (la PWA)
│  ├─ android.yml           genera el APK de prueba
│  ├─ release.yml           genera el .aab firmado para Google Play
│  └─ ios.yml               verifica que iOS compile
├─ store/                   materiales de la ficha de Google Play
│  ├─ ficha-play.md         textos y respuestas de los formularios
│  └─ feature-graphic-1024x500.png
├─ www/                      la app (esto es lo único que hay que publicar para la PWA)
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js                 toda la lógica
│  ├─ manifest.webmanifest    nombre, ícono, colores de la app instalada
│  ├─ sw.js                  service worker: funciona sin internet
│  ├─ privacidad.html        política de privacidad (Play la exige)
│  ├─ fonts/                 Fredoka incluida en la app (SIL OFL 1.1)
│  └─ icons/                 PNG generados por tools/make-icons.ps1
├─ tools/
│  ├─ serve.ps1              servidor local para probar (no necesita Node)
│  └─ make-icons.ps1         regenera los íconos
├─ capacitor.config.json     configuración de la app nativa
└─ package.json
```

## Notas

- **Cero conexiones externas**: la app no pide nada a ningún servidor. La tipografía Fredoka está
  incluida en `www/fonts/` (licencia SIL OFL 1.1, ver `fonts/OFL.txt`). Esto es lo que permite
  declarar en Google Play que no se recolecta ni transmite ningún dato.
- **Dónde se guardan los datos**: en el propio dispositivo. En la app nativa usa *Capacitor Preferences*
  (no se borra al limpiar el navegador); en la PWA usa `localStorage`. No hay servidor ni cuenta: los datos
  de un celular no se ven en otro.
- **Varios chicos**: cada chico tiene sus propias monedas, misiones, frascos, meta e historial.
  Se agregan y se editan desde *Papá y Mamá → Chicos*. Al crear uno nuevo, arranca con las misiones y
  los ajustes del chico activo. Los chips de arriba solo aparecen cuando hay más de uno.
- **El candado**: el panel de padres pide una multiplicación. Es para que el chico no entre solo, no es
  seguridad real.
- **Si cambiás archivos de `www/`**: subí el número de `CACHE` en `www/sw.js` (`monedas-v1` → `monedas-v2`),
  si no los celulares que ya la tienen instalada siguen viendo la versión vieja.
- **El `appId`** (`ar.com.monedas.app`) identifica la app en las tiendas. Cambialo antes de publicar si querés otro.
