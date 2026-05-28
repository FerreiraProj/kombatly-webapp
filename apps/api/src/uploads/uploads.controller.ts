import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { UploadsService } from './uploads.service';
import { createDiskStorage, imageFileFilter, MAX_IMAGE_SIZE } from './multer.config';

@ApiTags('uploads')
@ApiBearerAuth()
@ApiSecurity('apiKey')
@UseGuards(JwtOrApiKeyGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private service: UploadsService) {}

  @Post('tournament/:id/flyer')
  @ApiOperation({ summary: 'Upload tournament flyer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Flyer uploaded, flyerUrl returned.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('tournaments'),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  uploadFlyer(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.saveTournamentFlyer(id, user.id, file);
  }

  @Post('club/:id/logo')
  @ApiOperation({ summary: 'Upload club logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Logo uploaded, logoUrl returned.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('clubs'),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  uploadClubLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.saveClubLogo(id, user.id, file);
  }
}
