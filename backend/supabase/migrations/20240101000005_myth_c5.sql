-- Nuevo mito del Desmitificador (con audios en Mískitu dentro de la app: assets/audio/miskitu/c5_*.ogg)
INSERT INTO myths (id, category, myth, reality) VALUES
('c5', 'ciclo',
 'Las mujeres que están menstruando no deben cocinar ni preparar alimentos porque pueden dañarlos o hacer que se descompongan.',
 'La menstruación es un proceso biológico natural del cuerpo femenino y no afecta la calidad de los alimentos ni la capacidad de una mujer para cocinar, trabajar, estudiar o participar en actividades comunitarias. No existe ninguna evidencia científica que demuestre que una mujer menstruando pueda dañar los alimentos o alterar su preparación. Estas creencias forman parte de mitos y tradiciones culturales transmitidas de generación en generación.')
ON CONFLICT (id) DO NOTHING;
