import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Fraternidad } from '../entities/Fraternidad';
import { Gestion } from '../entities/Gestion';
import { Usuario } from '../entities/Usuario';
import { SolicitudInscripcion, EstadoSolicitud } from '../entities/SolicitudInscripcion';
import { CreateFraternidadDto, UpdateFraternidadDto } from './dto/fraternidad.dto';
import { findGestionActivaOrLatest } from '../common/gestion.utils';
import { drawPdfInstitutionalHeader } from '../common/pdf-layout';
import { buildMiembrosDirectiva } from '../common/personas-directiva';

@Injectable()
export class FraternidadesService {
  constructor(
    @InjectRepository(Fraternidad)
    private readonly fraternidadRepo: Repository<Fraternidad>,
    @InjectRepository(Gestion)
    private readonly gestionRepo: Repository<Gestion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(SolicitudInscripcion)
    private readonly solicitudRepo: Repository<SolicitudInscripcion>,
  ) {}

  async getGestionActiva() {
    return findGestionActivaOrLatest(this.gestionRepo);
  }

  async findAll() {
    const gestion = await this.getGestionActiva();
    return this.fraternidadRepo.find({
      where: {
        habilitadoEfu: true,
        ...(gestion ? { gestion: { idGestion: gestion.idGestion } } : {}),
      },
      relations: ['facultad', 'carrera', 'institucionExterna', 'categoria', 'tipoDanza'],
      order: { nombre: 'ASC' },
    });
  }

  async buscar(q: string) {
    const query = q.trim();
    const qb = this.fraternidadRepo
      .createQueryBuilder('fraternidad')
      .leftJoinAndSelect('fraternidad.gestion', 'gestion')
      .leftJoinAndSelect('fraternidad.facultad', 'facultad')
      .leftJoinAndSelect('fraternidad.carrera', 'carrera')
      .leftJoinAndSelect('carrera.facultad', 'carreraFacultad')
      .leftJoinAndSelect('fraternidad.institucionExterna', 'institucionExterna')
      .leftJoinAndSelect('fraternidad.categoria', 'categoria')
      .where('fraternidad.habilitado_efu = true');

    if (query.length > 0) {
      qb.andWhere(
        '(LOWER(fraternidad.nombre) LIKE LOWER(:q) OR LOWER(fraternidad.nivelRepresentacion) LIKE LOWER(:q) OR LOWER(facultad.nombre) LIKE LOWER(:q) OR LOWER(carrera.nombre) LIKE LOWER(:q) OR LOWER(institucionExterna.nombre) LIKE LOWER(:q))',
        { q: `%${query}%` },
      );
    }

    const fraternidades = await qb
      .orderBy('gestion.activa', 'DESC')
      .addOrderBy('gestion.anio', 'DESC')
      .addOrderBy('fraternidad.nombre', 'ASC')
      .take(20)
      .getMany();

    return fraternidades.map(fraternidad => ({
      idFraternidad: fraternidad.idFraternidad,
      nombre: fraternidad.nombre,
      nivelRepresentacion: fraternidad.nivelRepresentacion,
      gestionAnio: fraternidad.gestion?.anio || null,
      gestionActiva: !!fraternidad.gestion?.activa,
      etiqueta: this.formatearEtiquetaFraternidad(fraternidad),
    }));
  }

  private formatearEtiquetaFraternidad(fraternidad: Fraternidad) {
    const nivel = (fraternidad.nivelRepresentacion || '').trim();
    const facultad = fraternidad.facultad?.nombre?.trim();
    const carrera = fraternidad.carrera?.nombre?.trim();
    const institucion = fraternidad.institucionExterna?.nombre?.trim();

    if (nivel === 'Carrera') {
      const partes = [facultad || 'Facultad no definida', carrera || 'Carrera no definida'];
      return partes.join(' - ');
    }

    if (nivel === 'Facultad') {
      return facultad || 'Facultad no definida';
    }

    if (nivel === 'UMSA') {
      return 'Nivel UMSA';
    }

    if (nivel === 'Externo') {
      return institucion ? `Externo - ${institucion}` : 'Externo';
    }

    if (nivel) {
      return nivel;
    }

    if (facultad && carrera) {
      return `${facultad} - ${carrera}`;
    }

    if (facultad) {
      return facultad;
    }

    if (institucion) {
      return `Externo - ${institucion}`;
    }

    return fraternidad.nivelRepresentacion || 'General';
  }

