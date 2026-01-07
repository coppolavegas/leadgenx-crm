import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Get environment
  const environment = configService.get<string>('NODE_ENV', 'development');
  const isDevelopment = environment === 'development';
  
  // Configure CORS with environment-based origins
  const corsOriginsStr = configService.get<string>('CORS_ORIGINS', '');
  const allowedOrigins = corsOriginsStr ? corsOriginsStr.split(',').map(o => o.trim()) : [];
  
  // Production CORS: Restrict to leadgenx.app domains only
  const productionOrigins = [
    'https://leadgenx.app',
    'https://www.leadgenx.app',
    'https://api.leadgenx.app',
    ...allowedOrigins, // Allow additional origins from env var
  ];

  app.enableCors({
    origin: isDevelopment ? '*' : productionOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['Content-Disposition'],
  });

  logger.log(`CORS enabled for: ${isDevelopment ? '*' : productionOrigins.join(', ')}`);

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const logLevel = statusCode >= 400 ? 'warn' : 'log';
      
      logger[logLevel](
        `${method} ${originalUrl} ${statusCode} - ${duration}ms`,
      );
    });
    
    next();
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global API prefix for versioning
  app.setGlobalPrefix('v1', {
    exclude: ['health', 'ready', 'docs', 'docs-json'], // Exclude health and docs from versioning
  });

  // Swagger configuration
  const swaggerPath = 'docs';
  
  // Cache prevention middleware for Swagger
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('LeadGenX API')
    .setDescription(`
      Production-grade REST API for discovering and enriching business leads.
      
      **Authentication:** All API endpoints (except /health, /ready, and /docs) require an API key.
      Provide your API key in the \`X-API-Key\` header.
      
      **Rate Limits:** 100 requests per minute per API key.
      
      **Environments:**
      - Development: \`http://localhost:3000\`
      - Production: \`https://api.leadgenx.app\`
    `)
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.leadgenx.app', 'Production')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'X-API-Key')
    .addTag('Health', 'Health and readiness checks')
    .addTag('Auth', 'Organization and API key management')
    .addTag('Discovery', 'Lead discovery from Google Places and other sources')
    .addTag('Leads', 'Lead management and retrieval')
    .addTag('Enrichment', 'Lead enrichment with contact information')
    .addTag('Export', 'Export leads in various formats')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'LeadGenX API Documentation',
    customCss: `
      .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .info .title { font-size: 32px; color: #1a202c; font-weight: 600; }
      .swagger-ui .info .description { font-size: 15px; color: #4a5568; line-height: 1.6; margin-top: 12px; white-space: pre-line; }
      .swagger-ui .scheme-container { background: #f7fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0; }
      .swagger-ui .opblock { border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .swagger-ui .opblock .opblock-summary { padding: 12px 15px; }
      .swagger-ui .opblock.opblock-post { border-color: #48bb78; background: #f0fff4; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #48bb78; }
      .swagger-ui .opblock.opblock-get { border-color: #4299e1; background: #ebf8ff; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #4299e1; }
      .swagger-ui .opblock.opblock-patch { border-color: #ed8936; background: #fffaf0; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #ed8936; }
      .swagger-ui .opblock.opblock-delete { border-color: #f56565; background: #fff5f5; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f56565; }
      .swagger-ui .opblock-tag { font-size: 20px; color: #2d3748; font-weight: 600; margin: 25px 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
      .swagger-ui .btn { border-radius: 4px; font-weight: 500; }
      .swagger-ui .btn.execute { background-color: #4299e1; border-color: #4299e1; }
      .swagger-ui .btn.execute:hover { background-color: #3182ce; }
      .swagger-ui .btn.authorize { background-color: #48bb78; border-color: #48bb78; color: white; }
      .swagger-ui .btn.authorize:hover { background-color: #38a169; }
      .swagger-ui table thead tr th { color: #2d3748; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
      .swagger-ui .model-title { color: #2d3748; font-weight: 600; }
      .swagger-ui .parameter__name { color: #2d3748; font-weight: 500; }
      .swagger-ui .response-col_status { color: #2d3748; font-weight: 600; }
    `,
    customfavIcon: 'https://cdn-icons-png.flaticon.com/512/9850/9850774.png',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 LeadGenX API is running on http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/${swaggerPath}`);
  logger.log(`🏥 Health Check: http://localhost:${port}/health`);
  logger.log(`✅ Readiness Check: http://localhost:${port}/ready`);
  logger.log(`🔑 Environment: ${environment}`);
}

bootstrap();
