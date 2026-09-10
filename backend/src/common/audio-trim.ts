import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

/** Máximo de duración de la pista Chacha-Warmi (desde el inicio). */
export const PISTA_MP3_MAX_SEGUNDOS = 60;

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * Recorta un MP3 a los primeros `maxSegundos` segundos (in-place vía archivo temporal).
 * Si falla el recorte, deja el original y lanza error controlable.
 */
export async function trimMp3ToMaxSeconds(
  absolutePath: string,
  maxSegundos: number = PISTA_MP3_MAX_SEGUNDOS,
): Promise<{ trimmed: boolean; path: string }> {
  if (!fs.existsSync(absolutePath)) {
    throw new Error('Archivo de audio no encontrado para recortar.');
  }
  if (!ffmpegPath) {
    throw new Error('ffmpeg no está disponible en el servidor.');
  }

  const ext = path.extname(absolutePath) || '.mp3';
  const tmpOut = absolutePath.replace(new RegExp(`${ext.replace('.', '\\.')}$`, 'i'), `.trim${ext}`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(absolutePath)
      .setStartTime(0)
      .duration(maxSegundos)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .outputOptions(['-y'])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(tmpOut);
  });

  // Reemplazar original
  fs.unlinkSync(absolutePath);
  fs.renameSync(tmpOut, absolutePath);
  return { trimmed: true, path: absolutePath };
}

/** Extrae la serie/código del nombre en disco (ej. insc-1715-123 → insc-1715-123). */
export function serieDesdeNombreArchivo(filename: string): string {
  const base = String(filename || '')
    .split(/[/\\]/)
    .pop() || '';
  return base.replace(/\.[^.]+$/, '') || 'archivo';
}
