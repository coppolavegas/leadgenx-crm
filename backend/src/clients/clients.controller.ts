import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req: any, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.organizationId, createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients for the organization' })
  @ApiResponse({ status: 200, description: 'List of clients' })
  findAll(@Request() req: any) {
    return this.clientsService.findAll(req.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific client by ID' })
  @ApiResponse({ status: 200, description: 'Client details' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.clientsService.findOne(req.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.organizationId, id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.clientsService.remove(req.organizationId, id);
  }
}
