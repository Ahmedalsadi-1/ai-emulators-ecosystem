// backend/src/services/ElementDetectionService.ts
import axios from 'axios';
import { DetectedElement, Platform, BoundingBox } from '../../../shared/types/automation.types';

export class ElementDetectionService {
  private openInterfaceUrl: string;
  private factifUrl: string;

  constructor() {
    this.openInterfaceUrl = process.env.OPENINTERFACE_URL || 'http://localhost:8000';
    this.factifUrl = process.env.FACTIF_URL || 'http://localhost:3001';
  }

  async detectElements(platform: Platform, screenshot?: string): Promise<DetectedElement[]> {
    switch (platform) {
      case 'desktop':
        return this.detectDesktopElements();
      case 'web':
        return this.detectWebElements(screenshot);
      case 'mobile':
        return this.detectMobileElements();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async detectDesktopElements(): Promise<DetectedElement[]> {
    try {
      // Use OpenInterface for desktop element detection
      const response = await axios.post(`${this.openInterfaceUrl}/api/elements/detect`, {
        platform: 'desktop',
        includeScreenshot: true,
      }, {
        timeout: 10000,
      });

      return this.normalizeElements(response.data.elements || [], 'desktop');
    } catch (error) {
      console.error('Desktop element detection failed:', error);
      return [];
    }
  }

  private async detectWebElements(screenshot?: string): Promise<DetectedElement[]> {
    try {
      // Use Factif AI OmniParser for web element detection
      const response = await axios.post(`${this.factifUrl}/api/elements/detect`, {
        platform: 'web',
        screenshot: screenshot,
        useOmniParser: true,
      }, {
        timeout: 15000,
      });

      return this.normalizeElements(response.data.elements || [], 'web');
    } catch (error) {
      console.error('Web element detection failed:', error);
      return [];
    }
  }

  private async detectMobileElements(): Promise<DetectedElement[]> {
    // TODO: Implement mobile element detection
    // This could integrate with Appium or similar mobile automation tools
    return [];
  }

  async detectElementAt(platform: Platform, x: number, y: number, screenshot?: string): Promise<DetectedElement | null> {
    const elements = await this.detectElements(platform, screenshot);
    return elements.find(element =>
      x >= element.coordinates.x &&
      x <= element.coordinates.x + element.coordinates.width &&
      y >= element.coordinates.y &&
      y <= element.coordinates.y + element.coordinates.height
    ) || null;
  }

  async getElementProperties(platform: Platform, elementId: string): Promise<Record<string, any>> {
    try {
      switch (platform) {
        case 'desktop':
          const desktopResponse = await axios.get(`${this.openInterfaceUrl}/api/elements/${elementId}/properties`);
          return desktopResponse.data.properties || {};
        case 'web':
          const webResponse = await axios.get(`${this.factifUrl}/api/elements/${elementId}/properties`);
          return webResponse.data.properties || {};
        default:
          return {};
      }
    } catch (error) {
      console.error('Element properties retrieval failed:', error);
      return {};
    }
  }

  private normalizeElements(elements: any[], platform: Platform): DetectedElement[] {
    return elements.map(element => ({
      id: element.id || this.generateElementId(),
      type: this.normalizeElementType(element.type),
      platform,
      coordinates: this.normalizeBoundingBox(element.coordinates || element.bbox),
      properties: element.properties || {},
      confidence: element.confidence || 0.8,
      screenshot: element.screenshot,
      timestamp: new Date(),
    }));
  }

  private normalizeElementType(type: string): DetectedElement['type'] {
    const typeMap: Record<string, DetectedElement['type']> = {
      'button': 'button',
      'input': 'input',
      'text': 'text',
      'image': 'image',
      'link': 'link',
      'select': 'dropdown',
      'container': 'container',
      'div': 'container',
      // Add more mappings as needed
    };

    return typeMap[type.toLowerCase()] || 'container';
  }

  private normalizeBoundingBox(bbox: any): BoundingBox {
    if (Array.isArray(bbox)) {
      // OmniParser format: [left, top, width, height] normalized coordinates
      return {
        x: bbox[0] * 100, // Convert to actual pixels (assuming screen width context)
        y: bbox[1] * 100,
        width: bbox[2] * 100,
        height: bbox[3] * 100,
      };
    } else {
      // Standard format
      return {
        x: bbox.x || 0,
        y: bbox.y || 0,
        width: bbox.width || 0,
        height: bbox.height || 0,
      };
    }
  }

  private generateElementId(): string {
    return `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const elementDetectionService = new ElementDetectionService();