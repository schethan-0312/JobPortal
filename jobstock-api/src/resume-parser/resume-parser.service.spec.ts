import { Test, TestingModule } from '@nestjs/testing';
import { ResumeParserService } from './resume-parser.service';

describe('ResumeParserService', () => {
  let service: ResumeParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResumeParserService],
    }).compile();

    service = module.get<ResumeParserService>(ResumeParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