  async findOne(id: number) {
    const fraternidad = await this.fraternidadRepo.findOne({
      where: { idFraternidad: id },
      relations: ['facultad', 'carrera', 'institucionExterna', 'categoria'],
    });

    if (!fraternidad) {
      throw new NotFoundException(`Fraternidad con ID ${id} no encontrada`);
    }
    return fraternidad;
  }

  async create(createDto: CreateFraternidadDto) {
    const { idFacultad, idCarrera, idInstitucionExterna, idCategoria, ...data } = createDto;
    const gestion = await this.getGestionActiva();

    const fraternidad = this.fraternidadRepo.create({
      ...data,
      facultad: idFacultad ? { idFacultad } as any : null,
      carrera: idCarrera ? { idCarrera } as any : null,
      institucionExterna: idInstitucionExterna ? { idInstitucion: idInstitucionExterna } as any : null,
      categoria: { idCategoria } as any,
      gestion: gestion ? { idGestion: gestion.idGestion } as any : null
    });

    return this.fraternidadRepo.save(fraternidad);
  }

  async update(id: number, updateDto: UpdateFraternidadDto) {
    const fraternidad = await this.findOne(id);
    const { idFacultad, idCarrera, idInstitucionExterna, idCategoria, ...data } = updateDto;

    const updateData: any = { ...data };
    if (idFacultad !== undefined) updateData.facultad = idFacultad ? { idFacultad } : null;
    if (idCarrera !== undefined) updateData.carrera = idCarrera ? { idCarrera } : null;
    if (idInstitucionExterna !== undefined) updateData.institucionExterna = idInstitucionExterna ? { idInstitucion: idInstitucionExterna } : null;
    if (idCategoria !== undefined) updateData.categoria = { idCategoria };

    Object.assign(fraternidad, updateData);
    return this.fraternidadRepo.save(fraternidad);
  }

  async remove(id: number) {
    const fraternidad = await this.findOne(id);

    // 1. Desligar usuarios que apuntan a esta fraternidad
    await this.usuarioRepo
      .createQueryBuilder()
      .update()
      .set({ fraternidad: null })
      .where('id_fraternidad = :id', { id })
      .execute();

    // 2. Desligar solicitudes de inscripcion que referencian esta fraternidad como creada
    await this.solicitudRepo
      .createQueryBuilder()
      .update()
      .set({ fraternidadCreada: null })
      .where('id_fraternidad_creada = :id', { id })
      .execute();

    await this.fraternidadRepo.remove(fraternidad);
    return { message: 'Fraternidad eliminada con exito' };
  }

  private async obtenerSolicitudDirectiva(idFraternidad: number) {
    const fraternidad = await this.fraternidadRepo.findOne({
      where: { idFraternidad },
      relations: ['categoria', 'tipoDanza', 'facultad', 'carrera', 'institucionExterna', 'gestion'],
    });
    if (!fraternidad) {
      throw new NotFoundException(`Fraternidad con ID ${idFraternidad} no encontrada`);
    }

    const solicitud = await this.solicitudRepo.findOne({
      where: {
        fraternidadCreada: { idFraternidad },
        estado: EstadoSolicitud.APROBADO,
      },
      relations: ['gestion', 'categoria', 'facultad', 'carrera', 'institucionExterna', 'delegado'],
      order: { updatedAt: 'DESC' },
    });

    if (!solicitud) {
      throw new NotFoundException(
        'No hay una inscripción aprobada con directiva registrada para esta fraternidad.',
      );
    }

    return { fraternidad, solicitud };
  }

  private instanciaLabel(solicitud: SolicitudInscripcion) {
    if (solicitud.facultad?.nombre) return `Facultad: ${solicitud.facultad.nombre}`;
    if (solicitud.carrera?.nombre) return `Carrera: ${solicitud.carrera.nombre}`;
    if (solicitud.nombreInstitucionExterna) return `Externo: ${solicitud.nombreInstitucionExterna}`;
    return solicitud.instanciaRepresentacion || '—';
  }

