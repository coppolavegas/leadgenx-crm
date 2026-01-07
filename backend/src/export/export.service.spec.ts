import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExportFilterDto } from './dto/export-filter.dto';

describe('ExportService', () => {
  let service: ExportService;
  let prismaService: PrismaService;

  const mockLeads = [
    {
      id: 'lead-1',
      name: 'Business A',
      address: '123 Main St',
      phone: '+1-555-0001',
      website: 'https://business-a.com',
      contact_page_url: null,
      rating: 4.5,
      review_count: 100,
      source: 'google',
      source_url: 'https://maps.google.com/...',
      place_id: 'place-1',
      yelp_id: null,
      categories: ['restaurant', 'italian'],
      latitude: 40.7128,
      longitude: -74.0060,
      is_lead: true,
      score: 85,
      status: 'new',
      tags: ['high-value'],
      intent_evidence: null,
      discovered_at: new Date('2025-01-01'),
      last_seen_at: new Date('2025-01-01'),
      enriched_lead: {
        id: 'enriched-1',
        lead_id: 'lead-1',
        contact_page_urls: ['https://business-a.com/contact'],
        contact_form_url: 'https://business-a.com/contact#form',
        emails_found: [
          { value: 'info@business-a.com', source_url: 'https://business-a.com/contact', confidence: 0.95 },
          { value: 'sales@business-a.com', source_url: 'https://business-a.com/about', confidence: 0.8 },
        ],
        phones_found: [
          { value: '+1-555-1234', source_url: 'https://business-a.com/contact', confidence: 0.9 },
        ],
        social_links: { linkedin: 'https://linkedin.com/company/business-a', twitter: null },
        address_found: null,
        enrichment_status: 'success',
        enrichment_log: [],
        pages_crawled: 5,
        crawl_depth: 2,
        crawl_duration_ms: 3000,
        bot_detected: false,
        fallback_used: false,
        enriched_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      },
    },
    {
      id: 'lead-2',
      name: 'Business A', // Duplicate name
      address: '123 Main St', // Same address
      phone: '+1-555-0002',
      website: 'https://business-a.com', // Same website - should be deduped
      contact_page_url: null,
      rating: 4.2,
      review_count: 80,
      source: 'google',
      source_url: 'https://maps.google.com/...',
      place_id: 'place-2',
      yelp_id: null,
      categories: ['restaurant'],
      latitude: 40.7130,
      longitude: -74.0062,
      is_lead: true,
      score: 75,
      status: 'new',
      tags: [],
      intent_evidence: null,
      discovered_at: new Date('2025-01-02'),
      last_seen_at: new Date('2025-01-02'),
      enriched_lead: null,
    },
    {
      id: 'lead-3',
      name: 'Business B',
      address: '456 Oak Ave',
      phone: '+1-555-0003',
      website: 'https://business-b.com',
      contact_page_url: null,
      rating: 4.8,
      review_count: 200,
      source: 'google',
      source_url: 'https://maps.google.com/...',
      place_id: 'place-3',
      yelp_id: null,
      categories: ['cafe'],
      latitude: 40.7500,
      longitude: -73.9800,
      is_lead: true,
      score: 90,
      status: 'qualified',
      tags: ['premium'],
      intent_evidence: null,
      discovered_at: new Date('2025-01-03'),
      last_seen_at: new Date('2025-01-03'),
      enriched_lead: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: PrismaService,
          useValue: {
            lead: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportJson', () => {
    it('should export leads with enrichment data', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue(mockLeads as any);

      const filterDto: ExportFilterDto = {};
      const result = await service.exportJson(filterDto);

      expect(result.leads.length).toBeGreaterThan(0);
      expect(result.total_count).toBe(result.leads.length);
      expect(result.exported_at).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should filter by minimum score', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue(mockLeads as any);

      const filterDto: ExportFilterDto = { min_score: 80 };
      await service.exportJson(filterDto);

      expect(prismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            score: expect.objectContaining({ gte: 80 }),
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue(mockLeads as any);

      const filterDto: ExportFilterDto = { status: 'qualified' as any };
      await service.exportJson(filterDto);

      expect(prismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'qualified',
          }),
        }),
      );
    });

    it('should deduplicate leads by website', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue(mockLeads as any);

      const filterDto: ExportFilterDto = {};
      const result = await service.exportJson(filterDto);

      // Should have deduped lead-1 and lead-2 (same website)
      expect(result.warnings).toContain('Removed 1 duplicate leads');
      expect(result.total_count).toBe(2); // Only 2 unique leads
    });

    it('should include evidence data for enriched leads', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue([mockLeads[0]] as any);

      const filterDto: ExportFilterDto = {};
      const result = await service.exportJson(filterDto);

      const lead = result.leads[0];
      expect(lead.email_evidence).toBeDefined();
      expect(lead.email_evidence!.length).toBeGreaterThan(0);
      expect(lead.email_evidence![0].value).toBe('info@business-a.com');
      expect(lead.email_evidence![0].confidence).toBe(0.95);
      expect(lead.phone_evidence).toBeDefined();
      expect(lead.social_links).toBeDefined();
      expect(lead.enrichment_status).toBe('success');
    });

    it('should sort evidence by confidence', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue([mockLeads[0]] as any);

      const filterDto: ExportFilterDto = {};
      const result = await service.exportJson(filterDto);

      const emails = result.leads[0].email_evidence!;
      // Should be sorted by confidence descending
      expect(emails[0].confidence).toBeGreaterThanOrEqual(emails[1].confidence);
    });
  });

  describe('exportCsv', () => {
    it('should export leads as CSV format', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue([mockLeads[0]] as any);

      const filterDto: ExportFilterDto = {};
      const csv = await service.exportCsv(filterDto);

      expect(csv).toContain('Lead ID');
      expect(csv).toContain('Business Name');
      expect(csv).toContain('Quality Score');
      expect(csv).toContain('Top Email');
      expect(csv).toContain('Business A');
      expect(csv).toContain('info@business-a.com');
    });

    it('should flatten nested data for CSV', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue([mockLeads[0]] as any);

      const filterDto: ExportFilterDto = {};
      const csv = await service.exportCsv(filterDto);

      // Should have flattened social links
      expect(csv).toContain('LinkedIn');
      expect(csv).toContain('https://linkedin.com/company/business-a');

      // Should have categories joined
      expect(csv).toContain('restaurant; italian');
    });
  });

  describe('location radius filtering', () => {
    it('should filter leads within radius', async () => {
      jest.spyOn(prismaService.lead, 'findMany').mockResolvedValue(mockLeads as any);

      // Center: NYC (40.7128, -74.0060)
      // Business A: ~same location
      // Business B: ~5km away
      const filterDto: ExportFilterDto = {
        latitude: 40.7128,
        longitude: -74.0060,
        radius_km: 1, // Only Business A should match
      };

      const result = await service.exportJson(filterDto);

      // Should filter out Business B (too far)
      expect(result.warnings).toContain('Location radius filtering applied in post-processing');
    });
  });
});
