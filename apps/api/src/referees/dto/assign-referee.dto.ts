import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RefereeRole } from '@taekwombats/database';

export class AssignRefereeDto {
  @ApiProperty({ description: 'User ID of the referee' })
  @IsString()
  refereeId: string;

  @ApiProperty({ enum: RefereeRole, default: RefereeRole.MAIN })
  @IsEnum(RefereeRole)
  role: RefereeRole;
}
