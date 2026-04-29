import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Controller('archivos')
export class ArchivosController {
  
  @Get('fases/:filename')
  serveFaseImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'img_Fases', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Imagen no encontrada');
    }
    return res.sendFile(filePath);
  }

  @Get('criterios/:filename')
  serveCriterioImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'img_Criterios', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Imagen no encontrada');
    }
    return res.sendFile(filePath);
  }

  @Get('gestion/:filename')
  serveGestionImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'img_Gestion', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Imagen no encontrada');
    }
    return res.sendFile(filePath);
  }
}
