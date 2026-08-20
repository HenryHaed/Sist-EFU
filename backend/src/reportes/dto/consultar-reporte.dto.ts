import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoReporte {
  FRATERNIDADES = 'fraternidades',
  DIRECTIVA = 'directiva',
  CALIFICACIONES = 'calificaciones',
  DISCIPLINA = 'disciplina',
  COSTOS = 'costos',
}

/** Filtro de banderas / sanciones (una fila por caso) */
export enum TipoIncidenciaReporte {
  TODOS = 'todos',
  AMARILLA = 'AMARILLA',
  ROJA = 'ROJA',
  SANCION_ALCOHOL = 'SANCION_ALCOHOL',
  SANCION_AGRESION = 'SANCION_AGRESION',
  SANCION_BANDA = 'SANCION_BANDA',
  SANCION_AJENO = 'SANCION_AJENO',
  BANDERAS = 'BANDERAS',
  SANCIONES_GRAVES = 'SANCIONES_GRAVES',
}

/** Alcance del listado de fraternidades / preinscripciones */
export enum AlcanceListadoFraternidades {
  INSCRITAS = 'inscritas',
  PENDIENTES = 'pendientes',
  OBSERVADAS = 'observadas',
  TODOS = 'todos',
}

export enum OrdenReporte {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ConsultarReporteDto {
  @IsEnum(TipoReporte)
  tipoReporte: TipoReporte;

  @IsOptional()
  @IsEnum(AlcanceListadoFraternidades)
  alcanceListado?: AlcanceListadoFraternidades;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idGestion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idTipoDanza?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idFacultad?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idCarrera?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idCategoria?: number;

  @IsOptional()
  @IsString()
  instanciaRepresentacion?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @IsOptional()
  @IsEnum(OrdenReporte)
  orden?: OrdenReporte;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  soloHabilitadas?: boolean;

  @IsOptional()
  @IsEnum(TipoIncidenciaReporte)
  tipoIncidencia?: TipoIncidenciaReporte;

  /**
   * Columnas opcionales del reporte de fraternidades.
   * Si no se envían, el PDF/tabla no incluyen Cupo, Estado ni Gestión.
   */
  @IsOptional()
  columnasOpcionales?: Array<'cupo' | 'estado' | 'gestion'>;
}
