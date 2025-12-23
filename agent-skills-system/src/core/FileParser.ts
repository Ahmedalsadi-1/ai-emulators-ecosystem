import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import yaml from 'js-yaml';
import { marked } from 'marked';
import {
  ParseResult,
  ParseError,
  FileMetadata
} from '../types';

/**
 * File Parsing Infrastructure
 * Handles YAML frontmatter extraction and Markdown content processing
 */
export class FileParser {
  private static readonly FRONTMATTER_DELIMITER = '---';

  /**
   * Parse a Markdown file with YAML frontmatter
   */
  static async parseFile<T>(filePath: string): Promise<ParseResult<T>> {
    try {
      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // Get file metadata
      const stats = await fs.promises.stat(filePath);
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      const metadata: FileMetadata = {
        path: filePath,
        lastModified: stats.mtime,
        size: stats.size,
        checksum
      };

      // Parse content
      return this.parseContent<T>(content, metadata);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [{
          type: 'structure',
          message: `Failed to read file: ${errorMessage}`,
          path: filePath
        }]
      };
    }
  }

  /**
   * Parse content string with YAML frontmatter
   */
  static parseContent<T>(content: string, metadata?: FileMetadata): ParseResult<T> {
    const errors: ParseError[] = [];

    try {
      // Extract frontmatter and body
      const { frontmatter, body, frontmatterRange } = this.extractFrontmatter(content);

      if (!frontmatter) {
        errors.push({
          type: 'structure',
          message: 'No YAML frontmatter found. Files must start with ---',
          line: 1,
          column: 1
        });
        return { success: false, errors };
      }

      // Parse YAML frontmatter
      let parsedFrontmatter: any;
      try {
        parsedFrontmatter = yaml.load(frontmatter, { schema: yaml.CORE_SCHEMA }) as T;
      } catch (yamlError: any) {
        const location = this.extractYamlErrorLocation(yamlError, frontmatter);
        errors.push({
          type: 'yaml',
          message: `YAML parsing error: ${yamlError.message}`,
          line: location.line + frontmatterRange.start,
          column: location.column,
          context: location.context
        });
        return { success: false, errors };
      }

      // Parse Markdown body
      let parsedBody: string;
      try {
        parsedBody = marked.parse(body) as string;
      } catch (markdownError: any) {
        errors.push({
          type: 'markdown',
          message: `Markdown parsing error: ${markdownError.message}`
        });
        return { success: false, errors };
      }

      // Validate structure
      const validationErrors = this.validateStructure(parsedFrontmatter);
      errors.push(...validationErrors);

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return {
        success: true,
        data: {
          ...parsedFrontmatter,
          content: body.trim(),
          htmlContent: parsedBody,
          metadata
        } as T,
        errors: []
      };

    } catch (error: any) {
      errors.push({
        type: 'structure',
        message: `Unexpected parsing error: ${error.message}`
      });
      return { success: false, errors };
    }
  }

  /**
   * Serialize data back to Markdown with YAML frontmatter
   */
  static serialize<T extends { content?: string; htmlContent?: string }>(data: T): string {
    // Extract content and remove it from frontmatter data
    const { content, htmlContent, ...frontmatterData } = data;

    // Serialize frontmatter to YAML
    const frontmatter = yaml.dump(frontmatterData, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: true
    });

    // Combine frontmatter and content
    const result = [
      this.FRONTMATTER_DELIMITER,
      frontmatter.trim(),
      this.FRONTMATTER_DELIMITER,
      '',
      content || ''
    ].join('\n');

    return result;
  }

  /**
   * Write a domain object to file (creates YAML frontmatter + markdown content)
   */
  static async writeDomainObject<T>(
    filePath: string,
    data: T,
    content: string = ''
  ): Promise<ParseResult<void>> {
    try {
      // Serialize frontmatter to YAML
      const frontmatter = yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: true
      });

      // Combine frontmatter and content
      const fileContent = [
        this.FRONTMATTER_DELIMITER,
        frontmatter.trim(),
        this.FRONTMATTER_DELIMITER,
        '',
        content
      ].join('\n');

      await fs.promises.writeFile(filePath, fileContent, 'utf-8');

      // Verify the file can be parsed back
      const verifyResult = await this.parseFile<T>(filePath);
      if (!verifyResult.success) {
        return {
          success: false,
          errors: [{
            type: 'validation',
            message: 'File verification failed after writing',
            path: filePath
          }]
        };
      }

      return { success: true, errors: [] };
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          type: 'structure',
          message: `Failed to write domain object: ${error.message}`,
          path: filePath
        }]
      };
    }
  }

  /**
   * Write parsed data back to file (round-trip consistency)
   */
  static async writeFile<T extends { content?: string; htmlContent?: string }>(
    filePath: string,
    data: T
  ): Promise<ParseResult<void>> {
    try {
      const serialized = this.serialize(data);
      await fs.promises.writeFile(filePath, serialized, 'utf-8');

      // Verify round-trip consistency
      const verifyResult = await this.parseFile<T>(filePath);
      if (!verifyResult.success) {
        return {
          success: false,
          errors: [{
            type: 'validation',
            message: 'Round-trip consistency check failed',
            path: filePath
          }]
        };
      }

      return { success: true, errors: [] };
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          type: 'structure',
          message: `Failed to write file: ${error.message}`,
          path: filePath
        }]
      };
    }
  }

  /**
   * Extract YAML frontmatter from content
   */
  private static extractFrontmatter(content: string): {
    frontmatter: string | null;
    body: string;
    frontmatterRange: { start: number; end: number };
  } {
    const lines = content.split('\n');
    const frontmatterRange = { start: 0, end: 0 };

    // Check if content starts with frontmatter delimiter
    if (lines[0]?.trim() !== this.FRONTMATTER_DELIMITER) {
      return {
        frontmatter: null,
        body: content,
        frontmatterRange
      };
    }

    // Find the closing delimiter
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === this.FRONTMATTER_DELIMITER) {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      return {
        frontmatter: null,
        body: content,
        frontmatterRange
      };
    }

    frontmatterRange.start = 1;
    frontmatterRange.end = endIndex;

    const frontmatter = lines.slice(1, endIndex).join('\n');
    const body = lines.slice(endIndex + 1).join('\n');

    return {
      frontmatter: frontmatter.trim(),
      body: body.trim(),
      frontmatterRange
    };
  }

  /**
   * Extract error location from YAML parsing error
   */
  private static extractYamlErrorLocation(error: any, frontmatter: string): {
    line: number;
    column: number;
    context: string;
  } {
    // Default location
    let line = 1;
    let column = 1;
    let context = '';

    // Try to extract line/column from error message
    const lineMatch = error.message.match(/line (\d+)/i);
    const columnMatch = error.message.match(/column (\d+)/i);

    if (lineMatch) {
      line = parseInt(lineMatch[1]);
    }

    if (columnMatch) {
      column = parseInt(columnMatch[1]);
    }

    // Extract context around the error
    const lines = frontmatter.split('\n');
    if (line <= lines.length) {
      const errorLine = lines[line - 1];
      const start = Math.max(0, column - 20);
      const end = Math.min(errorLine.length, column + 20);
      context = errorLine.substring(start, end);
    }

    return { line, column, context };
  }

  /**
   * Validate basic file structure
   */
  private static validateStructure(data: any): ParseError[] {
    const errors: ParseError[] = [];

    // Check for required top-level fields
      if (!data || typeof data !== 'object') {
        errors.push({
          type: 'validation',
          message: 'Frontmatter must be a valid object'
        });
        return errors;
      }

      // Check for common required fields (these will be validated by specific parsers)
      const requiredFields = ['id', 'name', 'version'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          errors.push({
            type: 'validation',
            message: `Missing required field: ${field}`
          });
        }
      }

    return errors;
  }

  /**
   * Create template file content
   */
  static createTemplate(type: 'agent' | 'skill', data: Record<string, any> = {}): string {
    const templates = {
      agent: {
        id: data.id || 'agent-id',
        name: data.name || 'Agent Name',
        version: data.version || '1.0.0',
        personality: {
          communicationStyle: 'conversational',
          decisionMaking: 'analytical',
          adaptability: 7,
          creativity: 6,
          empathy: 8,
          humor: 3,
          traits: ['helpful', 'precise', 'adaptable']
        },
        capabilities: {
          domains: ['general'],
          expertise: { general: 5 },
          limitations: [],
          preferredTools: [],
          languages: ['en']
        },
        configuration: {
          maxConcurrentTasks: 5,
          timeoutSettings: {
            taskTimeout: 300,
            skillTimeout: 60,
            responseTimeout: 30
          },
          retryPolicy: {
            maxRetries: 3,
            backoffStrategy: 'exponential',
            backoffMultiplier: 2
          },
          resourceLimits: {
            memoryLimit: 512,
            cpuLimit: 80,
            networkLimit: 1000
          },
          logging: {
            level: 'info',
            includeSensitiveData: false,
            retentionDays: 30
          }
        },
        skills: [],
        skillProficiencies: {},
        metadata: {
          author: 'Your Name',
          description: 'Agent description',
          tags: ['agent'],
          category: 'assistant',
          changelog: ['Initial version']
        }
      },
      skill: {
        id: data.id || 'skill-id',
        name: data.name || 'Skill Name',
        version: data.version || '1.0.0',
        category: data.category || 'utility',
        description: 'Skill description',
        dependencies: [],
        prerequisites: [],
        compatibility: {
          platforms: ['node'],
          environments: ['development', 'production'],
          agentTypes: ['assistant']
        },
        implementation: {
          type: 'function',
          language: 'typescript',
          entryPoint: 'index.ts',
          runtime: 'node'
        },
        parameters: [],
        outputs: [],
        usage: {
          examples: [],
          tutorials: [],
          bestPractices: [],
          commonPatterns: [],
          performance: {
            averageExecutionTime: 100,
            memoryUsage: 50,
            successRate: 95
          }
        },
        metadata: {
          author: 'Your Name',
          maintainers: ['Your Name'],
          license: 'MIT',
          repository: '',
          documentation: '',
          changelog: ['Initial version'],
          tags: ['skill'],
          category: 'utility',
          difficulty: 'intermediate',
          stability: 'stable'
        }
      }
    };

    const template = templates[type];
    return this.serialize(template as any);
  }

  /**
   * Validate file exists and is accessible
   */
  static async validateFile(filePath: string): Promise<ParseResult<FileMetadata>> {
    try {
      const stats = await fs.promises.stat(filePath);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      const metadata: FileMetadata = {
        path: filePath,
        lastModified: stats.mtime,
        size: stats.size,
        checksum
      };

      return { success: true, data: metadata, errors: [] };
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          type: 'structure',
          message: `File validation failed: ${error.message}`,
          path: filePath
        }]
      };
    }
  }

  /**
   * Get file extension for type
   */
  static getFileExtension(type: 'agent' | 'skill'): string {
    return '.md';
  }

  /**
   * Generate file path for entity
   */
  static generateFilePath(basePath: string, type: 'agent' | 'skill', id: string): string {
    const subdir = type === 'agent' ? 'agents' : 'skills';
    const filename = `${id}${this.getFileExtension(type)}`;
    return path.join(basePath, subdir, filename);
  }
}