import { INestApplication, Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Module({})
export class SwaggerSetupModule {
  static setup(app: INestApplication) {
    const config = new DocumentBuilder()
      .setTitle('Task Management API')
      .setDescription(`
        API Gateway para o sistema de gerenciamento de tarefas.
        
        1. Faça login ou registre-se usando os endpoints de autenticação
        2. Copie o \`access_token\` da resposta
        3. Clique no botão Authorize no topo da página
        4. Cole o token no campo (sem precisar digitar "Bearer")
        5. Clique em Authorize e depois Close
        6. Agora todas as requisições autenticadas funcionarão automaticamente
      `)
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('tasks', 'Task management endpoints')
      .addTag('comments', 'Task comments endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Cole seu JWT token aqui (sem "Bearer")',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Task Management API Docs',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }
}
