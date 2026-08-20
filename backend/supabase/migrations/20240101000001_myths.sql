-- Tabla para los Mitos y Realidades
CREATE TABLE IF NOT EXISTS myths (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('ciclo', 'embarazo', 'menopausia')),
  myth TEXT NOT NULL,
  reality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE myths ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer los mitos
CREATE POLICY "Public Myths Read" ON myths FOR SELECT USING (true);

-- Insertar los mitos iniciales (Seed data)
INSERT INTO myths (id, category, myth, reality) VALUES
-- CICLO MENSTRUAL
('c1', 'ciclo', 'No te puedes bañar ni lavar el cabello cuando andas con la regla.', '¡Falso! Bañarse es muy importante para la higiene y comodidad. El agua no "corta" la menstruación ni causa daño.'),
('c2', 'ciclo', 'Si comes cosas ácidas como limón se te corta el periodo.', 'No hay alimentos que puedan detener tu flujo menstrual. Puedes mantener tu dieta habitual sin problemas.'),
('c3', 'ciclo', 'La sangre menstrual es sucia o tóxica.', 'La sangre menstrual es completamente natural, está compuesta de sangre, tejido del útero y agua. No es tóxica de ninguna manera.'),
('c4', 'ciclo', 'No puedes hacer ejercicio mientras estás menstruando.', 'El ejercicio leve o moderado puede incluso ayudar a reducir los cólicos menstruales al liberar endorfinas.'),

-- EMBARAZO
('e1', 'embarazo', 'Las agruras o acidez significan que el bebé nacerá con mucho cabello.', 'La acidez es causada por los cambios hormonales que relajan una válvula del estómago y por la presión que ejerce el bebé al crecer, no por su cabello.'),
('e2', 'embarazo', 'La forma de la panza (alta o baja, redonda o puntiaguda) indica el sexo del bebé.', 'La forma de la panza depende de la estructura física de la madre, el tono muscular y la posición del bebé, no de si es niño o niña.'),
('e3', 'embarazo', 'No debes tejer ni enrollar hilos, porque el cordón se le puede enredar al bebé.', 'El enredo del cordón ocurre por los movimientos del bebé dentro de la panza, ninguna actividad que hagas con tus manos puede causarlo.'),
('e4', 'embarazo', 'Cargar cosas pesadas o levantar los brazos al inicio del embarazo causa abortos.', 'El útero protege muy bien al embrión. Sin embargo, para cuidar tu espalda, es recomendable no excederse en el esfuerzo físico.'),

-- MENOPAUSIA
('m1', 'menopausia', 'Con la menopausia desaparece el deseo sexual.', 'El deseo sexual puede cambiar debido a la sequedad o a las hormonas, pero muchas mujeres disfrutan de una vida sexual plena y sin la preocupación de un embarazo.'),
('m2', 'menopausia', 'La menopausia te hace ganar peso de forma inevitable.', 'El metabolismo se vuelve más lento con la edad. El aumento de peso se previene manteniendo una alimentación saludable y ejercicio regular.'),
('m3', 'menopausia', 'La menopausia es una enfermedad que requiere tratamiento médico siempre.', 'Es una etapa natural de la vida, no una enfermedad. Solo requiere tratamiento si los síntomas (como los bochornos) afectan severamente tu calidad de vida.')
ON CONFLICT (id) DO NOTHING;
