import { Test, TestingModule } from '@nestjs/testing';
import { RunController } from './run.controller';
import { RunService } from './run.service';

describe('RunController', () => {
  let controller: RunController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunController],
      providers: [RunService],
    }).compile();

    controller = module.get<RunController>(RunController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
