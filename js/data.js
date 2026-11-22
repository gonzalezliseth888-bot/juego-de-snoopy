/* ═══════════════════════════════════════════════════════════════
   DATA — todo el contenido del pequeño mundo
   Apariencia · recuerdos · trivias · historia · niveles
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SLW = window.SLW = window.SLW || {};

  /* ───────────── Personalización ───────────── */
  SLW.SKIN_TONES = [
    { id: 's1', name: 'Porcelana', color: '#ffe4d1', shade: '#efc6ab' },
    { id: 's2', name: 'Melocotón', color: '#ffd3b0', shade: '#eda980' },
    { id: 's3', name: 'Miel', color: '#e8b183', shade: '#cc9061' },
    { id: 's4', name: 'Canela', color: '#c98755', shade: '#a5663a' },
    { id: 's5', name: 'Cacao', color: '#94603a', shade: '#734428' },
    { id: 's6', name: 'Noche', color: '#5f3a25', shade: '#452918' }
  ];

  SLW.HAIR_COLORS = [
    { id: 'h1', name: 'Castaño', color: '#4a3123', light: '#6d4b33' },
    { id: 'h2', name: 'Negro', color: '#251f2e', light: '#3d3549' },
    { id: 'h3', name: 'Rubio', color: '#e7b95e', light: '#f6d78d' },
    { id: 'h4', name: 'Cobre', color: '#b75c32', light: '#d87b4a' },
    { id: 'h5', name: 'Rosa', color: '#e983a3', light: '#f5a9c4' },
    { id: 'h6', name: 'Azul', color: '#5877c9', light: '#7b9bea' },
    { id: 'h7', name: 'Verde', color: '#4d8f6d', light: '#70b491' },
    { id: 'h8', name: 'Blanco', color: '#e8e4f0', light: '#f7f4fb' }
  ];

  SLW.HAIRS = [
    { id: 'short', name: 'Corto' },
    { id: 'bob', name: 'Bob' },
    { id: 'long', name: 'Largo' },
    { id: 'pony', name: 'Coleta' },
    { id: 'curly', name: 'Rizos' },
    { id: 'buns', name: 'Moñitos' }
  ];

  SLW.EYE_COLORS = [
    { id: 'e1', name: 'Ámbar', color: '#9a5c22' },
    { id: 'e2', name: 'Castaño', color: '#4f3220' },
    { id: 'e3', name: 'Avellana', color: '#7d8f3c' },
    { id: 'e4', name: 'Esmeralda', color: '#2f8066' },
    { id: 'e5', name: 'Océano', color: '#2f6ea8' },
    { id: 'e6', name: 'Violeta', color: '#6d4fae' }
  ];

  SLW.TOPS = [
    { id: 'tee', name: 'Camiseta', color: '#ff8a75', color2: '#ffe4d2', trim: '#ff6e56' },
    { id: 'stripes', name: 'Rayas', color: '#7bb8e8', color2: '#fff8ea', trim: '#5b9bd0' },
    { id: 'hoodie', name: 'Sudadera', color: '#a99bf0', color2: '#8b78e6', trim: '#8b78e6' },
    { id: 'jacket', name: 'Chaqueta', color: '#3f7d6b', color2: '#fff8ea', trim: '#2c5f50' },
    { id: 'sweater', name: 'Jersey', color: '#f2c35b', color2: '#e6ab35', trim: '#d99a23' },
    { id: 'blouse', name: 'Camisa', color: '#fff6ea', color2: '#ff9eb5', trim: '#e6c9b0' }
  ];

  SLW.BOTTOMS = [
    { id: 'jeans', name: 'Vaqueros', color: '#4c6fa8', color2: '#3d5a8c', trim: '#ffd166' },
    { id: 'shorts', name: 'Pantalón corto', color: '#c98647', color2: '#a96b36', trim: '#e8c79a' },
    { id: 'skirt', name: 'Falda', color: '#e57b9c', color2: '#c75c7d', trim: '#f4b7c8' },
    { id: 'leggings', name: 'Leggings', color: '#3f7a7a', color2: '#2f5d5d', trim: '#6fb2ad' },
    { id: 'cargo', name: 'Cargo', color: '#7a8658', color2: '#616a45', trim: '#a3ad80' }
  ];

  SLW.SHOES = [
    { id: 'sneakers', name: 'Zapatillas', color: '#f7f3ea', color2: '#d7d0c2', accent: '#ff8a75' },
    { id: 'boots', name: 'Botas', color: '#8a5a3b', color2: '#6b442c', accent: '#3f2b1d' },
    { id: 'mary', name: 'Merceditas', color: '#d64f5e', color2: '#b83a48', accent: '#f5d489' },
    { id: 'rain', name: 'Botas de lluvia', color: '#ffcf4d', color2: '#e6ad1f', accent: '#fff8ea' },
    { id: 'sandals', name: 'Sandalias', color: '#c98755', color2: '#a96b3c', accent: '#fff8ea' }
  ];

  SLW.ACCESSORIES = [
    { id: 'none', name: 'Sin extras' },
    { id: 'bow', name: 'Lazo' },
    { id: 'cap', name: 'Gorra' },
    { id: 'glasses', name: 'Gafas' },
    { id: 'beanie', name: 'Gorro' },
    { id: 'flowers', name: 'Flores' },
    { id: 'headphones', name: 'Auriculares' }
  ];

  SLW.CREATOR_CATEGORIES = [
    { id: 'skin', label: 'Piel', color: '#e8b183', title: 'Tono de piel', sub: 'Elige el tono que más te represente.' },
    { id: 'hairColor', label: 'Cabello', color: '#e7b95e', title: 'Color de cabello', sub: 'Un color para cada aventura.' },
    { id: 'hair', label: 'Peinado', color: '#4a3123', title: 'Peinado', sub: 'Peinados cómodos para saltar entre mundos.' },
    { id: 'eyes', label: 'Ojos', color: '#2f8066', title: 'Color de ojos', sub: 'Los ojos con los que verás los sueños.' },
    { id: 'top', label: 'Arriba', color: '#ff8a75', title: 'Ropa superior', sub: 'Tu look para recorrer el pequeño mundo.' },
    { id: 'bottom', label: 'Abajo', color: '#4c6fa8', title: 'Pantalones o falda', sub: 'Cómodos para correr, saltar y rebotar.' },
    { id: 'shoes', label: 'Calzado', color: '#d64f5e', title: 'Calzado', sub: 'Unos pasos con personalidad.' },
    { id: 'accessory', label: 'Extras', color: '#a99bf0', title: 'Accesorios', sub: 'El detalle que lo cambia todo.' }
  ];

  SLW.DEFAULT_APPEARANCE = {
    skin: 's3', hairColor: 'h1', hair: 'bob', eyes: 'e2',
    top: 'tee', bottom: 'jeans', shoes: 'sneakers', accessory: 'none'
  };

  SLW.DEFAULT_NAME = 'Explorador';

  /* ───────────── Recuerdos coleccionables ───────────── */
  SLW.ITEMS = [
    {
      id: 'luckybone', name: 'Hueso de la Suerte', art: 'bone', tint: '#ffd15c',
      desc: 'El primero de muchos. Dicen que quien lo encuentra nunca pierde el camino de vuelta a casa.',
      hint: 'Al final de la pradera, brillando entre las flores.'
    },
    {
      id: 'collar', name: 'Collar Rojo', art: 'collar', tint: '#ff5d78',
      desc: 'El collar de Snoopy. Todavía huele a hierba fresca, a tardes de sol y a alguna travesura.',
      hint: 'En lo alto de las colinas de Woodstock.'
    },
    {
      id: 'kite', name: 'Cometa de Charlie Brown', art: 'kite', tint: '#ff8a5c',
      desc: 'Siempre termina atrapada en un árbol. Charlie Brown asegura que esta vez sí volará.',
      hint: 'En la torre de libros más alta de la biblioteca.'
    },
    {
      id: 'piano', name: 'Piano de Schroeder', art: 'piano', tint: '#ffd166',
      desc: 'Tres teclas de juguete y un corazón de concierto. Beethoven aprobaría, con una pequeña sonrisa.',
      hint: 'Escondido en un rincón del jardín de las respuestas.'
    },
    {
      id: 'blanket', name: 'Manta de Linus', art: 'blanket', tint: '#7bb8e8',
      desc: 'Suave como una promesa. Linus no sale de casa sin ella, ni siquiera para esperar al Gran Calabaza.',
      hint: 'Sobre una nube de páginas, muy alto.'
    },
    {
      id: 'gloves', name: 'Guantes de Boxeo', art: 'gloves', tint: '#ff6b6b',
      desc: 'Para los combates imaginarios contra el Barón Rojo. Pesan mucho menos de lo que parecen.',
      hint: 'En un pedestal de la arena, antes de la primera nube.'
    },
    {
      id: 'badge', name: 'Insignia del As Volador', art: 'badge', tint: '#ffc94d',
      desc: 'Una insignia de hojalata con forma de avión. Snoopy la luce con el orgullo de mil cielos.',
      hint: 'En los aires del mundo de los combates.'
    },
    {
      id: 'sunglasses', name: 'Gafas de Joe Cool', art: 'sunglasses', tint: '#5b5ad7',
      desc: 'Gafas de sol, chaqueta de cuero y cero preocupaciones. Joe Cool nunca se quita el estilo.',
      hint: 'Cerca del gran felino, escondidas tras una nube.'
    },
    {
      id: 'letter', name: 'Carta de Amor', art: 'letter', tint: '#ff8fb1',
      desc: 'Una carta escrita con letra de perro y dibujos de corazones. Nunca llegó a enviarse... hasta hoy.',
      hint: 'Bajo un puente de lianas, en una pequeña gruta.'
    },
    {
      id: 'doghouse', name: 'Casita de Snoopy', art: 'doghouse', tint: '#e9554f',
      desc: 'Un modelo en miniatura de su casita roja. En el tejado cabe entero un sueño.',
      hint: 'En lo alto de las ruinas del bosque.'
    },
    {
      id: 'pumpkin', name: 'El Gran Calabaza', art: 'pumpkin', tint: '#ff9e3d',
      desc: 'Una calabaza dorada que Linus esperó cada Halloween. Brilla incluso de día.',
      hint: 'En una cueva secreta bajo las ruinas.'
    },
    {
      id: 'dinner', name: 'Cena de Acción de Gracias', art: 'dinner', tint: '#cf9a5e',
      desc: 'Un platito de juguete con la cena favorita de Snoopy. Nadie sabe cómo sigue caliente.',
      hint: 'Detrás de la cascada dorada.'
    }
  ];
  SLW.ITEM_MAP = {};
  SLW.ITEMS.forEach(it => { SLW.ITEM_MAP[it.id] = it; });

  /* ───────────── Trivia ───────────── */
  SLW.QUIZ_MASTER = { name: 'El Búho de los Porqués', portrait: 'owl', chip: 'guardián' };
  SLW.QUESTIONS = {
    q_owner: { q: '¿Quién es el dueño de Snoopy?', options: ['Charlie Brown', 'Linus van Pelt', 'Schroeder', 'Pig-Pen'], correct: 0, fact: 'Charlie Brown y Snoopy son amigos desde el primer día.' },
    q_friend: { q: '¿Quién es el mejor amigo y compañero de aventuras de Snoopy?', options: ['Linus', 'Woodstock', 'Lucy', 'Sally'], correct: 1, fact: 'Woodstock es un pajarito amarillo, el mejor amigo de Snoopy.' },
    q_collar: { q: '¿De qué color es el collar de Snoopy?', options: ['Azul', 'Verde', 'Rojo', 'Amarillo'], correct: 2, fact: 'Un collar rojo, como una pequeña sonrisa que lleva siempre puesta.' },
    q_breed: { q: '¿Qué raza de perro es Snoopy?', options: ['Beagle', 'Golden retriever', 'Labrador', 'Dálmata'], correct: 0, fact: 'Snoopy es un beagle de imaginación infinita.' },
    q_piano: { q: '¿Quién toca un piano de juguete?', options: ['Schroeder', 'Charlie Brown', 'Linus', 'Peppermint Patty'], correct: 0, fact: 'Schroeder toca a Beethoven con un piano diminuto y un corazón enorme.' },
    q_blanket: { q: '¿Quién lleva siempre una manta azul?', options: ['Lucy', 'Sally', 'Linus', 'Schroeder'], correct: 2, fact: 'La manta de Linus es su escudo favorito contra el mundo.' },
    q_pumpkin: { q: '¿Qué espera Linus cada Halloween?', options: ['A Snoopy', 'El Gran Calabaza', 'Un cometa', 'La primera nieve'], correct: 1, fact: 'Linus espera al Gran Calabaza con una fe inquebrantable.' },
    q_sister: { q: '¿Cómo se llama la hermana pequeña de Charlie Brown?', options: ['Sally', 'Lucy', 'Marcie', 'Patty'], correct: 0, fact: 'Sally es la pequeña soñadora del grupo.' },
    q_booth: { q: '¿Quién da consejos desde un puesto por 5 centavos?', options: ['Linus', 'Lucy', 'Schroeder', 'Woodstock'], correct: 1, fact: 'La consulta psiquiátrica de Lucy es famosa en todo el vecindario.' },
    q_ace: { q: '¿En qué se convierte Snoopy cuando vuela sobre su casita?', options: ['El As Volador', 'Joe Cool', 'El Gran Calabaza', 'El Barón Rojo'], correct: 0, fact: 'El As Volador surca los cielos con su bufanda al viento.' },
    q_cool: { q: '¿Qué nombre usa Snoopy cuando se pone gafas de sol?', options: ['Joe Cool', 'John Cool', 'Snoopy Star', 'El Rey Beagle'], correct: 0, fact: 'Joe Cool camina despacio, con las manos en los bolsillos y el mundo en pausa.' },
    q_sport: { q: '¿Qué deporte nunca le sale bien a Charlie Brown?', options: ['Béisbol', 'Fútbol', 'Tenis', 'Natación'], correct: 0, fact: 'El béisbol le rompe el corazón a Charlie Brown cada temporada.' },
    q_novel: { q: '¿Qué le gusta escribir a Snoopy en el tejado de su casita?', options: ['Novelas', 'Cartas de amor', 'Listas de compras', 'Poemas'], correct: 0, fact: 'Snoopy escribe novelas con una máquina de escribir invisible y mucho estilo.' },
    q_roof: { q: '¿Dónde duerme Snoopy?', options: ['Dentro de la casita', 'En el tejado', 'En el sofá de Charlie', 'En un árbol'], correct: 1, fact: 'El tejado de su casita es su lugar favorito del universo.' }
  };

  /* ───────────── Mundos ───────────── */
  SLW.WORLDS = [
    {
      id: 1, name: 'El comienzo', official: 'El mundo 1 · El comienzo', theme: 'meadow',
      color: '#69c477', dark: '#2e6b43', ink: '#245f3f',
      desc: 'La pradera donde todo empieza: los primeros saltos, los primeros huesitos y una amistad que canta.',
      levels: ['1-1', '1-2']
    },
    {
      id: 2, name: 'Las preguntas', official: 'El mundo 2 · Las preguntas', theme: 'library',
      color: '#9b85ec', dark: '#5a4499', ink: '#4c3a86',
      desc: 'Una biblioteca flotante donde las preguntas crecen como flores y el Búho guarda respuestas con forma de recuerdo.',
      levels: ['2-1', '2-2']
    },
    {
      id: 3, name: 'Los combates', official: 'El mundo 3 · Los combates', theme: 'arena',
      color: '#ff7a5c', dark: '#9f3524', ink: '#8a3223',
      desc: 'La arena del Barón Rojo: nubes gruñonas, robots de hojalata y un gato que no deja pasar a cualquiera.',
      levels: ['3-1', '3-2']
    },
    {
      id: 4, name: 'Los tesoros', official: 'El mundo 4 · Exploración y tesoros', theme: 'jungle',
      color: '#45bda0', dark: '#1f7261', ink: '#186453',
      desc: 'Un jardín de ruinas escondidas, cascadas doradas y recuerdos que llevan años esperando ser encontrados.',
      levels: ['4-1', '4-2']
    }
  ];

  /* ───────────── Personajes y diálogos ───────────── */
  SLW.DIALOGUES = {
    intro11: [
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: '¿Viste a Snoopy? Se quedó dormido leyendo su atlas de los sueños... y cuando desperté, su casita estaba vacía.' },
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: 'Woodstock dice que lo vio saltar dentro del libro. Dice que ahí adentro hay cuatro mundos, y que él se fue a buscar algo.' },
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: 'El portal solo se abre para amigos de verdad. Por eso te llamamos, {name}. ¿Nos ayudas a traerlo de vuelta?' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Voy a encontrarlo. Te lo prometo.' },
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: 'Gracias. Sigue el camino de huesitos. Y no te preocupes por Woodstock... él sabe cuidarse. Más o menos.' }
    ],
    intro12: [
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Las colinas de Woodstock huelen a hierba recién cortada y a canciones que todavía nadie ha escrito.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío! (¡Por aquí! ¡El primer recuerdo está cerca!)' },
      { name: '{name}', who: 'player', chip: 'explorador', text: '¿Crees que Snoopy dejó algo aquí?' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío! (Su collar rojo. Lo perdió la tarde que decidió ser el As Volador por primera vez.)' }
    ],
    intro21: [
      { name: 'Linus', who: 'linus', chip: 'filósofo', text: 'Bienvenido a la Biblioteca de los Porqués. Aquí las preguntas crecen entre los libros, como flores.' },
      { name: 'Linus', who: 'linus', chip: 'filósofo', text: 'Quien conoce bien a sus amigos puede encontrar caminos que otros no ven. Y a veces, un recuerdo escondido.' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Entonces tendré que recordar todo lo que sé sobre Snoopy.' },
      { name: 'Linus', who: 'linus', chip: 'filósofo', text: 'Con una sonrisa. Eso también ayuda muchísimo.' }
    ],
    intro22: [
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'En el Jardín de las Respuestas, las páginas flotan como pétalos y el Búho escucha cada paso con mucha atención.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío! (Aquí hay más preguntas... y un piano que suena solo. Bueno, casi solo.)' },
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'En algún lugar entre las flores, dos recuerdos esperan a que alguien sepa mirar.' }
    ],
    intro31: [
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío! (Cuidado: el cielo está lleno de nubes gruñonas.)' },
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'A lo lejos, una silueta con gafas de piloto cruza el atardecer. El Barón Rojo ha llenado la arena de robots de hojalata.' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Tú a mi lado, yo delante. Vamos a abrir camino.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío! (Mi picotazo no es infinito, pero es valiente. Y tengo dos plumas curativas por nivel. ¡Úsalas con cabeza!)' }
    ],
    intro32: [
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Sobre el mar de nubes, la arena del As Volador flota entre relámpagos suaves y banderas rojas.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío! (Huelo a gato grande. De los que no son muy amables.)' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Entonces iremos con cuidado. Y con un picotazo listo.' }
    ],
    intro41: [
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: 'Este es el Jardín de los Recuerdos. Snoopy entierra aquí las cosas que no quiere perder. Nunca me deja mirar.' },
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: 'Si ves algo que brilla, quizá sea un recuerdo suyo. Woodstock tiene buen olfato: pulsa Q y él te avisará.' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Gracias, Charlie. Si lo veo, le diré que lo extrañas.' },
      { name: 'Charlie Brown', who: 'charlie', chip: 'amigo', text: 'No hace falta. Seguro que ya lo sabe. Pero... gracias por decírmelo.' }
    ],
    intro42: [
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Las Ruinas Doradas guardan el último tramo del mapa. Una cascada de luz cae sobre los tesoros que faltan.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío! (La puerta del Gran Encuentro ya se ve desde aquí. Después de esto... lo encontraremos.)' }
    ],
    intro51: [
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Al final del camino de huesitos, más allá de los cuatro mundos, el cielo se vuelve suave como una manta.' },
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Una casita roja flota entre las estrellas. Y sobre el tejado, una silueta blanca espera con las orejas al viento.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío... pío! (Es él. Es él de verdad.)' }
    ],
    woodstockJoin: [
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío! (¡Espera! ¡Espera!)' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío! (Snoopy habló de cuatro mundos: una pradera, una biblioteca, una arena y un jardín. Dijo que sus recuerdos abrirían el camino.)' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Entonces los reuniremos. Tú y yo.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío! (¡Woodstock al rescate!)' },
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Woodstock se posa suavemente sobre tu hombro. Desde ahora, no estarás solo.' }
    ],
    finale: [
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Snoopy no dice nada. Salta del tejado, te mira de arriba abajo... y su cola empieza a moverse como una bandera al viento.' },
      { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', text: '¡Pío-pío-pío! (¡Te encontré! ¡Te encontré!)' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Hola, Snoopy. Te buscamos por cuatro mundos. Hubo preguntas, robots... y un gato que no era muy amable.' },
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Snoopy da tres golpecitos con la pata sobre su casita. Luego empieza a bailar.' },
      { name: '{name}', who: 'player', chip: 'explorador', text: 'Creo que eso significa gracias.' },
      { name: 'Narrador', who: 'narrator', chip: 'historia', text: 'Sobre el tejado aparece una carta. Es la última página de este pequeño mundo... y está escrita para ti.' }
    ]
  };

  SLW.NPCS = {
    woodstock: { name: 'Woodstock', who: 'woodstock', chip: 'pajarito', dialogue: 'woodstockJoin', action: 'join' },
    schroeder: {
      name: 'Schroeder', who: 'schroeder', chip: 'pianista',
      pages: [
        { text: 'Un piano de juguete, pero con el corazón de una sala de conciertos. Beethoven estaría orgulloso.' },
        { text: '¿Sabías que las preguntas del Búho siempre tienen algo de música? Escucha bien antes de responder.' }
      ]
    },
    linus: {
      name: 'Linus', who: 'linus', chip: 'filósofo',
      pages: [
        { text: 'Cuando el mundo se pone ruidoso, yo me escondo en mi manta. Y cuando Snoopy se pierde, él se esconde en sus sueños.' },
        { text: 'El Gran Calabaza llegará algún día. Estoy casi seguro. Casi.' }
      ]
    },
    lucy: {
      name: 'Lucy', who: 'lucy', chip: 'psiquiatra',
      pages: [
        { text: 'Consulta psiquiátrica: 5 centavos. Para ti, gratis, porque vas camino de encontrar a un perro perdido.' },
        { text: 'Mi consejo: responde con el corazón. Y no dejes que ninguna nube te quite el sombrero.' }
      ]
    },
    charlie: {
      name: 'Charlie Brown', who: 'charlie', chip: 'amigo',
      pages: [
        { text: 'Ese árbol se comió mi cometa. Otra vez. Creo que ya lo hace por costumbre.' },
        { text: 'Si encuentras a Snoopy, dile que su cena está en el plato. Y que... bueno, que su casa lo extraña.' }
      ]
    },
    snoopy: { name: 'Snoopy', who: 'snoopy', chip: 'el soñador', dialogue: 'finale', action: 'ending' }
  };

  SLW.SIGNS = {
    move: { title: 'Para moverte', lines: ['Usa ← → o A D para caminar por el Pequeño Mundo.', 'Toca suavemente: no hay prisa por llegar.'] },
    jump: { title: 'Para saltar', lines: ['Pulsa ESPACIO, ↑ o W.', 'Mantén pulsado para saltar un poco más alto. ¡Los huesitos suelen estar arriba!'] },
    run: { title: 'Para correr', lines: ['Mantén SHIFT mientras caminas.', 'Woodstock dice que correr hace que el viento cante.'] },
    interact: { title: 'Para interactuar', lines: ['Acércate a lo que brilla o habla y pulsa E.', 'A veces los objetos y los amigos tienen algo importante que contar.'] },
    companion: { title: 'El Sentido de Woodstock', lines: ['Pulsa Q para que Woodstock use su Sentido.', 'Durante unos segundos, brillará junto a los tesoros escondidos cercanos. Luego necesitará descansar.'] },
    combat: { title: 'Cómo combatir', lines: ['Pulsa ESPACIO cuando la marca cruce la zona dorada de la barra.', 'PERFECTO hace 3 de daño; BIEN, 2; FLOJO, 1.', 'Woodstock ataca cada 3 golpes. Pulsa H para que use una pluma curativa (2 por nivel).'] },
    goal: { title: 'La puerta del recuerdo', lines: ['Pulsa E frente a la puerta para cerrar este capítulo.', 'Cada nivel completado abre un poco más el camino hacia Snoopy.'] },
    secret: { title: 'Un lugarcito secreto', lines: ['Los recuerdos importantes no siempre están en el camino principal.', 'Si Woodstock se emociona, quizá haya algo escondido cerca.'] }
  };

  /* ───────────── Niveles ───────────── */
  const G = (x, w, y = 600, kind = 'ground') => ({ x, y, w, h: 240, kind });
  const P = (x, y, w, kind = 'ledge') => ({ x, y, w, h: 16, kind, oneway: true });
  const B = (x, y, w, h, kind = 'block') => ({ x, y, w, h, kind });
  const trail = (x, y, n, dx = 42, dy = 0) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: x + i * dx, y: y + i * dy });
    return out;
  };
  const arc = (x, y, n, dx = 42, h = 44) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      out.push({ x: x + i * dx, y: Math.round(y - Math.sin(t * Math.PI) * h) });
    }
    return out;
  };
  const sign = (x, def) => ({ x, y: 600, def });
  const quiz = (id, x, y = 600, qid) => ({ x, y, stationId: id, qid });

  SLW.LEVELS = {

    '1-1': {
      id: '1-1', world: 1, index: 1, theme: 'meadow',
      name: 'La pradera de los sueños',
      tagline: 'Donde todo empieza.',
      length: 4400, spawn: { x: 120, y: 470 },
      intro: 'intro11',
      tip: '← → moverse · Espacio saltar',
      platforms: [
        G(0, 880), G(1000, 680), G(1810, 760), G(2720, 880), G(3730, 670),
        B(560, 552, 90, 48, 'block'),
        P(620, 520, 130), P(940, 496, 120),
        P(1440, 500, 120), P(1600, 452, 100),
        P(1720, 486, 90),
        P(2250, 498, 130), P(2460, 440, 120),
        P(2900, 490, 120), P(3140, 520, 140),
        P(3390, 476, 130)
      ],
      bones: [
        ...trail(220, 552, 5, 40),
        ...arc(880, 540, 5, 34, 46),
        ...trail(1030, 552, 4, 42),
        ...trail(650, 472, 3, 38),
        ...trail(1470, 452, 3, 38),
        ...trail(1650, 404, 2, 38),
        ...arc(1680, 540, 5, 34, 48),
        ...trail(1850, 552, 4, 42),
        ...trail(2280, 450, 3, 38),
        ...trail(2490, 392, 3, 36),
        ...trail(2600, 540, 3, 40),
        ...arc(2570, 540, 5, 34, 46),
        ...trail(2940, 442, 2, 38),
        ...trail(3170, 472, 3, 38),
        ...trail(3420, 428, 2, 38),
        ...trail(3760, 552, 5, 40),
        ...trail(4000, 552, 4, 40)
      ],
      signs: [sign(300, 'move'), sign(760, 'jump'), sign(1180, 'run'), sign(1930, 'interact'), sign(3010, 'goal')],
      npcs: [{ type: 'woodstock', x: 1500, y: 452 }],
      checkpoints: [{ x: 2380, y: 600 }],
      items: [{ id: 'luckybone', x: 3900, y: 600 }],
      goal: { x: 4200, y: 600 },
      quiz: [
        { text: 'Woodstock se une a ti en esta pradera.' }
      ]
    },

    '1-2': {
      id: '1-2', world: 1, index: 2, theme: 'hills',
      name: 'Las colinas de Woodstock',
      tagline: 'Canciones entre la hierba.',
      length: 4500, spawn: { x: 110, y: 470 },
      intro: 'intro12',
      tip: 'Mantén SHIFT para correr',
      platforms: [
        G(0, 900), G(1040, 870), G(2050, 860), G(3050, 700), G(3820, 680),
        P(640, 500, 120), P(820, 432, 110),
        P(1230, 500, 130), P(1450, 430, 130), P(1690, 500, 130),
        P(2290, 500, 110), P(2470, 428, 120), P(2660, 500, 120),
        P(3150, 500, 130), P(3340, 424, 120), P(3530, 348, 140),
        B(3950, 548, 80, 52, 'block'),
        P(4100, 492, 110)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(670, 452, 3, 38),
        ...trail(850, 384, 2, 36),
        ...arc(920, 540, 5, 34, 46),
        ...trail(1080, 552, 5, 42),
        ...trail(1270, 452, 3, 38),
        ...trail(1490, 382, 3, 38),
        ...trail(1730, 452, 3, 38),
        ...arc(1920, 540, 5, 34, 44),
        ...trail(2090, 552, 4, 42),
        ...trail(2330, 452, 2, 38),
        ...trail(2510, 380, 3, 38),
        ...trail(2700, 452, 2, 38),
        ...arc(2920, 540, 5, 34, 46),
        ...trail(3090, 552, 4, 42),
        ...trail(3190, 452, 3, 38),
        ...trail(3380, 376, 3, 38),
        ...trail(3570, 300, 3, 38),
        ...arc(3700, 540, 5, 34, 42),
        ...trail(3860, 552, 4, 40),
        ...trail(4140, 444, 2, 36)
      ],
      signs: [sign(420, 'companion'), sign(2260, 'secret'), sign(3250, 'jump')],
      npcs: [{ type: 'charlie', x: 880, y: 600 }],
      checkpoints: [{ x: 2150, y: 600 }, { x: 3660, y: 600 }],
      items: [{ id: 'collar', x: 3590, y: 348 }],
      goal: { x: 4310, y: 600 }
    },

    '2-1': {
      id: '2-1', world: 2, index: 1, theme: 'library',
      name: 'La biblioteca de los porqués',
      tagline: 'Las respuestas también florecen.',
      length: 4700, spawn: { x: 110, y: 470 },
      intro: 'intro21',
      tip: 'E para hablar · responde con el corazón',
      platforms: [
        G(0, 950), G(1110, 760), G(2030, 880), G(3070, 900), G(4130, 570),
        P(520, 510, 120), P(700, 440, 120),
        P(980, 470, 140), P(1180, 400, 130),
        P(1610, 500, 130), P(1800, 438, 120),
        P(2180, 512, 130), P(2390, 446, 120),
        P(2720, 510, 140), P(2920, 438, 120), P(3120, 366, 140),
        P(3470, 500, 120), P(3660, 430, 120),
        P(3950, 500, 130)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(550, 462, 3, 38), ...trail(730, 392, 2, 36),
        ...arc(950, 540, 5, 34, 44),
        ...trail(1150, 552, 5, 42),
        ...trail(1210, 352, 2, 36),
        ...trail(1650, 452, 3, 38), ...trail(1840, 390, 2, 36),
        ...trail(2060, 552, 4, 42),
        ...trail(2220, 464, 3, 38), ...trail(2430, 398, 2, 36),
        ...arc(2920, 540, 5, 34, 46),
        ...trail(3100, 552, 4, 42),
        ...trail(3160, 318, 2, 36),
        ...trail(3510, 452, 2, 38), ...trail(3700, 382, 2, 36),
        ...trail(3990, 452, 2, 38),
        ...trail(4180, 552, 4, 42)
      ],
      signs: [sign(360, 'interact'), sign(2860, 'secret')],
      npcs: [{ type: 'schroeder', x: 1700, y: 600 }, { type: 'linus', x: 3600, y: 600 }],
      quizzes: [quiz('2-1-a', 1150, 600, 'q_friend'), quiz('2-1-b', 2450, 600, 'q_piano'), quiz('2-1-c', 3800, 600, 'q_collar')],
      checkpoints: [{ x: 2600, y: 600 }],
      items: [{ id: 'kite', x: 3160, y: 366 }],
      goal: { x: 4430, y: 600 }
    },

    '2-2': {
      id: '2-2', world: 2, index: 2, theme: 'garden',
      name: 'El jardín de las respuestas',
      tagline: 'Preguntas que huelen a flores.',
      length: 4900, spawn: { x: 110, y: 470 },
      intro: 'intro22',
      tip: 'Busca al Búho: cada respuesta es una recompensa',
      platforms: [
        G(0, 880), G(1020, 830), G(1980, 830), G(3000, 900), G(4090, 810),
        P(600, 500, 120), P(810, 430, 120),
        P(1170, 498, 130), P(1380, 430, 130), P(1590, 500, 110),
        P(2200, 500, 120), P(2380, 424, 130), P(2580, 500, 120),
        P(2750, 590, 110, 'ledge'),
        P(3220, 500, 120), P(3410, 430, 120),
        P(3770, 500, 130), P(3970, 430, 120), P(4170, 360, 140),
        P(4380, 440, 120)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(640, 452, 3, 38), ...trail(850, 382, 2, 38),
        ...arc(880, 540, 5, 34, 44),
        ...trail(1060, 552, 5, 42),
        ...trail(1210, 450, 3, 38), ...trail(1420, 382, 3, 38),
        ...trail(1630, 452, 2, 38),
        ...arc(1860, 540, 5, 34, 44),
        ...trail(2020, 552, 4, 42),
        ...trail(2240, 452, 2, 38), ...trail(2420, 376, 3, 38),
        ...trail(2620, 452, 2, 38),
        ...trail(2800, 542, 2, 36),
        ...arc(2940, 540, 5, 34, 46),
        ...trail(3040, 552, 4, 42),
        ...trail(3260, 452, 2, 38), ...trail(3450, 382, 2, 38),
        ...trail(3810, 452, 2, 38), ...trail(4010, 382, 2, 38),
        ...trail(4210, 312, 3, 38),
        ...trail(4420, 392, 2, 36)
      ],
      signs: [sign(460, 'interact'), sign(3080, 'secret')],
      npcs: [{ type: 'linus', x: 1400, y: 600 }, { type: 'lucy', x: 3300, y: 600 }],
      quizzes: [quiz('2-2-a', 950, 600, 'q_blanket'), quiz('2-2-b', 2100, 600, 'q_ace'), quiz('2-2-c', 3550, 600, 'q_sister')],
      checkpoints: [{ x: 2500, y: 600 }, { x: 4300, y: 600 }],
      items: [
        { id: 'piano', x: 2790, y: 590 },
        { id: 'blanket', x: 4460, y: 440 }
      ],
      goal: { x: 4700, y: 600 }
    },

    '3-1': {
      id: '3-1', world: 3, index: 1, theme: 'arena',
      name: 'La arena del Barón Rojo',
      tagline: 'Coraje con olor a hojalata.',
      length: 4900, spawn: { x: 110, y: 470 },
      intro: 'intro31',
      tip: 'Espacio en el momento justo · H para curar',
      platforms: [
        G(0, 920), G(1040, 880), G(2050, 920), G(3110, 800), G(4010, 890),
        B(520, 548, 90, 60, 'block'),
        P(700, 500, 120), P(910, 432, 120),
        P(1230, 500, 120), P(1440, 432, 130),
        P(1850, 500, 110), P(2040, 440, 110),
        P(2360, 500, 120), P(2550, 432, 120),
        P(2860, 500, 130), P(3050, 424, 120),
        P(3370, 500, 120), P(3560, 432, 130),
        P(3890, 500, 110), P(4080, 430, 120),
        P(4340, 500, 120)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(560, 500, 2, 36),
        ...trail(740, 452, 3, 38), ...trail(950, 384, 2, 38),
        ...arc(980, 540, 4, 34, 46),
        ...trail(1080, 552, 4, 42),
        ...trail(1270, 452, 2, 38), ...trail(1480, 384, 2, 38),
        ...trail(1880, 452, 2, 38), ...trail(2080, 392, 2, 38),
        ...trail(2380, 452, 2, 38), ...trail(2590, 384, 2, 38),
        ...trail(2890, 452, 3, 38), ...trail(3090, 376, 2, 38),
        ...trail(3400, 452, 2, 38), ...trail(3600, 384, 3, 38),
        ...trail(3920, 452, 2, 38), ...trail(4120, 382, 2, 38),
        ...trail(4370, 452, 2, 38),
        ...trail(4090, 552, 4, 42)
      ],
      signs: [sign(650, 'combat'), sign(2800, 'goal')],
      npcs: [],
      enemies: [
        { type: 'cloud', x: 1550, y: 600, hp: 5 },
        { type: 'robot', x: 2650, y: 600, hp: 7 },
        { type: 'cloud', x: 3700, y: 600, hp: 6 }
      ],
      checkpoints: [{ x: 2100, y: 600 }, { x: 3450, y: 600 }],
      items: [{ id: 'gloves', x: 2900, y: 500 }],
      goal: { x: 4650, y: 600 }
    },

    '3-2': {
      id: '3-2', world: 3, index: 2, theme: 'sky',
      name: 'El cielo del As Volador',
      tagline: 'El Barón guarda la última puerta.',
      length: 5100, spawn: { x: 110, y: 470 },
      intro: 'intro32',
      tip: 'El gato del vecino espera al final · usa tus plumas',
      platforms: [
        G(0, 900), G(1020, 820), G(1960, 900), G(2990, 800), G(3920, 1180),
        P(560, 500, 120), P(760, 432, 120), P(970, 500, 100),
        P(1170, 490, 130), P(1380, 424, 120), P(1590, 496, 120),
        P(1850, 500, 110),
        P(2180, 500, 130), P(2380, 430, 130), P(2590, 500, 120),
        P(2860, 490, 120), P(3060, 424, 120), P(3260, 496, 120),
        P(3500, 500, 120), P(3700, 432, 120), P(3890, 500, 100),
        P(4140, 500, 110), P(4300, 432, 120)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(600, 452, 2, 38), ...trail(800, 384, 2, 38),
        ...arc(940, 540, 5, 34, 44),
        ...trail(1060, 552, 4, 42),
        ...trail(1210, 442, 3, 38), ...trail(1420, 376, 2, 38),
        ...trail(1630, 448, 2, 38),
        ...arc(1880, 540, 5, 34, 46),
        ...trail(2000, 552, 4, 42),
        ...trail(2220, 452, 2, 38), ...trail(2420, 382, 3, 38),
        ...trail(2630, 452, 2, 38),
        ...trail(2900, 442, 2, 38), ...trail(3100, 376, 2, 38),
        ...trail(3300, 448, 2, 38),
        ...arc(3440, 540, 5, 34, 46),
        ...trail(3540, 452, 2, 38), ...trail(3740, 384, 2, 38),
        ...trail(3930, 452, 3, 38),
        ...trail(4180, 452, 2, 38), ...trail(4340, 384, 2, 38),
        ...trail(4560, 552, 5, 42)
      ],
      signs: [sign(2550, 'combat'), sign(3980, 'secret')],
      npcs: [],
      enemies: [
        { type: 'robot', x: 1400, y: 600, hp: 7 },
        { type: 'cloud', x: 2450, y: 600, hp: 6 },
        { type: 'robot', x: 3350, y: 600, hp: 8 },
        { type: 'cat', x: 4260, y: 600, hp: 12, boss: true }
      ],
      checkpoints: [{ x: 2300, y: 600 }, { x: 4000, y: 600 }],
      items: [
        { id: 'badge', x: 2170, y: 500 },
        { id: 'sunglasses', x: 4590, y: 600, secret: true }
      ],
      bossGate: { x: 4510, y: 600 },
      goal: { x: 4900, y: 600 }
    },

    '4-1': {
      id: '4-1', world: 4, index: 1, theme: 'jungle',
      name: 'El bosque de los tesoros',
      tagline: 'Lo que el tiempo no pudo llevarse.',
      length: 5900, spawn: { x: 110, y: 470 },
      intro: 'intro41',
      tip: 'Q revela tesoros cercanos con Woodstock',
      platforms: [
        G(0, 980), G(1130, 780), G(2060, 900), G(3150, 890), G(4220, 760), G(5110, 790),
        P(520, 500, 120), P(730, 432, 120),
        P(1000, 500, 120),
        P(1250, 490, 130), P(1460, 424, 130),
        B(1650, 552, 90, 48, 'block'),
        P(1830, 500, 110),
        P(2180, 500, 120), P(2380, 430, 120),
        P(2700, 500, 120), P(2900, 430, 120),
        P(3070, 500, 110),
        P(3300, 500, 130), P(3510, 430, 130), P(3720, 360, 120),
        P(4010, 500, 120),
        P(4380, 500, 120), P(4580, 432, 120),
        P(4840, 500, 120),
        P(5260, 500, 130), P(5470, 430, 120)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(560, 452, 2, 38), ...trail(770, 384, 2, 38),
        ...arc(950, 540, 5, 34, 44),
        ...trail(1040, 552, 4, 42),
        ...trail(1290, 442, 2, 38), ...trail(1500, 376, 2, 38),
        ...arc(1700, 540, 4, 34, 44),
        ...trail(1870, 452, 2, 38),
        ...trail(2210, 452, 3, 38), ...trail(2420, 382, 2, 38),
        ...arc(2620, 540, 5, 34, 46),
        ...trail(2740, 452, 2, 38), ...trail(2940, 382, 2, 38),
        ...trail(3110, 452, 2, 38),
        ...trail(3340, 452, 2, 38), ...trail(3550, 382, 2, 38), ...trail(3760, 312, 2, 38),
        ...arc(3970, 540, 5, 34, 46),
        ...trail(4260, 552, 4, 42),
        ...trail(4420, 452, 2, 38), ...trail(4620, 384, 2, 38),
        ...trail(4880, 452, 2, 38),
        ...arc(5000, 540, 5, 34, 44),
        ...trail(5150, 552, 4, 42),
        ...trail(5300, 452, 2, 38), ...trail(5510, 382, 2, 38)
      ],
      signs: [sign(380, 'companion'), sign(3350, 'secret'), sign(5300, 'goal')],
      npcs: [{ type: 'charlie', x: 2450, y: 600 }],
      checkpoints: [{ x: 2150, y: 600 }, { x: 4300, y: 600 }],
      items: [
        { id: 'letter', x: 1860, y: 552, secret: true },
        { id: 'doghouse', x: 3760, y: 360 }
      ],
      goal: { x: 5680, y: 600 },
      hiddenBones: [
        ...trail(1450, 552, 3, 34),
        ...trail(3000, 552, 4, 34)
      ]
    },

    '4-2': {
      id: '4-2', world: 4, index: 2, theme: 'ruins',
      name: 'Las ruinas doradas',
      tagline: 'La cascada guarda el último recuerdo.',
      length: 6100, spawn: { x: 110, y: 470 },
      intro: 'intro42',
      tip: 'Explora los rincones escondidos · Q es tu brújula',
      platforms: [
        G(0, 920), G(1030, 860), G(1990, 810), G(2920, 900), G(3950, 930), G(5010, 1090),
        P(480, 500, 120), P(700, 430, 120),
        P(940, 500, 100),
        P(1150, 492, 120), P(1360, 424, 120),
        P(1580, 500, 120),
        B(1800, 552, 80, 48, 'block'),
        P(2100, 500, 130), P(2300, 430, 120),
        P(2550, 500, 110), P(2750, 430, 120),
        P(3050, 500, 130), P(3250, 430, 120), P(3450, 360, 130),
        P(3740, 500, 110),
        P(4080, 500, 120), P(4280, 430, 120), P(4480, 500, 120),
        P(4700, 430, 120),
        P(5140, 500, 130), P(5340, 430, 130),
        P(5620, 500, 120)
      ],
      bones: [
        ...trail(220, 552, 5, 42),
        ...trail(520, 452, 2, 38), ...trail(740, 382, 2, 38),
        ...arc(880, 540, 5, 34, 44),
        ...trail(1060, 552, 4, 42),
        ...trail(1190, 444, 2, 38), ...trail(1400, 376, 2, 38),
        ...trail(1620, 452, 2, 38),
        ...arc(1840, 540, 4, 34, 46),
        ...trail(2020, 552, 4, 42),
        ...trail(2140, 452, 2, 38), ...trail(2340, 382, 2, 38),
        ...trail(2590, 452, 2, 38), ...trail(2790, 382, 2, 38),
        ...trail(3090, 452, 2, 38), ...trail(3290, 382, 2, 38), ...trail(3490, 312, 3, 38),
        ...arc(3650, 540, 5, 34, 44),
        ...trail(3980, 552, 4, 42),
        ...trail(4120, 452, 2, 38), ...trail(4320, 382, 2, 38),
        ...trail(4520, 452, 2, 38), ...trail(4740, 382, 2, 38),
        ...arc(4900, 540, 5, 34, 46),
        ...trail(5050, 552, 4, 42),
        ...trail(5180, 452, 2, 38), ...trail(5380, 382, 2, 38),
        ...trail(5650, 452, 2, 38),
        ...trail(5800, 552, 4, 42)
      ],
      signs: [sign(350, 'secret'), sign(2750, 'companion'), sign(4900, 'goal')],
      npcs: [{ type: 'linus', x: 2250, y: 600 }],
      checkpoints: [{ x: 1900, y: 600 }, { x: 3900, y: 600 }, { x: 5000, y: 600 }],
      items: [
        { id: 'pumpkin', x: 1650, y: 552, secret: true },
        { id: 'dinner', x: 4550, y: 600, secret: true }
      ],
      goal: { x: 5900, y: 600 },
      hiddenBones: [
        ...trail(2350, 552, 3, 34),
        ...trail(4350, 552, 4, 34),
        ...trail(5450, 552, 3, 34)
      ]
    },

    '5-1': {
      id: '5-1', world: 5, index: 1, theme: 'dream',
      name: 'El rincón de los sueños',
      tagline: 'Alguien te estaba esperando.',
      length: 3300, spawn: { x: 110, y: 470 },
      intro: 'intro51',
      tip: 'No hay prisa. Sigue las luces.',
      finale: true,
      platforms: [
        G(0, 620), P(760, 540, 130), P(1000, 480, 120), P(1230, 540, 120),
        P(1450, 470, 130), P(1700, 530, 120), P(1930, 460, 130),
        P(2170, 520, 120), P(2400, 450, 130), G(2620, 680),
        P(2740, 400, 120), P(2940, 460, 100)
      ],
      bones: [
        ...trail(220, 552, 4, 46),
        ...arc(640, 540, 4, 36, 40),
        ...trail(800, 492, 2, 40),
        ...trail(1040, 432, 2, 40),
        ...trail(1270, 492, 2, 40),
        ...trail(1490, 422, 2, 40),
        ...trail(1740, 482, 2, 40),
        ...trail(1970, 412, 2, 40),
        ...trail(2210, 472, 2, 40),
        ...trail(2440, 402, 2, 40),
        ...trail(2690, 552, 3, 42)
      ],
      signs: [sign(500, 'goal')],
      npcs: [{ type: 'snoopy', x: 2920, y: 552 }],
      checkpoints: [{ x: 1650, y: 470 }],
      items: [],
      goal: null
    }
  };

  SLW.WORLD_META = {
    1: { label: 'La pradera', icon: 'meadow' },
    2: { label: 'La biblioteca', icon: 'library' },
    3: { label: 'La arena', icon: 'arena' },
    4: { label: 'El jardín', icon: 'jungle' },
    5: { label: 'El rincón', icon: 'dream' }
  };

  SLW.LEVEL_ORDER = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
  SLW.FINALE_ID = '5-1';

  /* ───────────── Themas visuales ───────────── */
  SLW.THEMES = {
    meadow: {
      sky: ['#aee7ff', '#c8f2ff', '#fbf1c9'], sun: '#fff2ae', sunGlow: 'rgba(255,244,180,.55)',
      far: '#9ad9a0', mid: '#74c483', near: '#4fa465', ground: '#7b5a3d', groundTop: '#6cc46d',
      groundDark: '#5c422b', accent: '#ffd166', cloud: 'rgba(255,255,255,.9)', particle: 'pollen',
      fog: 'rgba(255,249,214,.14)'
    },
    hills: {
      sky: ['#ffe4b8', '#ffd0a6', '#c8e7ee'], sun: '#ffd27a', sunGlow: 'rgba(255,196,110,.5)',
      far: '#b8cf8e', mid: '#8cbf7c', near: '#5fa268', ground: '#805c3b', groundTop: '#7cb85f',
      groundDark: '#62452c', accent: '#ffb35c', cloud: 'rgba(255,244,229,.9)', particle: 'pollen',
      fog: 'rgba(255,214,170,.16)'
    },
    library: {
      sky: ['#2e2654', '#4c3b7a', '#8565a8'], sun: '#ffe6b0', sunGlow: 'rgba(255,214,160,.35)',
      far: '#5b4a8c', mid: '#6f579e', near: '#4a3a74', ground: '#4c3e6b', groundTop: '#8c75c2',
      groundDark: '#382c52', accent: '#ffd87a', cloud: 'rgba(255,244,236,.22)', particle: 'lantern',
      fog: 'rgba(150,120,220,.12)'
    },
    garden: {
      sky: ['#f8c7dc', '#d9b8ef', '#8f86d9'], sun: '#ffedbf', sunGlow: 'rgba(255,214,170,.4)',
      far: '#b193d8', mid: '#8e78c4', near: '#6c5aa5', ground: '#584d78', groundTop: '#b18fe0',
      groundDark: '#40375a', accent: '#ffd0e4', cloud: 'rgba(255,245,250,.4)', particle: 'petal',
      fog: 'rgba(255,190,215,.1)'
    },
    arena: {
      sky: ['#5b2a4d', '#a3434c', '#f08a54'], sun: '#ffcf7a', sunGlow: 'rgba(255,150,80,.4)',
      far: '#6a3148', mid: '#512738', near: '#3a1b2b', ground: '#4a3540', groundTop: '#a5644e',
      groundDark: '#33232c', accent: '#ff8b5f', cloud: 'rgba(64,30,50,.6)', particle: 'ember',
      fog: 'rgba(255,120,90,.12)'
    },
    sky: {
      sky: ['#f3a6a0', '#f8c59c', '#ffe8c4'], sun: '#fff2bb', sunGlow: 'rgba(255,220,160,.55)',
      far: '#b18bb1', mid: '#9c7aa8', near: '#7a5a8e', ground: '#6f5668', groundTop: '#d3a77c',
      groundDark: '#4f3a4d', accent: '#ffb37a', cloud: 'rgba(255,250,240,.85)', particle: 'pollen',
      fog: 'rgba(255,200,160,.15)'
    },
    jungle: {
      sky: ['#0c3b3a', '#17665c', '#3f9a72'], sun: '#ffe9a8', sunGlow: 'rgba(255,232,160,.25)',
      far: '#1b5a4c', mid: '#15493e', near: '#0d382f', ground: '#3a4936', groundTop: '#57a85e',
      groundDark: '#283328', accent: '#ffcf5c', cloud: 'rgba(190,255,220,.1)', particle: 'firefly',
      fog: 'rgba(120,255,190,.06)'
    },
    ruins: {
      sky: ['#2c4c3a', '#4f7a4c', '#e2b46a'], sun: '#ffe6a0', sunGlow: 'rgba(255,214,140,.45)',
      far: '#3d6047', mid: '#31503b', near: '#243b2c', ground: '#4a4a3a', groundTop: '#7aa95c',
      groundDark: '#32342a', accent: '#ffd678', cloud: 'rgba(255,240,200,.16)', particle: 'firefly',
      fog: 'rgba(255,205,120,.1)'
    },
    dream: {
      sky: ['#161235', '#2b2155', '#5e3f74'], sun: '#fdf3d0', sunGlow: 'rgba(255,240,200,.35)',
      far: '#3f3066', mid: '#322750', near: '#251c3e', ground: '#37305a', groundTop: '#7b6bb8',
      groundDark: '#251e42', accent: '#ffd27a', cloud: 'rgba(255,244,236,.16)', particle: 'star',
      fog: 'rgba(255,220,170,.08)'
    }
  };

  /* ───────────── Créditos y textos ───────────── */
  SLW.ENDING_FALLBACK = 'Si estás leyendo esto, es porque alguien quiso regalarte un pequeño mundo. Uno donde los sueños ladran, los huesitos brillan y las preguntas tienen flores. Ojalá cada día tuyo tenga un poquito de esta magia.';
  SLW.CREDITS = 'Hecho con HTML, CSS, Canvas y muchísimo cariño.';
})();
