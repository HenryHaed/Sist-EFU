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
  COSTOS = 'costos',
}

export enum OrdenReporte {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ConsultarReporteDto {
  @IsEnum(TipoReporte)
  tipoReporte: TipoReporte;

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
}
