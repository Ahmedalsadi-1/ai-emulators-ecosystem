// backend/src/services/VisualTestingService.ts
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import {
  VisualTest,
  PixelDifference,
  ScreenshotData,
  TestStatus
} from '../../../shared/types/automation.types';

export class VisualTestingService {
  async createVisualTest(
    name: string,
    workflowId: string,
    baselineScreenshot: string,
    currentScreenshot: string,
    threshold: number = 0.1
  ): Promise<VisualTest> {
    const test: VisualTest = {
      id: this.generateId(),
      name,
      workflowId,
      baselineScreenshot,
      currentScreenshot,
      differences: [],
      threshold,
      status: 'pending',
      createdAt: new Date(),
    };

    // Run the comparison
    const result = await this.compareScreenshots(test);
    return result;
  }

  async compareScreenshots(test: VisualTest): Promise<VisualTest> {
    try {
      // Decode base64 screenshots
      const baselineBuffer = Buffer.from(test.baselineScreenshot, 'base64');
      const currentBuffer = Buffer.from(test.currentScreenshot, 'base64');

      // Get image metadata
      const [baselineMeta, currentMeta] = await Promise.all([
        sharp(baselineBuffer).metadata(),
        sharp(currentBuffer).metadata()
      ]);

      // Ensure images have the same dimensions
      const width = Math.min(baselineMeta.width!, currentMeta.width!);
      const height = Math.min(baselineMeta.height!, currentMeta.height!);

      // Resize images to match if needed
      const [baselinePng, currentPng] = await Promise.all([
        this.bufferToPng(baselineBuffer, width, height),
        this.bufferToPng(currentBuffer, width, height)
      ]);

      // Create diff image
      const diff = new PNG({ width, height });

      // Compare pixels
      const pixelDifferences = pixelmatch(
        baselinePng.data,
        currentPng.data,
        diff.data,
        width,
        height,
        { threshold: test.threshold }
      );

      // Calculate difference percentage
      const totalPixels = width * height;
      const diffPercentage = pixelDifferences / totalPixels;

      // Generate diff image as base64
      const diffBuffer = PNG.sync.write(diff);
      const diffBase64 = diffBuffer.toString('base64');

      // Determine test status
      const status: TestStatus = diffPercentage <= test.threshold ? 'pass' : 'fail';

      // Extract pixel-level differences
      const differences = this.extractPixelDifferences(
        baselinePng.data,
        currentPng.data,
        width,
        height,
        test.threshold
      );

      return {
        ...test,
        differences,
        status,
        executedAt: new Date(),
        diffImage: diffBase64,
        diffPercentage,
        pixelDifferences,
      } as VisualTest;

    } catch (error) {
      console.error('Screenshot comparison failed:', error);
      return {
        ...test,
        status: 'error',
        executedAt: new Date(),
      };
    }
  }

  async compareWithBaseline(
    workflowId: string,
    currentScreenshot: string,
    threshold: number = 0.1
  ): Promise<VisualTest | null> {
    // TODO: Get baseline screenshot for workflow
    const baselineScreenshot = await this.getBaselineScreenshot(workflowId);

    if (!baselineScreenshot) {
      return null; // No baseline to compare against
    }

    return this.createVisualTest(
      `Workflow ${workflowId} Visual Test`,
      workflowId,
      baselineScreenshot,
      currentScreenshot,
      threshold
    );
  }

  async updateBaseline(workflowId: string, newBaseline: string): Promise<boolean> {
    // TODO: Update baseline screenshot for workflow
    // This would typically save to a database
    console.log(`Updating baseline for workflow ${workflowId}`);
    return true;
  }

  async getTestHistory(workflowId: string): Promise<VisualTest[]> {
    // TODO: Retrieve test history from database
    return [];
  }

  private async bufferToPng(buffer: Buffer, width: number, height: number): Promise<PNG> {
    const png = new PNG({ width, height });
    const resizedBuffer = await sharp(buffer)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toBuffer();

    const tempPng = PNG.sync.read(resizedBuffer);
    png.data = tempPng.data;
    return png;
  }

  private extractPixelDifferences(
    baselineData: Buffer,
    currentData: Buffer,
    width: number,
    height: number,
    threshold: number
  ): PixelDifference[] {
    const differences: PixelDifference[] = [];

    // Sample every 10th pixel for performance
    const sampleRate = 10;

    for (let y = 0; y < height; y += sampleRate) {
      for (let x = 0; x < width; x += sampleRate) {
        const idx = (y * width + x) * 4;

        const baselineR = baselineData[idx];
        const baselineG = baselineData[idx + 1];
        const baselineB = baselineData[idx + 2];

        const currentR = currentData[idx];
        const currentG = currentData[idx + 1];
        const currentB = currentData[idx + 2];

        // Calculate color difference
        const diff = Math.sqrt(
          Math.pow(baselineR - currentR, 2) +
          Math.pow(baselineG - currentG, 2) +
          Math.pow(baselineB - currentB, 2)
        ) / (255 * Math.sqrt(3)); // Normalize to 0-1

        if (diff > threshold) {
          differences.push({
            x,
            y,
            expectedColor: `rgb(${baselineR}, ${baselineG}, ${baselineB})`,
            actualColor: `rgb(${currentR}, ${currentG}, ${currentB})`,
            difference: diff,
          });
        }

        // Limit to first 100 differences for performance
        if (differences.length >= 100) {
          break;
        }
      }
      if (differences.length >= 100) {
        break;
      }
    }

    return differences;
  }

  private async getBaselineScreenshot(workflowId: string): Promise<string | null> {
    // TODO: Implement baseline retrieval from database/storage
    return null;
  }

  private generateId(): string {
    return `vt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const visualTestingService = new VisualTestingService();