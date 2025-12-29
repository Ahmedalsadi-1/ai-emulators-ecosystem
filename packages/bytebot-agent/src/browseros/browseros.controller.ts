import { Controller, Get, Post, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * BrowserOS Controller
 * Handles BrowserOS screen controller integration
 */
@Controller('browseros')
export class BrowserOSController {
  constructor(private readonly configService: ConfigService) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async connectBrowserOS(): Promise<{ success: boolean; message: string }> {
    try {
      // Validate BYTEBOT_DESKTOP_BASE_URL is set
      const desktopUrl = process.env.BYTEBOT_DESKTOP_BASE_URL || 'http://localhost:9990';

      // Make direct call to computer-use service to launch BrowserOS
      const response = await fetch(`${desktopUrl}/computer-use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'application',
          application: 'browseros',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `Failed to launch BrowserOS: ${response.status} ${errorText}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: 'BrowserOS launched successfully',
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to connect to BrowserOS: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getBrowserOSStatus(): Promise<{ connected: boolean; status: string }> {
    try {
      const desktopUrl = process.env.BYTEBOT_DESKTOP_BASE_URL || 'http://localhost:9990';

      // Check if BrowserOS service is reachable
      const response = await fetch(`${desktopUrl}/computer-use/status`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          connected: data.connected || false,
          status: data.status || 'unknown',
        };
      }

      return {
        connected: false,
        status: 'Service unavailable',
      };
    } catch (error: any) {
      return {
        connected: false,
        status: error.message || 'Error checking status',
      };
    }
  }
}
