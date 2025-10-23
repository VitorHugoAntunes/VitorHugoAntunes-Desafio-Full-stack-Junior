import { Injectable, BadRequestException, ValidationPipe } from '@nestjs/common';

@Injectable()
export class ClassValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));

        return new BadRequestException({
          message: 'Validation failed',
          statusCode: 400,
          errors: messages,
        });
      },
    });
  }
}