  async getDirectiva(idFraternidad: number) {
    const { fraternidad, solicitud } = await this.obtenerSolicitudDirectiva(idFraternidad);
    const miembros = buildMiembrosDirectiva(solicitud);

    if (miembros.length === 0) {
      throw new NotFoundException('La solicitud aprobada no contiene datos de directiva.');
    }

    return {
      fraternidad: {
        idFraternidad: fraternidad.idFraternidad,
        nombre: fraternidad.nombre,
        tipoDanza: fraternidad.tipoDanza?.nombre || null,
        categoria: fraternidad.categoria?.nombre,
        nivelRepresentacion: fraternidad.nivelRepresentacion,
        gestionAnio: fraternidad.gestion?.anio || solicitud.gestion?.anio,
      },
      solicitud: {
        idSolicitud: solicitud.idSolicitud,
        fechaAprobacion: solicitud.updatedAt,
        instancia: this.instanciaLabel(solicitud),
        delegado: solicitud.delegado
          ? {
              nombre: [solicitud.delegado.nombres, solicitud.delegado.primerApellido]
                .filter(Boolean)
                .join(' '),
              ci: solicitud.delegado.ci,
              correo: solicitud.delegado.correo,
            }
          : null,
      },
      miembros,
    };
  }

  async generarPdfDirectiva(idFraternidad: number, res: Response) {
    const data = await this.getDirectiva(idFraternidad);
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });

    const nombreArchivo = `Directiva_${data.fraternidad.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    doc.pipe(res);

    const { contentStartY } = drawPdfInstitutionalHeader(doc, 'REPORTE OFICIAL DE DIRECTIVA');

    let y = contentStartY;
    doc.fontSize(12).fillColor('#003399').font('Helvetica-Bold').text('DATOS DE LA FRATERNIDAD', 50, y);
    y += 20;

    const infoLines = [
      ['Fraternidad', data.fraternidad.nombre],
      ['Tipo de danza', data.fraternidad.tipoDanza || '—'],
      ['Categoría', data.fraternidad.categoria || '—'],
      ['Instancia', data.solicitud.instancia],
      ['Gestión', String(data.fraternidad.gestionAnio || '—')],
      ['Solicitud N°', String(data.solicitud.idSolicitud)],
    ];

    infoLines.forEach(([label, value]) => {
      doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold').text(`${label}:`, 50, y, { width: 90 });
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica').text(String(value), 145, y, { width: 400 });
      y += 16;
    });

    y += 10;
    doc.fontSize(12).fillColor('#003399').font('Helvetica-Bold').text('INTEGRANTES DE LA DIRECTIVA', 50, y);
    y += 18;

    const colCargo = 50;
    const colNombre = 175;
    const colCi = 370;
    const colCel = 460;
    const rowH = 18;

    const drawTableHeader = (startY: number) => {
      doc.save();
      doc.rect(50, startY, 495, rowH).fill('#003399');
      doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('Cargo', colCargo + 4, startY + 5, { width: 115 });
      doc.text('Nombre completo', colNombre + 4, startY + 5, { width: 185 });
      doc.text('CI', colCi + 4, startY + 5, { width: 80 });
      doc.text('Celular', colCel + 4, startY + 5, { width: 75 });
      doc.restore();
      return startY + rowH;
    };

    y = drawTableHeader(y);

    data.miembros.forEach((m, i) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
        doc.fontSize(9).fillColor('#003399').font('Helvetica-Bold').text(`Directiva — ${data.fraternidad.nombre}`, 50, y);
        y += 22;
        y = drawTableHeader(y);
      }

      if (i % 2 === 0) {
        doc.save().rect(50, y, 495, rowH).fill('#f8fafc').restore();
      }

      doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold').text(m.cargo, colCargo + 4, y + 5, { width: 115 });
      doc.font('Helvetica').text(m.nombre || '—', colNombre + 4, y + 5, { width: 185 });
      doc.text(m.ci || '—', colCi + 4, y + 5, { width: 80 });
      doc.text(m.celular || '—', colCel + 4, y + 5, { width: 75 });
      y += rowH;
    });

    y += 24;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(8).fillColor('#64748b').font('Helvetica-Oblique');
    doc.text(
      `Documento generado el ${new Date().toLocaleString('es-BO')} — La Comisión de la Entrada Folklórica Universitaria`,
      50,
      y,
      { width: 495, align: 'center' },
    );

    doc.end();
  }
}
