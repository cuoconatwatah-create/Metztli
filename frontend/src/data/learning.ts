// ─────────────────────────────────────────────────────────
// Metztli — Contenido educativo offline (Botiquín de saberes)
// Información general de orientación; no sustituye la consulta médica.
// ─────────────────────────────────────────────────────────

export type ArticleCategory = 'nutricion' | 'mental' | 'higiene' | 'sexualidad' | 'salud' | 'mitos';

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  nutricion: 'Nutrición',
  mental: 'Salud mental',
  higiene: 'Higiene íntima',
  sexualidad: 'Sexualidad',
  salud: 'Salud',
  mitos: 'Mitos',
};

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  tone: 'carmin' | 'bosque' | 'mauve';
  stage: string;
  readMinutes: number;
  intro: string;
  headingList: string;
  bullets: string[];
  outro: string;
}

export const ARTICLES: Article[] = [
  {
    id: 'sop',
    title: 'Entender el SOP',
    summary: 'Síntomas, diagnóstico y acompañamiento',
    category: 'salud',
    tone: 'carmin',
    stage: 'Salud menstrual',
    readMinutes: 5,
    intro:
      'El Síndrome de Ovario Poliquístico (SOP) es un desbalance hormonal muy común en mujeres en edad reproductiva. No estás sola y, con el acompañamiento y los hábitos adecuados, puedes recuperar tu bienestar.',
    headingList: 'Señales de alerta a tu cuerpo:',
    bullets: [
      'Ciclos irregulares o ausencia de menstruación.',
      'Cambios en la piel (acné) o vello corporal extra (aumento de andrógenos).',
      'Fatiga repentina o muchos antojos de dulce (resistencia a la insulina).',
    ],
    outro: 'Si te identificas con varias señales, acude a tu centro de salud para una evaluación. El diagnóstico lo hace personal médico.',
  },
  {
    id: 'nutrir-ciclo',
    title: 'Nutrir tu ciclo',
    summary: 'Alimentos que acompañan cada fase',
    category: 'nutricion',
    tone: 'bosque',
    stage: 'Salud menstrual',
    readMinutes: 4,
    intro:
      'Durante la menstruación el cuerpo pierde hierro. Comer bien en cada fase te ayuda a tener más energía y a sentirte mejor.',
    headingList: 'Ideas sencillas para cada día:',
    bullets: [
      'Frijoles, lentejas, hígado y hojas verdes aportan hierro.',
      'Acompáñalos con naranja, limón o mandarina: la vitamina C ayuda a absorber el hierro.',
      'Toma agua durante todo el día; ayuda a reducir la hinchazón.',
    ],
    outro: 'Si sientes mucho cansancio o mareos durante tu periodo, pide una revisión para descartar anemia.',
  },
  {
    id: 'mente-hormonas',
    title: 'Mente y hormonas',
    summary: 'Por qué cambia tu ánimo durante el ciclo',
    category: 'mental',
    tone: 'mauve',
    stage: 'Salud mental',
    readMinutes: 4,
    intro:
      'Las hormonas cambian a lo largo del ciclo y pueden influir en tu ánimo, tu sueño y tu energía. Notarlo no es debilidad: es información sobre tu cuerpo.',
    headingList: 'Qué puedes hacer:',
    bullets: [
      'Anota cómo te sientes cada día; verás patrones en tu ciclo.',
      'Descansa y muévete con suavidad: una caminata corta ayuda.',
      'Habla con alguien de confianza cuando te sientas agobiada.',
    ],
    outro: 'Si la tristeza o la ansiedad te impiden hacer tu vida diaria, busca apoyo profesional en tu centro de salud.',
  },
  {
    id: 'habitar-cambio',
    title: 'Habitar el cambio',
    summary: 'Climaterio y menopausia sin miedo',
    category: 'salud',
    tone: 'carmin',
    stage: 'Menopausia',
    readMinutes: 5,
    intro:
      'La menopausia es una etapa natural de la vida, no una enfermedad. Los bochornos, los cambios de sueño y de ánimo son comunes y tienen alivio.',
    headingList: 'Para sentirte mejor:',
    bullets: [
      'Viste ropa ligera por capas y mantén tu cuarto ventilado.',
      'Haz ejercicio con regularidad; cuida tus huesos con calcio y sol.',
      'Consulta si los síntomas afectan tu descanso o tu bienestar.',
    ],
    outro: 'El personal de salud puede orientarte sobre opciones de alivio adecuadas para ti.',
  },
  {
    id: 'mente-gestante',
    title: 'Mente gestante',
    summary: 'Emociones durante el embarazo',
    category: 'mental',
    tone: 'mauve',
    stage: 'Embarazo',
    readMinutes: 4,
    intro:
      'Durante el embarazo es normal sentir alegría, miedo, cansancio o ganas de llorar en un mismo día. Cuidar tu mente también es cuidar a tu bebé.',
    headingList: 'Cuida tu bienestar emocional:',
    bullets: [
      'Comparte lo que sientes con tu pareja, familia o partera.',
      'Duerme y descansa cuando puedas; pide ayuda con las tareas.',
      'Asiste a todos tus controles prenatales.',
    ],
    outro: 'Si te sientes triste casi todos los días o tienes pensamientos de hacerte daño, busca ayuda de inmediato en tu centro de salud.',
  },
  {
    id: 'anemia-embarazo',
    title: 'Anemia en el embarazo',
    summary: 'Señales y prevención',
    category: 'salud',
    tone: 'carmin',
    stage: 'Embarazo',
    readMinutes: 3,
    intro:
      'La hemoglobina baja es común durante el embarazo porque el cuerpo necesita más hierro. Conocer las señales ayuda a actuar a tiempo.',
    headingList: 'Señales de alerta:',
    bullets: [
      'Cansancio intenso, mareos o palpitaciones.',
      'Palidez en la piel, uñas o dentro de los párpados.',
      'Dificultad para respirar al hacer esfuerzos pequeños.',
    ],
    outro: 'Toma las vitaminas y el hierro que te indique tu control prenatal y come alimentos ricos en hierro.',
  },
  {
    id: 'nutricion-t3',
    title: 'Nutrición en el tercer trimestre',
    summary: 'Qué comer en la recta final',
    category: 'nutricion',
    tone: 'bosque',
    stage: 'Embarazo',
    readMinutes: 3,
    intro:
      'En los últimos meses tu bebé crece rápido. Comer en porciones pequeñas y frecuentes puede ayudarte con la acidez y la sensación de llenura.',
    headingList: 'Ideas sencillas:',
    bullets: [
      'Incluye frutas, verduras, granos y proteínas en cada día.',
      'Evita comidas muy grasosas o picantes si te dan acidez.',
      'Bebe suficiente agua y consulta antes de tomar infusiones.',
    ],
    outro: 'Tu personal de salud puede darte una guía adaptada a ti.',
  },
];

