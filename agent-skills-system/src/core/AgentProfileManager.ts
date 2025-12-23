import * as fs from 'fs';
import * as path from 'path';
import {
  AgentProfile,
  AgentSkill,
  ProficiencyLevel,
  ValidationResult,
  SystemConfiguration
} from '../types';
import { FileParser } from './FileParser';
import { ValidationEngine } from './ValidationEngine';

/**
 * Agent Profile Manager
 * Handles loading, saving, and managing agent profiles with progressive disclosure
 */
export class AgentProfileManager {
  private config: SystemConfiguration;
  private agents: Map<string, AgentProfile> = new Map();
  private loadedAgents: Set<string> = new Set(); // Track which agents are fully loaded

  constructor(config: SystemConfiguration) {
    this.config = config;
  }

  /**
   * Initialize the agent profile manager
   */
  async initialize(): Promise<void> {
    // Ensure agents directory exists
    const agentsDir = path.join(this.config.basePath, this.config.agentsPath);
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }
  }

  /**
   * Load agent profile with progressive disclosure
   * Only loads the information that's actually needed
   */
  async loadAgent(id: string, includeSkills: boolean = false): Promise<AgentProfile> {
    // Check if agent is already loaded
    if (this.agents.has(id) && this.loadedAgents.has(id)) {
      return this.agents.get(id)!;
    }

    const agentPath = this.getAgentPath(id);

    // Parse agent file
    const result = await FileParser.parseFile<AgentProfile>(agentPath);
    if (!result.success) {
      throw new Error(`Failed to load agent ${id}: ${result.errors.map(e => e.message).join(', ')}`);
    }

    let agent = result.data!;

    // Validate agent
    const validation = ValidationEngine.validateAgent(agent);
    if (!validation.isValid) {
      throw new Error(`Invalid agent ${id}: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Load skills if requested
    if (includeSkills) {
      agent = await this.loadAgentSkills(agent);
    }

    // Cache agent
    this.agents.set(id, agent);
    this.loadedAgents.add(id);

    return agent;
  }

  /**
   * Load agent skills (progressive disclosure)
   */
  private async loadAgentSkills(agent: AgentProfile): Promise<AgentProfile> {
    // Skills are already loaded in the agent file
    // This method can be extended to load additional skill details if needed
    return agent;
  }

  /**
   * Save agent profile
   */
  async saveAgent(agent: AgentProfile): Promise<void> {
    // Validate before saving
    const validation = ValidationEngine.validateAgent(agent);
    if (!validation.isValid) {
      throw new Error(`Cannot save invalid agent: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const agentPath = this.getAgentPath(agent.id);

    // Serialize and save
    const dataToSave = { ...agent, content: '', htmlContent: '' };
    const result = await FileParser.writeFile(agentPath, dataToSave);
    if (!result.success) {
      throw new Error(`Failed to save agent ${agent.id}: ${result.errors.map(e => e.message).join(', ')}`);
    }

    // Update cache
    this.agents.set(agent.id, agent);
    this.loadedAgents.add(agent.id);
  }

  /**
   * Create new agent profile
   */
  async createAgent(agentData: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentProfile> {
    const id = this.generateAgentId(agentData.name);
    const now = new Date();

    const agent: AgentProfile = {
      ...agentData,
      id,
      createdAt: now,
      updatedAt: now
    };

    await this.saveAgent(agent);
    return agent;
  }

  /**
   * Update agent profile
   */
  async updateAgent(id: string, updates: Partial<AgentProfile>): Promise<AgentProfile> {
    const agent = await this.loadAgent(id, true);

    const updatedAgent: AgentProfile = {
      ...agent,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    await this.saveAgent(updatedAgent);
    return updatedAgent;
  }

  /**
   * Delete agent profile
   */
  async deleteAgent(id: string): Promise<void> {
    const agentPath = this.getAgentPath(id);

    try {
      await fs.promises.unlink(agentPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list agents: ${errorMessage}`);
    }

    // Remove from cache
    this.agents.delete(id);
    this.loadedAgents.delete(id);
  }

  /**
   * List all agent profiles (metadata only for performance)
   */
  async listAgents(): Promise<Array<{ id: string; name: string; version: string }>> {
    const agentsDir = path.join(this.config.basePath, this.config.agentsPath);

    try {
      const files = await fs.promises.readdir(agentsDir);
      const agentFiles = files.filter(f => f.endsWith('.md'));

      const agents = await Promise.all(
        agentFiles.map(async (file) => {
          const id = path.basename(file, '.md');
          try {
            // Load just the metadata for performance
            const agentPath = path.join(agentsDir, file);
            const result = await FileParser.parseFile<AgentProfile>(agentPath);

            if (result.success && result.data) {
              return {
                id,
                name: result.data.name,
                version: result.data.version
              };
            }
          } catch (error) {
            // Skip invalid files
          }
          return null;
        })
      );

      return agents.filter(Boolean) as Array<{ id: string; name: string; version: string }>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read file: ${errorMessage}`);
    }
  }

  /**
   * Assign skill to agent
   */
  async assignSkillToAgent(agentId: string, skillId: string, proficiency: ProficiencyLevel): Promise<void> {
    const agent = await this.loadAgent(agentId, true);

    // Check if skill is already assigned
    const existingSkill = agent.skills.find(s => s.skillId === skillId);
    if (existingSkill) {
      // Update proficiency
      existingSkill.proficiency = proficiency;
      existingSkill.lastUsed = new Date();
    } else {
      // Add new skill
      const agentSkill: AgentSkill = {
        skillId,
        proficiency,
        acquiredAt: new Date(),
        usageCount: 0,
        context: []
      };
      agent.skills.push(agentSkill);
    }

    // Update proficiency mapping
    agent.skillProficiencies[skillId] = proficiency;

    await this.saveAgent(agent);
  }

  /**
   * Remove skill from agent
   */
  async removeSkillFromAgent(agentId: string, skillId: string): Promise<void> {
    const agent = await this.loadAgent(agentId, true);

    // Remove from skills array
    agent.skills = agent.skills.filter(s => s.skillId !== skillId);

    // Remove from proficiency mapping
    delete agent.skillProficiencies[skillId];

    await this.saveAgent(agent);
  }

  /**
   * Get agent's skills
   */
  async getAgentSkills(agentId: string): Promise<AgentSkill[]> {
    const agent = await this.loadAgent(agentId, true);
    return agent.skills;
  }

  /**
   * Update skill proficiency
   */
  async updateSkillProficiency(agentId: string, skillId: string, proficiency: ProficiencyLevel): Promise<void> {
    const agent = await this.loadAgent(agentId, true);

    const skill = agent.skills.find(s => s.skillId === skillId);
    if (skill) {
      skill.proficiency = proficiency;
      skill.lastUsed = new Date();
      agent.skillProficiencies[skillId] = proficiency;

      await this.saveAgent(agent);
    }
  }

  /**
   * Validate agent profile
   */
  async validateAgent(agent: AgentProfile): Promise<ValidationResult> {
    return ValidationEngine.validateAgent(agent);
  }

  /**
   * Generate agent ID from name
   */
  private generateAgentId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get agent file path
   */
  private getAgentPath(agentId: string): string {
    return path.join(this.config.basePath, this.config.agentsPath, `${agentId}.md`);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.agents.clear();
    this.loadedAgents.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { loaded: number; cached: number } {
    return {
      loaded: this.loadedAgents.size,
      cached: this.agents.size
    };
  }
}