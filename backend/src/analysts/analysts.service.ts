import { Injectable } from '@nestjs/common';
import { EyeTestsService } from '../eye-tests/eye-tests.service';

@Injectable()
export class AnalystsService {
  constructor(private eyeTestsService: EyeTestsService) {}

  async getPendingTests() {
    return this.eyeTestsService.findPendingForAnalysis();
  }

  async analyzeTest(testId: string) {
    return this.eyeTestsService.runAIAnalysis(testId);
  }

  async addNotes(testId: string, notes: string, analystId: string) {
    return this.eyeTestsService.addAnalystNotes(testId, notes, analystId);
  }
}


