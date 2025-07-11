import { Controller, Get, HttpStatus, Redirect } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    example: 'OK',
  })
  @Get('health')
  healthCheck(): string {
    return 'OK';
  }

  @ApiResponse({
    status: 308,
    description: 'Redirect',
    type: String,
    example: {
      message: 'Redirecting to documentation',
      statusCode: 308,
    },
  })
  @Get()
  @Redirect('docs', HttpStatus.PERMANENT_REDIRECT)
  index() {
    return { message: 'Redirecting to swagger docs' };
  }
}
