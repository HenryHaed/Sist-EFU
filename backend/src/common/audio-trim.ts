import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

/** Máximo de duración de la pista Chacha-Warmi (desde el inicio). */
export const PISTA_MP3_MAX_SEGUNDOS = 60;

/**
 * Resuelve la ruta al binario ffmpeg:
 * 1) paquete npm `ffmpeg-static` (si el install script descargó el binario)
 * 2) `ffmpeg` del sistema (PATH), p.ej. apt install ffmpeg
 */
export function resolveFfmpegBinary(): string | null {
  const fromPkg = typeof ffmpegStatic === 'string' ? ffmpegStatic : null;
  if (fromPkg && fs.existsSync(fromPkg)) {
    try {
      fs.accessSync(fromPkg, fs.constants.X_OK);
      return fromPkg;
    } catch {
      // existe pero sin permiso de ejecución: aún puede servir vía node spawn en algunos OS
      return fromPkg;
    }
  }

  try {
    const which = execFileSync('which', ['ffmpeg'], { encoding: 'utf8' }).trim();
    if (which && fs.existsSync(which)) return which;
  } catch {
    /* no está en PATH */
  }

  return null;
}

let cachedFfmpegPath: string | null | undefined;

function getFfmpegPath(): string | null {
  if (cachedFfmpegPath === undefined) {
    cachedFfmpegPath = resolveFfmpegBinary();
    if (cachedFfmpegPath) {
      ffmpeg.setFfmpegPath(cachedFfmpegPath);
    }
  }
  return cachedFfmpegPath;
}

/**
 * Recorta un MP3 a los primeros `maxSegundos` segundos (in-place vía archivo temporal).
 */
export async function trimMp3ToMaxSeconds(
  absolutePath: string,
  maxSegundos: number = PISTA_MP3_MAX_SEGUNDOS,
): Promise<{ trimmed: boolean; path: string }> {
  if (!fs.existsSync(absolutePath)) {
    throw new Error('Archivo de audio no encontrado para recortar.');
  }

  const bin = getFfmpegPath();
  if (!bin) {
    throw new Error(
      'ffmpeg no está disponible en el servidor. Instala el paquete del sistema (apt install ffmpeg) o reinstala la dependencia npm (cd backend && npm rebuild ffmpeg-static).',
    );
  }

  const ext = path.extname(absolutePath) || '.mp3';
  const tmpOut = absolutePath.replace(
    new RegExp(`${ext.replace('.', '\\.')}$`, 'i'),
    `.trim${ext}`,
  );

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
