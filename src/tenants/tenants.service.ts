import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) {}
    async getTenant(id: string) {
        return this.prisma.tenant.findUnique({
        where: { id },
        include: {
            brand: true,
            config: {
            include: {
                emailProviders: true,
            },
            },
        },
        });
    }
    
    async createTenant(createTenantDto: { id: string, name: string, externalId: string }) {
    // Validate required fields
    if (!createTenantDto.id?.trim()) {
      throw new BadRequestException('Tenant ID is required and cannot be empty');
    }
    if (!createTenantDto.name?.trim()) {
      throw new BadRequestException('Tenant name is required and cannot be empty');
    }
    if (!createTenantDto.externalId?.trim()) {
      throw new BadRequestException('External ID is required and cannot be empty');
    }

    // Validate field formats
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    if (!idPattern.test(createTenantDto.id)) {
      throw new BadRequestException('Tenant ID can only contain letters, numbers, hyphens, and underscores');
    }
    
    // Check length constraints
    if (createTenantDto.id.length > 50) {
      throw new BadRequestException('Tenant ID cannot be longer than 50 characters');
    }
    if (createTenantDto.name.length > 255) {
      throw new BadRequestException('Tenant name cannot be longer than 255 characters');
    }
    if (createTenantDto.externalId.length > 100) {
      throw new BadRequestException('External ID cannot be longer than 100 characters');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            id: createTenantDto.id,
            name: createTenantDto.name,
            externalId: createTenantDto.externalId,
          },
        });
        

        // Create empty config for tenant
        await tx.tenantConfig.create({
          data: {
            tenantId: tenant.id,
          },
        });

        console.log(`✅ Successfully created tenant: ${tenant.id} (${tenant.name})`);
        return tenant;
      });
    } catch (error) {
      console.error('❌ Failed to create tenant:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const target = error.meta?.target;
          const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
          if (targetStr.includes('id') && !targetStr.includes('externalId')) {
            throw new ConflictException(`Tenant with ID '${createTenantDto.id}' already exists`);
          } else if (targetStr.includes('externalId')) {
            throw new ConflictException(`Tenant with external ID '${createTenantDto.externalId}' already exists`);
          } else {
            throw new ConflictException('Tenant with this information already exists');
          }
        } else if (error.code === 'P2025') {
          // Record not found (shouldn't happen in create, but good to handle)
          throw new BadRequestException('Failed to create tenant: Required related record not found');
        } else if (error.code === 'P2003') {
          // Foreign key constraint violation
          throw new BadRequestException('Failed to create tenant: Invalid reference to related record');
        }
      }
      
      // Generic error (including transaction rollback errors)
      throw new InternalServerErrorException(`Failed to create tenant: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async findTenantByExternalId(externalId: string) {
      return this.prisma.tenant.findUnique({
        where: { externalId },
      });
  }
  

}
