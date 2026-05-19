import { Mic, Cpu, Database, Shield, Volume2, Activity } from 'lucide-react';

export const BLOG_POSTS = [
  {
    "id": "mems-mic-tech",
    "title": "Micrófonos MEMS: El Diminuto Gigante en tu Bolsillo",
    "date": "19 de Mayo de 2026",
    "category": "Hardware",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Descubre cómo un microchip de silicio puede 'oír' con calidad de estudio y por qué es el corazón de Vostok Labs.",
    "icon": Mic,
    "color": "#39FF14",
    "content": [
      {
        "type": "h3",
        "text": "1. ¿Qué es un Micrófono MEMS?"
      },
      {
        "type": "p",
        "text": "Imagina que puedes encoger un micrófono de estudio profesional hasta que sea más pequeño que un grano de sal. Eso es un MEMS (Micro-Electro-Mechanical System). En lugar de usar imanes y bobinas grandes, usa un microchip de silicio que vibra con el aire."
      },
      {
        "type": "p",
        "text": "Esta tecnología es la que permite que tu smartphone tenga un sonido tan claro, pero al ser tan pequeña, se rige por leyes físicas distintas a los micrófonos antiguos. Son como \"ojos para el sonido\" integrados directamente en los circuitos del teléfono."
      },
      {
        "type": "h3",
        "text": "2. El desafío para Vostok Labs"
      },
      {
        "type": "p",
        "text": "Al ser tan sensibles, los MEMS pueden captar ruidos que el oído humano ni siquiera nota (el \"hiss\" de los circuitos). Nuestras herramientas de v1.4.0 están diseñadas específicamente para limpiar ese ruido digital y entender exactamente qué está \"sintiendo\" ese pequeño chip de silicio."
      }
    ],
    "links": [
      {
        "title": "Introduction to MEMS Microphones",
        "url": "https://www.allaboutcircuits.com/technical-articles/introduction-to-microelectromechanical-systems-microphone-technology/",
        "source": "allaboutcircuits.com"
      },
      {
        "title": "Understanding Acoustic Overload Point",
        "url": "https://www.st.com/resource/en/application_note/dm00103163-mems-microphones-specifications-stmicroelectronics.pdf",
        "source": "STMicroelectronics"
      }
    ]
  },
  {
    "id": "bitwise-dsp-math",
    "title": "Bitwise DSP: Acelerando el Audio al Límite de la CPU",
    "date": "18 de Mayo de 2026",
    "category": "Matemática",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Cómo logramos que el navegador procese audio a la velocidad de la luz usando trucos matemáticos de bajo nivel.",
    "icon": Cpu,
    "color": "#00d1ff",
    "content": [
      {
        "type": "h3",
        "text": "1. Hablando el idioma de las máquinas"
      },
      {
        "type": "p",
        "text": "Normalmente, el navegador procesa información usando números decimales (como 10.5). Pero el cerebro de tu móvil prefiere los números enteros y, sobre todo, el sistema binario (ceros y unos)."
      },
      {
        "type": "p",
        "text": "Al usar Bitwise DSP, le damos las órdenes al procesador de una forma que no tiene que \"pensar\". Es como si en una autopista quitaras todos los semáforos y dejaras que los datos viajen en línea recta. Esto reduce el calor del móvil y hace que el afinador responda al instante."
      },
      {
        "type": "code",
        "text": "// Lento: El procesador debe calcular decimales\nconst freq = Math.floor(total / 4);\n\n// Rápido (Bitwise): El procesador solo mueve un bit\nconst freq = total >> 2;",
        "language": "javascript"
      }
    ],
    "links": [
      {
        "title": "Bitwise Operators in JavaScript",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators",
        "source": "MDN Web Docs"
      },
      {
        "title": "Performance of Bitwise Ops in V8",
        "url": "https://v8.dev/blog",
        "source": "V8 Engine Blog"
      }
    ]
  },
  {
    "id": "zero-copy-memory",
    "title": "Zero-Copy: El Secreto de los 60 FPS Constantes",
    "date": "18 de Mayo de 2026",
    "category": "Memoria",
    "readTime": "4 MIN",
    "author": "Vladivostok",
    "excerpt": "¿Por qué las apps web a veces se 'traban'? Descubre cómo eliminamos los micro-tirones en Vostok Labs reciclando memoria.",
    "icon": Database,
    "color": "#A855F7",
    "content": [
      {
        "type": "h3",
        "text": "1. Evitando el 'atasco' de memoria"
      },
      {
        "type": "p",
        "text": "Cuando una aplicación crea datos nuevos constantemente (como capturar el sonido cada milisegundo), la memoria RAM se llena de \"objetos usados\". Eventualmente, el navegador debe detener todo para limpiar esa basura. Ese micro-segundo de limpieza es lo que hace que una app se sienta \"trabada\"."
      },
      {
        "type": "p",
        "text": "En Vostok Labs usamos Zero-Copy. Imagina que en lugar de usar servilletas de papel y tirarlas, usamos un plato de cerámica que lavamos y reutilizamos en cada segundo. No hay basura, por lo tanto, no hay atascos. Todo fluye a 60 cuadros por segundo sin interrupción."
      }
    ],
    "links": [
      {
        "title": "Memory Management in JS",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management",
        "source": "MDN Web Docs"
      },
      {
        "title": "Using Typed Arrays for Audio",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays",
        "source": "MDN Web Docs"
      }
    ]
  },
  {
    "id": "vhrp-protocol",
    "title": "Protocolo VHRP: Respetando tu Hardware y tu Batería",
    "date": "18 de Mayo de 2026",
    "category": "Seguridad",
    "readTime": "4 MIN",
    "author": "Vladivostok",
    "excerpt": "La ciencia detrás de apagar correctamente el micrófono y el sistema cuando dejas de usar las herramientas.",
    "icon": Shield,
    "color": "#fbbf24",
    "content": [
      {
        "type": "h3",
        "text": "1. La responsabilidad del Hardware"
      },
      {
        "type": "p",
        "text": "Tu móvil tiene recursos limitados. Si una app deja el micrófono encendido en segundo plano, no solo se gasta la batería, sino que el sistema operativo mantiene procesos activos que ralentizan todo lo demás."
      },
      {
        "type": "p",
        "text": "El Vostok Hardware Release Protocol (VHRP) es un sistema de \"apagado total\". Cuando sales de una herramienta, nos aseguramos de que cada cable virtual se desconecte y cada sensor se apague. Es nuestra garantía de que Vostok Labs solo consume energía cuando tú decides usarlo."
      }
    ],
    "links": [
      {
        "title": "Web Audio API: BaseAudioContext.close()",
        "url": "https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/close",
        "source": "MDN Web Docs"
      },
      {
        "title": "MediaStreamTrack.stop()",
        "url": "https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop",
        "source": "MDN Web Docs"
      }
    ]
  },
  {
    "id": "aop-management",
    "title": "Gestión de AOP: Protegiendo el 'Oído' de tu Smartphone",
    "date": "18 de Mayo de 2026",
    "category": "Acústica",
    "readTime": "5 MIN",
    "author": "Vladivostok",
    "excerpt": "Qué pasa cuando el sonido es demasiado fuerte para un micrófono minúsculo y cómo logramos estabilidad.",
    "icon": Volume2,
    "color": "#ff4444",
    "content": [
      {
        "type": "h3",
        "text": "1. Cuando el sonido es 'demasiado'"
      },
      {
        "type": "p",
        "text": "Imagina intentar llenar un vaso de agua con una manguera de bomberos. El agua saltará por todos lados y el vaso se desbordará. Eso es el AOP (Acoustic Overload Point) en un micrófono: el punto donde el sonido es tan fuerte que el micro ya no puede entenderlo."
      },
      {
        "type": "p",
        "text": "En lugar de dejar que el afinador se vuelva loco mostrando notas erróneas por el ruido, hemos programado un \"filtro de calma\". Si el micro se satura, el motor DSP simplemente ignora esos datos deformados y espera a que el nivel baje, manteniendo la aguja siempre estable y veraz."
      }
    ],
    "links": [
      {
        "title": "Digital Clipping and Harmonics",
        "url": "https://en.wikipedia.org/wiki/Clipping_(audio)",
        "source": "Wikipedia"
      },
      {
        "title": "High-SPL Microphone Challenges",
        "url": "https://www.knowles.com/solutions/technical-resources",
        "source": "Knowles Electronics"
      }
    ]
  },
  {
    "id": "performance-audit-2026",
    "title": "Informe de Auditoría de Rendimiento: Navegadores Web y Ecosistema",
    "date": "8 de Mayo de 2026",
    "category": "Sistemas",
    "readTime": "6 MIN",
    "author": "Vladivostok",
    "excerpt": "Análisis profundo sobre el impacto del consumo de CPU y RAM en entornos de alto rendimiento.",
    "icon": Activity,
    "color": "#39FF14",
    "content": [
      {
        "type": "h3",
        "text": "1. Metodología de la Auditoría"
      },
      {
        "type": "p",
        "text": "Utilizamos herramientas de telemetría para medir cómo los navegadores modernos gestionan la carga de procesos de audio intensos."
      },
      {
        "type": "p",
        "text": "El resultado fue claro: el aislamiento de procesos y el bloqueo de rastreadores de Brave Browser permiten que el motor de Vostok Labs respire mejor, dedicando más CPU al audio y menos a tareas de red innecesarias."
      }
    ],
    "links": [
      {
        "title": "Brave Browser Performance",
        "url": "https://brave.com/compare/chrome-vs-brave/",
        "source": "Brave Resources"
      },
      {
        "title": "V8 Engine Architecture",
        "url": "https://v8.dev/",
        "source": "Google V8"
      }
    ]
  }
];
