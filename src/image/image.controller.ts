import {
  Controller,
  Header,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { merge } from 'merge-pdf-buffers';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @Header('Content-Type', 'application/pdf')
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() response,
  ) {
    const pdfBuffer = await this.imageService.processPdf(files);

    await response.send(await merge(pdfBuffer));
  }
}
