import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) { 
    try {
      const parsed = this.schema.parse(value);
      return parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        
        throw new BadRequestException({
          message: 'Validation failed',
          statusCode: 400,
          errors: validationError,
        });
      }
      
      throw new BadRequestException('Validation failed');
    }
  }
}