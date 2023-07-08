import { Injectable } from '@nestjs/common';
import * as htmlToPdf from 'html-pdf-node';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  getPagina = (imagesWithOutBg, bg, isFirstPage) => {
    let imagesHtmlBg = '';

    for (const image of imagesWithOutBg) {
      const cod = image.originalname.split('.');
      imagesHtmlBg += `<div class="one-of-three">
        <div class="img-box">
            <div class="img" style=" background-image: url('data:application/pdf;base64,${Buffer.from(
              image.buffer,
            ).toString('base64')}');"></div>
            <span class="text-cod">COD: ${cod[0]}</span>
        </div>
    </div>`;
    }

    return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <title>Product Catalogue</title>
        <meta charset="utf-8">
        <style type="text/css">
            @font-face {
                font-family: Inter;
                src: url(./fonts/Inter/static/Inter-Regular.ttf);
            }
    
            body {
                font-family: Inter;
                margin: 0;
                font-size: 0;
                text-align: center;
                margin: 0 auto;
            }
    
            .img-body {
                background-image: url('data:application/pdf;base64,${Buffer.from(
                  bg,
                ).toString('base64')}');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                display: block;
            }
    
            .one-of-three {
                width: 33.33%;
                display: inline-block;
                padding: 12px 0;
            }
    
            .img-box {
                width: 6.67cm;
                margin: 0 auto;
                text-align: left;
            }
    
            .img {
                width: 100%;
                height: 3.14cm;
                margin-bottom: 3px;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
            }
    
            .text-cod {
                font-size: 12px;
            }
        </style>
        <!-- CSS only -->
        <!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous"> -->
    </head>
    
    <body>
        <div class="bg-primary img-body" style="width: 21cm;height: 29.7cm;">
            <div style="padding-top: ${isFirstPage ? '238' : '78'}px;">
               ${imagesHtmlBg}
            </div>
        </div>
    </body>
    
    </html>`;
  };

  imageResize = (bufferImage, width) => {
    return sharp(bufferImage)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .toFormat('jpeg')
      .resize({ width: width })
      .toBuffer();
  };

  async processPdf(files) {
    const imageCatalogueWidth = 360;
    let bg = files.find((file) => file.originalname === 'img-body.png')?.buffer;
    let bg2 = files.find(
      (file) => file.originalname === 'img-body-2.png',
    )?.buffer;

    if (bg) {
      bg = await this.imageResize(bg, imageCatalogueWidth * 3);
    } else {
      return;
    }

    if (bg2) {
      bg2 = await this.imageResize(bg2, imageCatalogueWidth * 3);
    }

    const imagesWithOutBg = files.filter(
      (file) =>
        file.originalname !== 'img-body.png' &&
        file.originalname !== 'img-body-2.png',
    );

    for (const image of imagesWithOutBg) {
      console.log(image.originalname);
      image.buffer = await this.imageResize(image.buffer, imageCatalogueWidth);
    }

    const resultado = [];

    while (imagesWithOutBg.length > 0) {
      if (!bg2 || resultado.length === 0) {
        resultado.push(imagesWithOutBg.splice(0, 15));
      } else {
        resultado.push(imagesWithOutBg.splice(0, 18));
      }
    }

    const pdfBuffer = [];
    for (let idx = 0; idx < resultado.length; idx++) {
      const isFirstPage = !bg2 || idx === 0;
      const content = Buffer.from(
        this.getPagina(resultado[idx], isFirstPage ? bg : bg2, isFirstPage),
      ).toString('utf8');
      pdfBuffer.push(
        await htmlToPdf.generatePdf(
          { content: content },
          {
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: {
              top: '0px',
              bottom: '0px',
              right: '0px',
              left: '0px',
            },
          },
        ),
      );
    }
    return pdfBuffer;
  }
}
