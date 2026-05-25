import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private service: UploadsService) {}
}
