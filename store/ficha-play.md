# Ficha de Google Play — Monedas

Todo lo que hay que pegar en Play Console. Los límites de caracteres son los que impone Play.

---

## Nombre de la aplicación (máx. 30)

```
Monedas: ahorro para chicos
```

## Descripción breve (máx. 80)

```
Monedas por tareas y tres frascos: ahorro, inversión y gustos. Sin publicidad.
```

## Descripción completa (máx. 4000)

```
Monedas convierte la mesada en algo que los chicos entienden y pueden ver crecer.

CÓMO FUNCIONA

Cada tarea de la casa vale monedas. Poner la mesa, regar las plantas, darle de comer a la mascota: el chico toca la misión cuando la termina y ve su montón de monedas crecer. Ustedes deciden qué misiones existen y cuánto vale cada una.

Al final del mes, las monedas se convierten en pesos y se reparten solas en tres frascos:

• AHORRO — la plata que se guarda para una meta concreta: una bicicleta, una pelota, lo que el chico haya elegido. La app muestra cuánto falta.
• INVERSIÓN — la plata que no se toca. El "Banco de Papá y Mamá" le paga un interés todos los meses, así el chico descubre solo que la plata quieta puede crecer.
• GUSTOS — para gastar en lo que quiera, sin culpa. También es parte de aprender.

PARA VARIOS HIJOS

Cada chico tiene su propio nombre, su dibujito, sus misiones, sus monedas, sus frascos y su meta. Se cambia de uno a otro con un toque.

PANEL DE PAPÁ Y MAMÁ

Protegido con una multiplicación para que los chicos no entren solos. Desde ahí se configura el valor de cada moneda, el porcentaje que va a cada frasco, el interés mensual, las misiones y la meta de ahorro. También se puede corregir a mano cualquier monto.

SIN LETRA CHICA

• No tiene publicidad.
• No tiene compras dentro de la aplicación.
• No pide registro ni cuenta.
• No pide permisos del teléfono.
• No recolecta ningún dato: todo queda guardado dentro del teléfono y nunca sale de ahí.
• Funciona completamente sin internet.

Los montos están en pesos argentinos.
```

---

## Datos de contacto

- **Correo**: villalobosgae@gmail.com
- **Política de privacidad**: https://gaelvillalobos.github.io/monedas-app/privacidad.html

## Categorización

- **Tipo**: Aplicación
- **Categoría**: Educación *(alternativa válida: Estilo de vida)*
- **Etiquetas sugeridas**: educación para niños, finanzas personales, tareas del hogar

---

## Público objetivo y contenido

Esta sección es la más delicada: al declarar que la app apunta a menores, se activa la
**Política de Familias** de Google Play, que es más estricta.

- **Grupos de edad**: marcar los que correspondan desde *6-8* y *9-12*, más *13-15* si querés.
  Al incluir menores de 13, la app queda bajo la Política de Familias.
- **¿La app atrae a niños?**: Sí.
- **Anuncios**: No, la app no muestra anuncios.
- **ID de publicidad**: No se usa. *(Importante: en Play Console hay que declarar que la app
  NO usa el Advertising ID; usarlo con público infantil está prohibido.)*

## Formulario de Seguridad de los datos

Respuestas exactas, coherentes con lo que la app hace:

| Pregunta | Respuesta |
|---|---|
| ¿La app recopila o comparte alguno de los tipos de datos requeridos? | **No** |
| ¿Los datos están cifrados en tránsito? | No aplica (no hay transmisión de datos) |
| ¿Se puede solicitar la eliminación de los datos? | No aplica. Se eliminan desinstalando la app o con la opción «Borrar todo» |

> La información que carga el usuario (nombres, montos, historial) se guarda en el almacenamiento
> local del dispositivo y nunca se transmite. Según la definición de Play, eso **no** cuenta como
> recopilación, porque los datos no salen del dispositivo.

## Cuestionario de clasificación de contenido

Todas las respuestas son **No**: no hay violencia, ni contenido sexual, ni lenguaje inapropiado,
ni sustancias, ni juegos de azar, ni interacción entre usuarios, ni compartir ubicación,
ni compras digitales, ni contenido generado por usuarios.

Resultado esperado: apto para todo público (ESRB *Everyone*, PEGI 3).

> Atención con una pregunta que suele confundir: la app menciona dinero y ahorro, pero **no**
> es un juego de azar ni permite comprar nada. Responder No en todo lo relativo a apuestas y compras.

---

## Materiales gráficos

| Material | Archivo | Requisito de Play |
|---|---|---|
| Ícono | `www/icons/icon-512.png` | 512×512 PNG ✔ |
| Gráfico de funciones | `store/feature-graphic-1024x500.png` | 1024×500 PNG ✔ |
| Capturas de celular | `store/screenshots/` | Mínimo 2, entre 320 y 3840 px por lado |

Las capturas hay que sacarlas del celular con la app instalada. Una captura de un celular moderno
suele ser demasiado alargada para Play; para dejarlas en 1080×1920:

```
powershell -ExecutionPolicy Bypass -File tools\make-store-assets.ps1 -Screenshots "C:\ruta\a\tus\capturas"
```

Sugerencia de qué mostrar, en este orden: la pantalla de Misiones con monedas juntadas,
los tres frascos llenos, la meta de ahorro avanzada, el selector con dos chicos y el panel de padres.
