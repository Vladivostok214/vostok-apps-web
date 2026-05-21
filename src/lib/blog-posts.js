import { Mic, Cpu, Database, Shield, Volume2, Activity, Waves, Zap, Music, Terminal } from 'lucide-react';

export const BLOG_CATEGORIES = [
  "Desarrollo Web",
  "Investigación de Audio Digital",
  "Bitácora de Experimentación",
  "Data para Músicos",
  "Miscelánea"
];

export const BLOG_POSTS = [
  {
    "id": "post-alternate-tunings-deep-dive",
    "title": "Afinaciones Alternativas: Explorando la Geometría del Tono",
    "date": "20-05-2026",
    "category": "Data para Músicos",
    "readTime": "7 MIN",
    "author": "Vladivostok",
    "excerpt": "Desbloquea nuevas sonoridades y optimiza la física de tus cuerdas para dominar el mástil más allá del estándar.",
    "iconName": "Music",
    "color": "#39FF14",
    "content": [
      { "type": "p", "text": "La afinación estándar (E-A-D-G-B-E) es un compromiso histórico de versatilidad, pero no es la única forma de organizar el espectro sonoro en la guitarra. Las afinaciones alternativas son 'hacks' físicos que alteran la relación de intervalos entre cuerdas, permitiendo acordes imposibles y resonancias simpáticas que transforman el instrumento en una entidad acústica diferente." },
      { "type": "h3", "text": "1. El Catálogo de Laboratorio: Estructuras y 'Vibes'" },
      { "type": "p", "text": "Cada afinación tiene una huella dactilar armónica única. Aquí desglosamos las más influyentes según los estándares de ingeniería de tono de Stringjoy:" },
      { "type": "p", "text": "• DROP D (D A D G B E): La puerta de entrada. Baja la 6ª cuerda un tono. Permite 'Power Chords' con un solo dedo y una respuesta de graves mucho más agresiva y profunda. Es el estándar del Rock moderno." },
      { "type": "p", "text": "• DADGAD (D A D G A D): La joya del Folk y la música celta. Es una afinación 'suspendida' (Dsus4). Al no tener una 3ª definida, crea una atmósfera etérea y mística donde las cuerdas al aire actúan como drones constantes." },
      { "type": "p", "text": "• OPEN G (D G D G B D): El alma del Blues del Delta. Un acorde de Sol Mayor al aire. Keith Richards (The Rolling Stones) la inmortalizó quitando la 6ª cuerda para dejar la tónica en la raíz, logrando ese 'punch' rítmico inconfundible." },
      { "type": "h3", "text": "2. La Física de la Cuerda: Tensión y Calibre" },
      { "type": "p", "text": "En Vostok Labs, entendemos que el audio digital empieza en la física analógica. Al bajar la afinación (detuning), la tensión de la cuerda disminuye drásticamente. Si la tensión cae por debajo de las 14-15 lbs, la cuerda pierde definición espectral y sustain." },
      { "type": "p", "text": "MANDATO TÉCNICO: Por cada tono entero que bajes una cuerda, se recomienda subir un calibre (gauge). Si usas un .010 para Mi estándar, deberías considerar un .011 para Re si quieres que el Vostok Tuner mantenga una lectura de frecuencia estable y sin jitter por oscilación excesiva." },
      { "type": "h3", "text": "3. Aplicación en Vostok Labs" },
      { "type": "p", "text": "Utiliza el panel de 'Instrumentos' en el Vostok Tuner para cargar estos mismos presets. El sistema ajustará su centro de gravedad armónica para guiarte en el proceso de cambio de tensión, asegurando que tu guitarra esté lista para el análisis de modo en el Harmonic Radar." }
    ],
    "links": [
      { "title": "Guía Definitiva de Afinaciones (Stringjoy)", "url": "https://stringjoy.com/alternate-tunings/", "source": "Stringjoy" },
      { "title": "Calculadora de Tensión de Cuerdas", "url": "https://stringjoy.com/tension-calculator/", "source": "Stringjoy Tech" }
    ]
  },
  {
    "id": "post-tuner-guide",
    "title": "Vostok Tuner: Guía de Calibración de Grado de Estudio",
    "date": "20-05-2026",
    "category": "Data para Músicos",
    "readTime": "4 MIN",
    "author": "Vladivostok",
    "excerpt": "Cómo utilizar el monitor de cuerdas y las afinaciones alternativas para llevar tu instrumento a la perfección armónica.",
    "iconName": "Music",
    "color": "#39FF14",
    "content": [
      { "type": "p", "text": "El Vostok Tuner no es un afinador convencional de pinza; es un sensor de frecuencia basado en el algoritmo YIN de alta precisión. Para sacar el máximo provecho, debes entender su jerarquía visual y técnica." },
      { "type": "h3", "text": "1. El Monitor de Cuerdas Contextual" },
      { "type": "p", "text": "A diferencia de los afinadores cromáticos que solo muestran la nota más cercana, el Vostok Tuner entiende la anatomía de tu instrumento. Al seleccionar 'Guitarra' o 'Bajo', la columna lateral izquierda se convierte en tu mapa de ruta. Observa cómo la nota objetivo se resalta y aumenta su tamaño al ser detectada. Esto te permite afinar sin mirar la letra central, enfocándote en la tensión de cada cuerda." },
      { "type": "h3", "text": "2. Dominando las Afinaciones Alternativas" },
      { "type": "p", "text": "Explora el menú de instrumentos para acceder a afinaciones como DADGAD o Drop D. El radar detectará automáticamente el cambio de tensión y ajustará la frecuencia de referencia para cada cuerda. Recuerda: el indicador de 'Cents' en la parte inferior es tu auditor de precisión; busca el 0 absoluto para grabaciones profesionales." }
    ],
    "links": [
      { "title": "Afinaciones Alternativas y su Física", "url": "https://en.wikipedia.org/wiki/Guitar_tunings", "source": "Wikipedia" }
    ]
  },
  {
    "id": "post-scale-sensor-guide",
    "title": "Scale Sensor: El Método de Privación Sensorial",
    "date": "20-05-2026",
    "category": "Data para Músicos",
    "readTime": "6 MIN",
    "author": "Vladivostok",
    "excerpt": "Entrena tu oído relativo y memoria muscular eliminando las muletas visuales con el Dark Practice Node.",
    "iconName": "Activity",
    "color": "#39FF14",
    "content": [
      { "type": "p", "text": "El Scale Sensor es la herramienta más exigente de Vostok Labs. Está diseñada bajo el principio de 'Dark Practice': si puedes tocar la escala sin mirar un diapasón virtual, la has dominado de verdad." },
      { "type": "h3", "text": "1. El Ciclo de Validación Instantánea" },
      { "type": "p", "text": "El sensor está calibrado para capturar tu intención musical al instante. No necesitas sostener la nota infinitamente; en cuanto el sistema detecta que has entrado en el territorio del semitono correcto (±50 cents), bloquea la nota y avanza. Esto permite practicar velocidades reales de ejecución." },
      { "type": "h3", "text": "2. Uso Ético de la Guía Visual" },
      { "type": "p", "text": "El icono '?' despliega un esquema estático de la caja (Box) seleccionada. Úsalo solo como referencia inicial. El objetivo final es completar las 12 notas de la sesión con el 100% de precisión espectral sin consultar la guía, confiando puramente en tu oído y en el mensaje 'Toca: [Nota]'." }
    ],
    "links": [
      { "title": "Diccionario de Escalas de Guitarra", "url": "https://www.guitarscale.org/", "source": "GuitarScale" }
    ]
  },
  {
    "id": "post-radar-guide",
    "title": "Harmonic Radar: Interpretando la Gravedad Tonal",
    "date": "20-05-2026",
    "category": "Data para Músicos",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Aprende a leer el Círculo de Quintas dinámico para identificar tonalidades y modos en cualquier grabación.",
    "iconName": "Waves",
    "color": "#39FF14",
    "content": [
      { "type": "p", "text": "El Harmonic Radar es tu brújula en el caos armónico. Utiliza un análisis de Chromagrama para mapear qué notas tienen más peso en una señal compleja." },
      { "type": "h3", "text": "1. Lectura del Mapa de Calor (Heatmap)" },
      { "type": "p", "text": "Observa el Círculo de Quintas. Las notas que brillan con más intensidad son las que forman el 'esqueleto' de la canción. Si ves que el brillo se concentra en C, G y D, estás en un entorno de Do Mayor o Sol Mayor. El radar traza líneas de gravedad hacia el centro para indicarte la tónica predominante." },
      { "type": "h3", "text": "2. El Informe de Auditoría Armónica" },
      { "type": "p", "text": "Al detener la escucha, el sistema desclasifica un informe profundo. No solo te da la tonalidad, sino que infiere el modo (ej. Lidio o Dórico) basándose en las notas secundarias detectadas. Este informe es ideal para analizar progresiones de acordes complejas o identificar escalas en solos de jazz." }
    ],
    "links": [
      { "title": "Teoría del Círculo de Quintas", "url": "https://en.wikipedia.org/wiki/Circle_of_fifths", "source": "Wikipedia" }
    ]
  },
  {
    "id": "post-tempo-guide",
    "title": "TempoSense: Estabilidad Rítmica y Análisis de BPM",
    "date": "20-05-2026",
    "category": "Data para Músicos",
    "readTime": "3 MIN",
    "author": "Vladivostok",
    "excerpt": "Cómo utilizar el motor de Tap Tempo para sincronizar tu laboratorio con cualquier fuente rítmica.",
    "iconName": "Zap",
    "color": "#06b6d4",
    "content": [
      { "type": "p", "text": "La precisión rítmica es el 50% de la excelencia musical. TempoSense es el reloj de cuarzo de Vostok Labs, diseñado para detectar y mantener el pulso sin desviaciones." },
      { "type": "h3", "text": "1. El Algoritmo de Promediado Rápido" },
      { "type": "p", "text": "Al hacer 'Tap' sobre el objetivo, el sistema no solo mide el tiempo entre dos golpes, sino que calcula la media aritmética de tus últimos impactos. Para obtener un BPM estable, te recomendamos realizar al menos 4 o 5 toques constantes. El anillo de pulso visual te confirmará si tu 'timing' es sólido." },
      { "type": "h3", "text": "2. Entrenamiento con Metrónomo" },
      { "type": "p", "text": "Utiliza el metrónomo integrado para poner a prueba tu estabilidad. Un truco de laboratorio: detecta el tempo de una canción con el Tap, inicia el metrónomo y luego intenta tocar sobre él. Si el metrónomo de Vostok y la canción se mantienen sincronizados durante más de 30 segundos, tu detección ha sido perfecta." }
    ],
    "links": [
      { "title": "La ciencia del Tempo Humano", "url": "https://www.nature.com/articles/s41598-020-68501-y", "source": "Nature" }
    ]
  },
  {
    "id": "post-1779171586461",
    "title": "Historia de la Digitalización",
    "date": "19-05-2026",
    "category": "Investigación de Audio Digital",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "De los átomos a los bits: el salto cuántico matemático que permitió capturar el tiempo en una matriz de datos.",
    "iconName": "Waves",
    "color": "#39FF14",
    "content": [
      {
        "type": "p",
        "text": "El sonido en la naturaleza es un espectro continuo. Es una onda de presión analógica que empuja infinitamente las moléculas de aire. Durante las primeras décadas de la grabación, intentamos capturar esta continuidad mediante la imitación física: surcos de vinilo esculpidos o partículas magnéticas alineadas en una cinta."
      },
      {
        "type": "p",
        "text": "Sin embargo, el destino del audio moderno no estaba en la física de los materiales, sino en la abstracción matemática. Convertir el flujo infinito del sonido en un torrente finito de unos y ceros fue el salto cuántico que dio origen a la era digital. Esta es la crónica de cómo capturamos el tiempo en una matriz de datos."
      },
      {
        "type": "h3",
        "text": "1. La Fundación Teórica: El Teorema que Dividió el Tiempo (1928 - 1949)"
      },
      {
        "type": "p",
        "text": "Mucho antes de que existiera la primera computadora capaz de procesar sonido, la estructura matemática del audio digital ya había sido resuelta. En 1928, el ingeniero de Bell Labs, Harry Nyquist, determinó que para transmitir una señal analógica de forma analítica a través de un canal telegráfico, se necesitaba una tasa de muestreo finita."
      },
      {
        "type": "p",
        "text": "Dos décadas más tarde, in 1948, Claude Shannon unificó estas ideas en su obra cumbre sobre la Teoría de la Información. El teorema de muestreo de Nyquist-Shannon dictó una ley inmutable: si deseas digitalizar un sonido y reconstruirlo perfectamente sin distorsión (aliasing), debes tomar muestras a una velocidad que sea al menos el doble de la frecuencia más alta que desees capturar."
      },
      {
        "type": "p",
        "text": "Dado que el oído humano maduro escucha hasta los 20,000 Hz, la matemática decretó que el audio digital necesitaba, como mínimo absoluto, rebasar los 40,000 ciclos por segundo."
      },
      {
        "type": "h3",
        "text": "2. El Nacimiento del Código: PCM y Alec Reeves (1937)"
      },
      {
        "type": "p",
        "text": "El método universal bajo el cual funciona el audio digital hoy —incluyendo los buffers de Vostok Labs— se llama Modulación por Impulsos Codificados (PCM, por sus siglas en inglés). Fue inventado in 1937 por el ingeniero británico Alec Reeves mientras trabajaba en Francia."
      },
      {
        "type": "p",
        "text": "La idea de Reeves era radical para su época: en lugar de transmitir el voltaje continuo de un micrófono, propuso medir la amplitud de la onda a intervalos regulares y convertir cada medición en un número binario. En los años 30, no existían transistores ni circuitos integrados lo suficientemente rápidos para procesar audio en tiempo real con este método, por lo que la patente de Reeves hibernó durante décadas esperando que el hardware alcanzara a la teoría."
      },
      {
        "type": "h3",
        "text": "3. La Consolidación Comercial: El Estándar del Libro Rojo (1980)"
      },
      {
        "type": "p",
        "text": "La era comercial del audio digital comenzó oficialmente cuando Sony y Philips unieron fuerzas para crear el Compact Disc (CD), publicando sus especificaciones técnicas en el célebre \"Red Book\" (Libro Rojo) en 1980."
      },
      {
        "type": "p",
        "text": "Los ingenieros de ambas compañías tuvieron que tomar decisiones que estandarizarían la industria para siempre: Frecuencia de muestreo de 44.1 kHz (cumplía con Nyquist y era compatible con video U-matic) y Resolución de 16 bits (65,536 niveles posibles de amplitud), otorgando un rango dinámico teórico de 96 dB."
      },
      {
        "type": "h3",
        "text": "4. La Frontera Web: Vostok Labs y el Acceso Directo al Silicio"
      },
      {
        "type": "p",
        "text": "Durante los años 90 y 2000, la escasez de ancho de banda nos obligó a sacrificar la fidelidad en pos de la portabilidad (ej. MP3). Hoy, con la potencia de procesamiento de los smartphones, ese compromiso ya no es necesario."
      },
      {
        "type": "p",
        "text": "En Vostok Labs, nuestra suite opera bajo los mismos principios fundacionales de Nyquist y Reeves, pero ejecutados directamente en el navegador mediante la Web Audio API:"
      },
      {
        "type": "p",
        "text": "1. Captura Lineal: Solicitamos buffers PCM de punto flotante de 32 bits a través del micrófono MEMS."
      },
      {
        "type": "p",
        "text": "2. Procesamiento SOTA: Almacenamos el flujo binario crudo en estructuras Float32Array, procesándolo mediante operaciones a nivel de bits (Bitwise) para garantizar que la latencia entre el átomo acústico y el bit digital sea sub-milisegundo."
      }
    ],
    "links": [
      {
        "title": "Teoría Matemática de la Comunicación",
        "url": "https://ieeexplore.ieee.org/document/6773024",
        "source": "ieeexplore"
      },
      {
        "title": "La Invención de PCM",
        "url": "https://history.theiet.org/collections/archives/profiles/reeves-a.cfm",
        "source": "Institution of Engineering and Technology"
      }
    ]
  },
  {
    "id": "new-post-1779170726855",
    "title": "Historia de los Afinadores",
    "date": "19-05-2026",
    "category": "Bitácora de Experimentación",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Desde los discos giratorios de 1936 hasta el algoritmo YIN: un recorrido por la evolución de la precisión musical.",
    "iconName": "Activity",
    "color": "#39FF14",
    "content": [
      {
        "type": "p",
        "text": "Desde que Pitágoras dividió matemáticamente una cuerda tensa, la humanidad ha estado obsesionada con un concepto elusivo: la afinación perfecta. Durante siglos, dependimos de la física cruda —diapasones de acero resonando a 440 Hz— y del oído humano para alcanzar este estándar."
      },
      {
        "type": "p",
        "text": "Sin embargo, el siglo XX trajo consigo la necesidad de medir la frecuencia con precisión de laboratorio. Lo que comenzó como complejas máquinas electromecánicas, hoy es un cálculo matemático que ocurre en microsegundos dentro de la RAM de tu teléfono. Esta es la genealogía de la afinación."
      },
      {
        "type": "h3",
        "text": "1. La Era Mecánica: El Afinador Estroboscópico (1936)"
      },
      {
        "type": "p",
        "text": "Antes de los microchips, la precisión dependía de la luz y el movimiento. En 1936, la empresa Conn introdujo el Strobotuner, seguido poco después por los legendarios afinadores Peterson."
      },
      {
        "type": "p",
        "text": "Estos dispositivos no calculaban la frecuencia con algoritmos; la mostraban usando física óptica. Un motor giraba un disco impreso con un patrón de bandas a una velocidad exacta correspondiente a una nota musical. Un micrófono captaba el sonido del instrumento y disparaba una luz estroboscópica."
      },
      {
        "type": "p",
        "text": "* Si la nota estaba afinada, los destellos de luz se sincronizaban con el giro del disco, creando una ilusión óptica donde el patrón parecía detenerse."
      },
      {
        "type": "p",
        "text": "* Si estaba desafinada, el patrón parecía girar hacia la izquierda (bemol) o hacia la derecha (sostenido)."
      },
      {
        "type": "p",
        "text": "Eran masivos y costosos, pero ofrecían una precisión sub-cent (0.1 cents) que tardaría décadas en ser igualada por el mundo digital."
      },
      {
        "type": "h3",
        "text": "2. La Revolución de Cuarzo: Korg WT-10 (1975)"
      },
      {
        "type": "p",
        "text": "La portabilidad llegó en 1975 cuando Korg lanzó el WT-10, el primer afinador electrónico de mano del mundo. Reemplazaron el motor y el disco giratorio por un oscilador de cristal de cuarzo y un medidor analógico de aguja."
      },
      {
        "type": "p",
        "text": "El circuito utilizaba electrónica analógica básica de Zero-Crossing (cruce por cero). Contaba cuántas veces la onda de audio cruzaba el eje de cero voltios en un segundo. Aunque era revolucionario, este método sufría terriblemente con los armónicos complejos de instrumentos como el bajo, provocando que la aguja saltara erráticamente."
      },
      {
        "type": "h3",
        "text": "3. La Era Algorítmica: Entra el DSP (Años 2000)"
      },
      {
        "type": "p",
        "text": "Con la miniaturización de los microprocesadores, la afinación se convirtió en un problema de Procesamiento de Señal Digital (DSP). En 2002, Alain de Cheveigné y Hideki Kawahara publicaron el Algoritmo YIN."
      },
      {
        "type": "p",
        "text": "Basado en la autocorrelación, el YIN resolvió el problema de los armónicos que plagaba a los afinadores desde los 70s, ofreciendo una estabilidad matemática sin precedentes."
      },
      {
        "type": "h3",
        "text": "4. La Frontera Actual: Vostok Tuner"
      },
      {
        "type": "p",
        "text": "Hoy, en Vostok Labs, hemos cerrado el círculo. Nuestro objetivo fue traer la precisión de laboratorio de los antiguos afinadores estroboscópicos al entorno de navegador, utilizando micrófonos MEMS de smartphones."
      },
      {
        "type": "p",
        "text": "Para lograrlo sin agotar la CPU móvil, hemos llevado el Algoritmo YIN a sus límites: bypass del sistema para audio raw, Zero-Copy memory para 60 FPS estables y optimización Bitwise para una Latencia DSP de 0.0048 ms."
      }
    ],
    "links": [
      {
        "title": "El Algoritmo YIN",
        "url": "http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf",
        "source": "Audition"
      }
    ]
  },
  {
    "id": "mems-mic-tech",
    "title": "Micrófonos MEMS: El Diminuto Gigante en tu Bolsillo",
    "date": "19 de Mayo de 2026",
    "category": "Investigación de Audio Digital",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Descubre cómo un microchip de silicio puede 'oír' con calidad de estudio y por qué es el corazón de Vostok Labs.",
    "iconName": "Mic",
    "color": "#39FF14",
    "content": [
      { "type": "h3", "text": "1. ¿Qué es un Micrófono MEMS?" },
      { "type": "p", "text": "Imagina que puedes encoger un micrófono de estudio profesional hasta que sea más pequeño que un grano de sal. Eso es un MEMS (Micro-Electro-Mechanical System). En lugar de usar imanes y bobinas grandes, usa un microchip de silicio que vibra con el aire." },
      { "type": "p", "text": "Esta tecnología es la que permite que tu smartphone tenga un sonido tan claro, pero al ser tan pequeña, se rige por leyes físicas distintas a los micrófonos antiguos. Son como \"ojos para el sonido\" integrados directamente en los circuitos del teléfono." },
      { "type": "h3", "text": "2. El desafío para Vostok Labs" },
      { "type": "p", "text": "Al ser tan sensibles, los MEMS pueden captar ruidos que el oído humano ni siquiera nota (el \"hiss\" de los circuitos). Nuestras herramientas de v1.4.0 están diseñadas específicamente para limpiar ese ruido digital y entender exactamente qué está \"sintiendo\" ese pequeño chip de silicio." }
    ],
    "links": [
      { "title": "Introduction to MEMS Microphones", "url": "https://www.allaboutcircuits.com/technical-articles/introduction-to-microelectromechanical-systems-microphone-technology/", "source": "allaboutcircuits.com" },
      { "title": "Understanding Acoustic Overload Point", "url": "https://www.st.com/resource/en/application_note/dm00103163-mems-microphones-specifications-stmicroelectronics.pdf", "source": "STMicroelectronics" }
    ]
  },
  {
    "id": "bitwise-dsp-math",
    "title": "Bitwise DSP: Acelerando el Audio al Límite de la CPU",
    "date": "18 de Mayo de 2026",
    "category": "Investigación de Audio Digital",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Cómo logramos que el navegador procese audio a la velocidad de la luz usando trucos matemáticos de bajo nivel.",
    "iconName": "Cpu",
    "color": "#00d1ff",
    "content": [
      { "type": "h3", "text": "1. Hablando el idioma de las máquinas" },
      { "type": "p", "text": "Normalmente, el navegador procesa información usando números decimales (como 10.5). Pero el cerebro de tu móvil prefiere los números enteros y, sobre todo, el sistema binario (ceros y unos)." },
      { "type": "p", "text": "Al usar Bitwise DSP, le damos las órdenes al procesador de una forma que no tiene que \"pensar\". Es como si en una autopista quitaras todos los semáforos y dejaras que los datos viajen en línea recta. Esto reduce el calor del móvil y hace que el afinador responda al instante." },
      { "type": "code", "text": "// Lento: El procesador debe calcular decimales\nconst freq = Math.floor(total / 4);\n\n// Rápido (Bitwise): El procesador solo mueve un bit\nconst freq = total >> 2;", "language": "javascript" }
    ],
    "links": [
      { "title": "Bitwise Operators in JavaScript", "url": "https://medium.com/@daniellempesis/bitwise-operators-in-javascript-82f05ca23fe", "source": "The Case for Bitwise Operators in JS" },
      { "title": "Performance of Bitwise Ops in V8", "url": "https://v8.dev/blog", "source": "V8 Engine Blog" }
    ]
  },
  {
    "id": "zero-copy-memory",
    "title": "Zero-Copy: El Secreto de los 60 FPS Constantes",
    "date": "18 de Mayo de 2026",
    "category": "Desarrollo Web",
    "readTime": "4 MIN",
    "author": "Vladivostok",
    "excerpt": "¿Por qué las apps web a veces se 'traban'? Descubre cómo eliminamos los micro-tirones en Vostok Labs reciclando memoria.",
    "iconName": "Database",
    "color": "#A855F7",
    "content": [
      { "type": "h3", "text": "1. Evitando el 'atasco' de memoria" },
      { "type": "p", "text": "Cuando una aplicación crea datos nuevos constantemente (como capturar el sonido cada milisegundo), la memoria RAM se llena de \"objetos usados\". Eventualmente, el navegador debe detener todo para limpiar esa basura. Ese micro-segundo de limpieza es lo que hace que una app se sienta \"trabada\"." },
      { "type": "p", "text": "En Vostok Labs usamos Zero-Copy. Imagina que en lugar de usar servilletas de papel y tirarlas, usamos un plato de cerámica que lavamos y reutilizamos en cada segundo. No hay basura, por lo tanto, no hay atascos. Todo fluye a 60 cuadros por segundo sin interrupción." }
    ],
    "links": [
      { "title": "Memory Management in JS", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management", "source": "MDN Web Docs" },
      { "title": "Using Typed Arrays for Audio", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays", "source": "MDN Web Docs" }
    ]
  },
  {
    "id": "vhrp-protocol",
    "title": "Protocolo VHRP: Respetando tu Hardware y tu Batería",
    "date": "18 de Mayo de 2026",
    "category": "Desarrollo Web",
    "readTime": "4 MIN",
    "author": "Vladivostok",
    "excerpt": "La ciencia detrás de apagar correctamente el micrófono y el sistema cuando dejas de usar las herramientas.",
    "iconName": "Shield",
    "color": "#fbbf24",
    "content": [
      { "type": "h3", "text": "1. La responsabilidad del Hardware" },
      { "type": "p", "text": "Tu móvil tiene recursos limitados. Si una app deja el micrófono encendido en segundo plano, no solo se gasta la batería, sino que el sistema operativo mantiene procesos activos que ralentizan todo lo demás." },
      { "type": "p", "text": "El Vostok Hardware Release Protocol (VHRP) es un sistema de \"apagado total\". Cuando sales de una herramienta, nos aseguramos de que cada cable virtual se desconecte y cada sensor se apague. Es nuestra garantía de que Vostok Labs solo consume energía cuando tú decides usarlo." }
    ],
    "links": [
      { "title": "Web Audio API: BaseAudioContext.close()", "url": "https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/close", "source": "MDN Web Docs" },
      { "title": "MediaStreamTrack.stop()", "url": "https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop", "source": "MDN Web Docs" }
    ]
  },
  {
    "id": "aop-management",
    "title": "Gestión de AOP: Protegiendo el 'Oído' de tu Smartphone",
    "date": "18 de Mayo de 2026",
    "category": "Investigación de Audio Digital",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Qué pasa cuando el sonido es demasiado fuerte para un micrófono minúsculo y cómo logramos estabilidad.",
    "iconName": "Volume2",
    "color": "#ff4444",
    "content": [
      { "type": "h3", "text": "1. Cuando el sonido es 'demasiado'" },
      { "type": "p", "text": "Imagina intentar llenar un vaso de agua con una manguera de bomberos. El agua saltará por todos lados y el vaso se desbordará. Eso es el AOP (Acoustic Overload Point) en un micrófono: el punto donde el sonido es tan fuerte que el micro ya no puede entenderlo." },
      { "type": "p", "text": "En lugar de dejar que el afinador se vuelva loco mostrando notas erróneas por el ruido, hemos programado un \"filtro de calma\". Si el micro se satura, el motor DSP simplemente ignora esos datos deformados y espera a que el nivel baje, manteniendo la aguja siempre estable y veraz." }
    ],
    "links": [
      { "title": "Digital Clipping and Harmonics", "url": "https://en.wikipedia.org/wiki/Clipping_(audio)", "source": "Wikipedia" },
      { "title": "High-SPL Microphone Challenges", "url": "https://www.knowles.com/solutions/technical-resources", "source": "Knowles Electronics" }
    ]
  },
  {
    "id": "performance-audit-2026",
    "title": "Informe de Auditoría de Rendimiento: Navegadores Web y Ecosistema",
    "date": "8 de Mayo de 2026",
    "category": "Miscelánea",
    "readTime": "6 MIN",
    "author": "Vladivostok",
    "excerpt": "Análisis profundo sobre el impacto del consumo de CPU y RAM en entornos de alto rendimiento.",
    "iconName": "Activity",
    "color": "#39FF14",
    "content": [
      { "type": "h3", "text": "1. Metodología de la Auditoría" },
      { "type": "p", "text": "Utilizamos herramientas de telemetría para medir cómo los navegadores modernos gestionan la carga de procesos de audio intensos." },
      { "type": "p", "text": "El resultado fue claro: el aislamiento de procesos y el bloqueo de rastreadores de Brave Browser permiten que el motor de Vostok Labs respire mejor, dedicando más CPU al audio y menos a tareas de red innecesarias." }
    ],
    "links": [
      { "title": "Brave Browser Performance", "url": "https://brave.com/compare/chrome-vs-brave/", "source": "Brave Resources" },
      { "title": "V8 Engine Architecture", "url": "https://v8.dev/", "source": "Google V8" }
    ]
  }
];
