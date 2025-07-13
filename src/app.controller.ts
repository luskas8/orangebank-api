import { Controller, Get, HttpStatus, Redirect } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health & Info')
@Controller()
export class AppController {
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Simple health check to verify API is running and responsive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful - API is running',
    schema: {
      type: 'string',
      example: 'OK',
    },
  })
  @Get('health')
  healthCheck(): string {
    return 'OK';
  }

  @ApiOperation({
    summary: 'Root endpoint redirect',
    description: 'Redirects root requests to the API documentation.',
  })
  @ApiResponse({
    status: 308,
    description: 'Permanent redirect to API documentation',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Redirecting to swagger docs',
        },
        statusCode: {
          type: 'number',
          example: 308,
        },
      },
    },
  })
  @Get()
  @Redirect('docs', HttpStatus.PERMANENT_REDIRECT)
  index() {
    return { message: 'Redirecting to swagger docs' };
  }
}
