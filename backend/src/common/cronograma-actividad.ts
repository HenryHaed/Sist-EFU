export const TIPOS_CRONOGRAMA_ACTIVIDAD = ['MONOGRAFIA', 'FICHA_TECNICA'] as const;
export type TipoCronogramaActividad = (typeof TIPOS_CRONOGRAMA_ACTIVIDAD)[number];

export function esTipoCronogramaActividad(tipo: unknown): tipo is TipoCronogramaActividad {
  return TIPOS_CRONOGRAMA_ACTIVIDAD.includes(String(tipo || '').toUpperCase() as TipoCronogramaActividad);
}

export function etiquetaActividadCronograma(tipo: string): string {
  const t = String(tipo || '').toUpperCase();
  if (t === 'MONOGRAFIA') return 'subida de monografías';
  if (t === 'FICHA_TECNICA') return 'generación de fichas técnicas';
  return 'esta actividad';
}

export function formatoFechaCronograma(d: Date | string): string {
  return new Date(d).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type EstadoVentanaCronograma = {
  definido: boolean;
  abierto: boolean;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  mensaje: string | null;
};

export function estadoVentanaCronograma(
  tipo: string,
  fechaInicio?: Date | string | null,
  fechaFin?: Date | string | null,
): EstadoVentanaCronograma {
  const etiqueta = etiquetaActividadCronograma(tipo);
  if (!fechaInicio || !fechaFin) {
    return {
      definido: false,
      abierto: false,
      fechaInicio: null,
      fechaFin: null,
      mensaje: `No se ha definido el cronograma respectivo para la ${etiqueta}.`,
    };
  }

  const ini = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fin.getTime())) {
    return {
      definido: false,
      abierto: false,
      fechaInicio: null,
      fechaFin: null,
      mensaje: `No se ha definido el cronograma respectivo para la ${etiqueta}.`,
    };
  }

  const ahora = new Date();
  if (ahora < ini) {
    return {
      definido: true,
      abierto: false,
      fechaInicio: ini,
      fechaFin: fin,
      mensaje: `No está en el cronograma respectivo. El periodo de ${etiqueta} inicia el ${formatoFechaCronograma(ini)}.`,
    };
  }
  if (ahora > fin) {
    return {
      definido: true,
      abierto: false,
      fechaInicio: ini,
      fechaFin: fin,
      mensaje: `No está en el cronograma respectivo. El periodo de ${etiqueta} finalizó el ${formatoFechaCronograma(fin)}.`,
    };
  }

  return {
    definido: true,
    abierto: true,
    fechaInicio: ini,
    fechaFin: fin,
    mensaje: null,
  };
}