/** Etapas a las que aplica un artículo; los temas generales (salud mental, sexual) aplican a todas. */
export function articleStages(article: Article): ('cycle' | 'pregnancy' | 'menopause')[] {
  if (article.stage === 'Salud menstrual') return ['cycle'];
  if (article.stage === 'Embarazo') return ['pregnancy'];
  if (article.stage === 'Menopausia') return ['menopause'];
  return ['cycle', 'pregnancy', 'menopause'];
}

export const ARTICLE_FILTERS: { value: 'todos' | ArticleCategory; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'mental', label: 'Salud mental' },
  { value: 'higiene', label: 'Higiene íntima' },
  { value: 'sexualidad', label: 'Sexualidad' },
  { value: 'salud', label: 'Salud' },
];

ARTICLES.push(
  {
    id: 'higiene-intima',
    title: 'Cuidar tu higiene íntima',
    summary: 'Hábitos simples y seguros',
    category: 'higiene',
    tone: 'bosque',
    stage: 'Salud menstrual',
    readMinutes: 3,
    intro:
      'La vagina se limpia sola. Para cuidarla basta con lavar la zona externa con agua y, si lo deseas, jabón suave sin perfume.',
    headingList: 'Recomendaciones:',
    bullets: [
      'Cambia toallas, tampones o copa menstrual con la frecuencia indicada.',
      'Evita duchas vaginales y productos perfumados: alteran el equilibrio natural.',
      'Usa ropa interior de algodón y seca bien la zona.',
    ],
    outro: 'Si notas mal olor persistente, picazón o secreción distinta a la habitual, acude a tu centro de salud.',
  },
  {
    id: 'sexualidad-salud',
    title: 'Sexualidad con cuidado',
    summary: 'Decidir, protegerte y pedir información',
    category: 'sexualidad',
    tone: 'mauve',
    stage: 'Salud sexual',
    readMinutes: 4,
    intro:
      'Tienes derecho a decidir sobre tu cuerpo, a recibir información clara y a vivir tu sexualidad sin presión ni violencia.',
    headingList: 'Para cuidarte:',
    bullets: [
      'Consulta sobre métodos de planificación familiar gratuitos en tu centro de salud.',
      'El condón ayuda a prevenir infecciones de transmisión sexual.',
      'Nadie puede obligarte: si sufres violencia, pide ayuda a una persona de confianza o a las líneas de emergencia del Directorio.',
    ],
    outro: 'Haz tus controles ginecológicos y la prueba de Papanicolaou según te indique el personal de salud.',
  }
);
