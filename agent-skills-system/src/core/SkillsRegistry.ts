import * as fs from 'fs';
import * as path from 'path';
import {
  SkillDefinition,
  ValidationResult,
  SystemConfiguration,
  ProficiencyLevel
} from '../types';
import { FileParser } from './FileParser';
import { ValidationEngine } from './ValidationEngine';

/**
 * Skills Registry System
 * Comprehensive catalog for skills.md files with dependency resolution,
 * circular reference detection, search/filtering capabilities, and proficiency level management
 */
export class SkillsRegistry {
  private config: SystemConfiguration;
  private skills: Map<string, SkillDefinition> = new Map();
  private loadedSkills: Set<string> = new Set();
  private dependencyGraph: Map<string, string[]> = new Map(); // skillId -> dependent skill IDs
  private reverseDependencyGraph: Map<string, string[]> = new Map(); // skillId -> skills that depend on it

  constructor(config: SystemConfiguration) {
    this.config = config;
  }

  /**
   * Initialize the skills registry
   */
  async initialize(): Promise<void> {
    // Ensure skills directory exists
    const skillsDir = path.join(this.config.basePath, this.config.skillsPath);
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    // Build initial dependency graphs
    await this.buildDependencyGraphs();
  }

  /**
   * Load skill definition with progressive disclosure
   */
  async loadSkill(id: string, includeDependencies: boolean = false): Promise<SkillDefinition> {
    // Check if skill is already loaded
    if (this.skills.has(id) && this.loadedSkills.has(id)) {
      return this.skills.get(id)!;
    }

    const skillPath = this.getSkillPath(id);

    // Parse skill file
    const result = await FileParser.parseFile<SkillDefinition>(skillPath);
    if (!result.success) {
      throw new Error(`Failed to load skill ${id}: ${result.errors.map(e => e.message).join(', ')}`);
    }

    let skill = result.data!;

    // Validate skill
    const validation = ValidationEngine.validateSkill(skill);
    if (!validation.isValid) {
      throw new Error(`Invalid skill ${id}: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Load dependencies if requested
    if (includeDependencies) {
      skill = await this.loadSkillDependencies(skill);
    }

    // Cache skill
    this.skills.set(id, skill);
    this.loadedSkills.add(id);

    // Update dependency graphs
    await this.updateDependencyGraphs(skill);

    return skill;
  }

  /**
   * Load skill dependencies (progressive disclosure)
   */
  private async loadSkillDependencies(skill: SkillDefinition): Promise<SkillDefinition> {
    // Dependencies are already defined in the skill file
    // This method can be extended to validate and preload dependency details
    for (const dep of skill.dependencies) {
      try {
        await this.loadSkill(dep.skillId);
      } catch (error) {
        // Log warning but don't fail - dependency might not be available yet
        // console.warn(`Warning: Could not load dependency ${dep.skillId} for skill ${skill.id}`);
      }
    }
    return skill;
  }

  /**
   * Save skill definition
   */
  async saveSkill(skill: SkillDefinition): Promise<void> {
    // Validate before saving
    const validation = ValidationEngine.validateSkill(skill);
    if (!validation.isValid) {
      throw new Error(`Cannot save invalid skill: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const skillPath = this.getSkillPath(skill.id);

    // Serialize and save
    const result = await FileParser.writeFile(skillPath, {
      ...skill,
      content: skill.description, // Use description as content
      htmlContent: undefined
    });
    if (!result.success) {
      throw new Error(`Failed to save skill ${skill.id}: ${result.errors.map(e => e.message).join(', ')}`);
    }

    // Update cache and graphs
    this.skills.set(skill.id, skill);
    this.loadedSkills.add(skill.id);
    await this.updateDependencyGraphs(skill);
  }

  /**
   * Create new skill definition
   */
  async createSkill(skillData: Omit<SkillDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<SkillDefinition> {
    const id = this.generateSkillId(skillData.name);
    const now = new Date();

    const skill: SkillDefinition = {
      ...skillData,
      id,
      createdAt: now,
      updatedAt: now
    };

    await this.saveSkill(skill);
    return skill;
  }

  /**
   * Update skill definition
   */
  async updateSkill(id: string, updates: Partial<SkillDefinition>): Promise<SkillDefinition> {
    const skill = await this.loadSkill(id, true);

    const updatedSkill: SkillDefinition = {
      ...skill,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    await this.saveSkill(updatedSkill);
    return updatedSkill;
  }

  /**
   * Delete skill definition
   */
  async deleteSkill(id: string): Promise<void> {
    const skillPath = this.getSkillPath(id);

    try {
      await fs.promises.unlink(skillPath);
    } catch (error) {
      throw new Error(`Failed to delete skill ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Remove from cache and graphs
    this.skills.delete(id);
    this.loadedSkills.delete(id);
    this.dependencyGraph.delete(id);
    this.reverseDependencyGraph.delete(id);

    // Remove this skill from other skills' dependency graphs
    for (const [dependentId, deps] of this.dependencyGraph) {
      const filteredDeps = deps.filter(depId => depId !== id);
      this.dependencyGraph.set(dependentId, filteredDeps);
    }

    for (const [skillId, dependents] of this.reverseDependencyGraph) {
      const filteredDependents = dependents.filter(depId => depId !== id);
      this.reverseDependencyGraph.set(skillId, filteredDependents);
    }
  }

  /**
   * List all skill definitions (metadata only for performance)
   */
  async listSkills(): Promise<Array<{ id: string; name: string; version: string; category: string }>> {
    const skillsDir = path.join(this.config.basePath, this.config.skillsPath);

    try {
      const files = await fs.promises.readdir(skillsDir);
      const skillFiles = files.filter((f: string) => f.endsWith('.md'));

      const skills = await Promise.all(
        skillFiles.map(async (file: string) => {
          const id = path.basename(file, '.md');
          try {
            const skillPath = path.join(skillsDir, file);
            const result = await FileParser.parseFile<SkillDefinition>(skillPath);

            if (result.success && result.data) {
              return {
                id,
                name: result.data.name,
                version: result.data.version,
                category: result.data.category
              };
            }
          } catch (error) {
            // Skip invalid files
          }
          return null;
        })
      );

      return skills.filter(Boolean) as Array<{ id: string; name: string; version: string; category: string }>;
    } catch (error) {
      throw new Error(`Failed to list skills: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search and filter skills
   */
  async searchSkills(filters: SkillSearchFilters): Promise<SkillDefinition[]> {
    const allSkills = await this.loadAllSkills();
    let results = [...allSkills.values()];

    // Apply filters
    if (filters.category) {
      results = results.filter(skill => skill.category === filters.category);
    }

    if (filters.subcategory) {
      results = results.filter(skill => skill.subcategory === filters.subcategory);
    }

    if (filters.difficulty) {
      results = results.filter(skill => skill.metadata.difficulty === filters.difficulty);
    }

    if (filters.stability) {
      results = results.filter(skill => skill.metadata.stability === filters.stability);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(skill =>
        filters.tags!.some(tag => skill.metadata.tags.includes(tag))
      );
    }

    if (filters.name) {
      const nameRegex = new RegExp(filters.name, 'i');
      results = results.filter(skill => nameRegex.test(skill.name));
    }

    if (filters.description) {
      const descRegex = new RegExp(filters.description, 'i');
      results = results.filter(skill => descRegex.test(skill.description));
    }

    if (filters.platforms && filters.platforms.length > 0) {
      results = results.filter(skill =>
        filters.platforms!.some(platform => skill.compatibility.platforms.includes(platform))
      );
    }

    if (filters.agentTypes && filters.agentTypes.length > 0) {
      results = results.filter(skill =>
        filters.agentTypes!.some(type => skill.compatibility.agentTypes.includes(type))
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'category':
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          case 'difficulty':
            const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
            aValue = difficultyOrder[a.metadata.difficulty];
            bValue = difficultyOrder[b.metadata.difficulty];
            break;
          case 'createdAt':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          case 'updatedAt':
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const startIndex = filters.offset || 0;
    const endIndex = startIndex + (filters.limit || results.length);
    results = results.slice(startIndex, endIndex);

    return results;
  }

  /**
   * Resolve skill dependencies
   */
  async resolveSkillDependencies(skillId: string): Promise<SkillDefinition[]> {
    const resolved = new Map<string, SkillDefinition>();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    await this.resolveDependenciesRecursive(skillId, resolved, visited, recursionStack);
    return Array.from(resolved.values());
  }

  /**
   * Get skills that depend on the given skill
   */
  async getDependentSkills(skillId: string): Promise<SkillDefinition[]> {
    const dependentIds = this.reverseDependencyGraph.get(skillId) || [];
    const dependents: SkillDefinition[] = [];

    for (const id of dependentIds) {
      try {
        const skill = await this.loadSkill(id);
        dependents.push(skill);
      } catch (error) {
        // Skip skills that can't be loaded
      }
    }

    return dependents;
  }

  /**
   * Check for circular dependencies
   */
  async detectCircularDependencies(): Promise<ValidationResult> {
    return ValidationEngine.validateSkillDependencyGraph(this.skills);
  }

  /**
   * Validate skill compatibility with agent
   */
  async checkSkillCompatibility(skill: SkillDefinition, agentCapabilities: {
    domains: string[];
    preferredTools: string[];
    category: string;
  }): Promise<{ compatible: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // Check agent type compatibility
    const agentTypeCompatible = skill.compatibility.agentTypes.some(type =>
      agentCapabilities.domains.includes(type) ||
      agentCapabilities.category === type
    );

    if (!agentTypeCompatible) {
      reasons.push(`Incompatible agent types: required ${skill.compatibility.agentTypes.join(', ')}`);
    }

    // Check platform compatibility
    const platformCompatible = skill.compatibility.platforms.some(platform =>
      agentCapabilities.preferredTools.some(tool =>
        tool.toLowerCase().includes(platform.toLowerCase())
      )
    );

    if (!platformCompatible && skill.compatibility.platforms.length > 0) {
      reasons.push(`No compatible platforms found among: ${skill.compatibility.platforms.join(', ')}`);
    }

    return {
      compatible: reasons.length === 0,
      reasons
    };
  }

  /**
   * Get proficiency level requirements for a skill
   */
  async getSkillProficiencyRequirements(skillId: string): Promise<{
    minimumLevel: ProficiencyLevel;
    recommendedLevel: ProficiencyLevel;
    reasons: string[];
  }> {
    const skill = await this.loadSkill(skillId);

    // Base requirements on skill difficulty
    const difficultyLevels = {
      beginner: { min: 1, rec: 2 },
      intermediate: { min: 2, rec: 4 },
      advanced: { min: 3, rec: 5 },
      expert: { min: 4, rec: 6 }
    };

    const levels = difficultyLevels[skill.metadata.difficulty];
    const reasons = [
      `Skill difficulty: ${skill.metadata.difficulty}`,
      `Performance requirements: ${skill.usage.performance.averageExecutionTime}ms avg execution time`
    ];

    return {
      minimumLevel: levels.min as ProficiencyLevel,
      recommendedLevel: levels.rec as ProficiencyLevel,
      reasons
    };
  }

  /**
   * Validate skill definition
   */
  async validateSkill(skill: SkillDefinition): Promise<ValidationResult> {
    return ValidationEngine.validateSkill(skill);
  }

  /**
   * Get skill statistics
   */
  getSkillStats(): {
    total: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    byStability: Record<string, number>;
  } {
    const stats = {
      total: this.skills.size,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byStability: {} as Record<string, number>
    };

    for (const skill of this.skills.values()) {
      // Category stats
      stats.byCategory[skill.category] = (stats.byCategory[skill.category] || 0) + 1;

      // Difficulty stats
      stats.byDifficulty[skill.metadata.difficulty] = (stats.byDifficulty[skill.metadata.difficulty] || 0) + 1;

      // Stability stats
      stats.byStability[skill.metadata.stability] = (stats.byStability[skill.metadata.stability] || 0) + 1;
    }

    return stats;
  }

  // Private methods

  private async loadAllSkills(): Promise<Map<string, SkillDefinition>> {
    const skillsDir = path.join(this.config.basePath, this.config.skillsPath);

    try {
      const files = await fs.promises.readdir(skillsDir);
      const skillFiles = files.filter((f: string) => f.endsWith('.md'));

      for (const file of skillFiles) {
        const id = path.basename(file, '.md');
        if (!this.skills.has(id)) {
          try {
            await this.loadSkill(id);
          } catch (error) {
            // Skip invalid skills
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }

    return this.skills;
  }

  private async buildDependencyGraphs(): Promise<void> {
    await this.loadAllSkills();

    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();

    for (const skill of this.skills.values()) {
      await this.updateDependencyGraphs(skill);
    }
  }

  private async updateDependencyGraphs(skill: SkillDefinition): Promise<void> {
    // Update forward dependencies (what this skill depends on)
    const deps = skill.dependencies.map(dep => dep.skillId);
    this.dependencyGraph.set(skill.id, deps);

    // Update reverse dependencies (what depends on this skill)
    for (const depId of deps) {
      const dependents = this.reverseDependencyGraph.get(depId) || [];
      if (!dependents.includes(skill.id)) {
        dependents.push(skill.id);
        this.reverseDependencyGraph.set(depId, dependents);
      }
    }
  }

  private async resolveDependenciesRecursive(
    skillId: string,
    resolved: Map<string, SkillDefinition>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): Promise<void> {
    visited.add(skillId);
    recursionStack.add(skillId);

    const skill = await this.loadSkill(skillId);

    for (const dep of skill.dependencies) {
      const depId = dep.skillId;

      // Check for circular dependency
      if (recursionStack.has(depId)) {
        throw new Error(`Circular dependency detected: ${skillId} -> ${depId}`);
      }

      if (!visited.has(depId)) {
        await this.resolveDependenciesRecursive(depId, resolved, visited, recursionStack);
      }
    }

    resolved.set(skillId, skill);
    recursionStack.delete(skillId);
  }

  private generateSkillId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getSkillPath(skillId: string): string {
    return path.join(this.config.basePath, this.config.skillsPath, `${skillId}.md`);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.skills.clear();
    this.loadedSkills.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
  }
}

/**
 * Search and filter options for skills
 */
export interface SkillSearchFilters {
  category?: string;
  subcategory?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  stability?: 'experimental' | 'stable' | 'deprecated';
  tags?: string[];
  name?: string; // regex pattern
  description?: string; // regex pattern
  platforms?: string[];
  agentTypes?: string[];
  sortBy?: 'name' | 'category' | 'difficulty' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}