import {
  AgentProfile,
  SkillDefinition,
  ProficiencyLevel,
  ValidationResult,
  AgentSkill,
  SystemConfiguration
} from '../types';
import { AgentProfileManager } from './AgentProfileManager';
import { SkillsRegistry } from './SkillsRegistry';

/**
 * Agent-Skills Association Manager
 * Robust logic for linking skills to agents with compatibility checking,
 * proficiency levels, and profile updates when skill assignments change
 */
export class AgentSkillsAssociationManager {
  private agentManager: AgentProfileManager;
  private skillsRegistry: SkillsRegistry;

  constructor(
    agentManager: AgentProfileManager,
    skillsRegistry: SkillsRegistry
  ) {
    this.agentManager = agentManager;
    this.skillsRegistry = skillsRegistry;
  }

  /**
   * Assign a skill to an agent with full compatibility and dependency checking
   */
  async assignSkillToAgent(
    agentId: string,
    skillId: string,
    options: AssignSkillOptions = {}
  ): Promise<AssignmentResult> {
    const result: AssignmentResult = {
      success: false,
      agentId,
      skillId,
      assigned: false,
      compatibility: { compatible: false, reasons: [] },
      dependenciesResolved: false,
      proficiency: options.proficiency || ProficiencyLevel.NOVICE
    };

    try {
      // Load agent and skill
      const agent = await this.agentManager.loadAgent(agentId, true);
      const skill = await this.skillsRegistry.loadSkill(skillId, true);

      // Check skill compatibility
      result.compatibility = await this.skillsRegistry.checkSkillCompatibility(
        skill,
        {
          domains: agent.capabilities.domains,
          preferredTools: agent.capabilities.preferredTools,
          category: agent.metadata.category
        }
      );

      if (!result.compatibility.compatible && !options.force) {
        return {
          ...result,
          error: `Skill assignment blocked due to compatibility issues: ${result.compatibility.reasons.join(', ')}`
        };
      }

      // Resolve and validate dependencies
      const dependencies = await this.resolveSkillDependencies(agent, skill, options);
      result.dependenciesResolved = dependencies.length > 0;

      if (!dependencies.every(dep => dep.resolved) && !options.force) {
        const unresolvedDeps = dependencies.filter(dep => !dep.resolved);
        return {
          ...result,
          error: `Skill assignment blocked due to unresolved dependencies: ${unresolvedDeps.map(dep => dep.skillId).join(', ')}`
        };
      }

      // Determine proficiency level
      result.proficiency = await this.determineProficiencyLevel(agent, skill, options);

      // Assign the skill
      await this.agentManager.assignSkillToAgent(agentId, skillId, result.proficiency);

      // Update agent capabilities if needed
      await this.updateAgentCapabilities(agent, skill);

      // Validate the updated agent
      const validation = await this.agentManager.validateAgent(agent);
      if (!validation.isValid && !options.force) {
        // Rollback the assignment
        await this.agentManager.removeSkillFromAgent(agentId, skillId);
        return {
          ...result,
          error: `Skill assignment would make agent invalid: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      result.success = true;
      result.assigned = true;
      result.dependenciesAssigned = dependencies.filter(dep => dep.resolved).length;

      return result;

    } catch (error) {
      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown error during skill assignment'
      };
    }
  }

  /**
   * Remove a skill from an agent with cascade options
   */
  async removeSkillFromAgent(
    agentId: string,
    skillId: string,
    options: RemoveSkillOptions = {}
  ): Promise<RemovalResult> {
    const result: RemovalResult = {
      success: false,
      agentId,
      skillId,
      removed: false
    };

    try {
      // Load agent
      const agent = await this.agentManager.loadAgent(agentId, true);

      // Check if skill is assigned
      const skillAssignment = agent.skills.find(s => s.skillId === skillId);
      if (!skillAssignment) {
        return {
          ...result,
          error: `Skill ${skillId} is not assigned to agent ${agentId}`
        };
      }

      // Check for dependent skills that would be affected
      const dependentSkills = await this.getDependentSkills(agent, skillId);
      result.dependentSkillsAffected = dependentSkills.length;

      if (dependentSkills.length > 0 && !options.cascade && !options.force) {
        return {
          ...result,
          error: `Skill removal would affect ${dependentSkills.length} dependent skills. Use cascade=true to remove them as well.`
        };
      }

      // Remove the skill
      await this.agentManager.removeSkillFromAgent(agentId, skillId);
      result.removed = true;

      // Handle dependent skills
      if (options.cascade && dependentSkills.length > 0) {
        result.dependentSkillsRemoved = 0;
        for (const dependentSkill of dependentSkills) {
          try {
            await this.agentManager.removeSkillFromAgent(agentId, dependentSkill.skillId);
            result.dependentSkillsRemoved!++;
          } catch (error) {
            // Log but continue
          }
        }
      }

      // Update agent capabilities
      await this.updateAgentCapabilitiesAfterRemoval(agent, skillId);

      result.success = true;
      return result;

    } catch (error) {
      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown error during skill removal'
      };
    }
  }

  /**
   * Update skill proficiency for an agent
   */
  async updateSkillProficiency(
    agentId: string,
    skillId: string,
    newProficiency: ProficiencyLevel,
    options: ProficiencyUpdateOptions = {}
  ): Promise<ProficiencyUpdateResult> {
    const result: ProficiencyUpdateResult = {
      success: false,
      agentId,
      skillId,
      oldProficiency: ProficiencyLevel.NOVICE,
      newProficiency,
      updated: false
    };

    try {
      const agent = await this.agentManager.loadAgent(agentId, true);
      const skill = await this.skillsRegistry.loadSkill(skillId);

      const skillAssignment = agent.skills.find(s => s.skillId === skillId);
      if (!skillAssignment) {
        return {
          ...result,
          error: `Skill ${skillId} is not assigned to agent ${agentId}`
        };
      }

      result.oldProficiency = skillAssignment.proficiency;

      // Validate proficiency change
      const validation = await this.validateProficiencyChange(skillAssignment, newProficiency, skill);
      if (!validation.isValid && !options.force) {
        return {
          ...result,
          error: `Proficiency update blocked: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      // Update proficiency
      await this.agentManager.updateSkillProficiency(agentId, skillId, newProficiency);

      // Update agent capabilities based on new proficiency
      await this.updateAgentCapabilitiesForProficiency(agent, skill, newProficiency);

      result.success = true;
      result.updated = true;

      return result;

    } catch (error) {
      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown error during proficiency update'
      };
    }
  }

  /**
   * Bulk assign multiple skills to an agent
   */
  async bulkAssignSkills(
    agentId: string,
    skillAssignments: Array<{ skillId: string; proficiency?: ProficiencyLevel }>,
    options: BulkAssignOptions = {}
  ): Promise<BulkAssignmentResult> {
    const result: BulkAssignmentResult = {
      success: false,
      agentId,
      totalRequested: skillAssignments.length,
      successful: 0,
      failed: 0,
      results: []
    };

    // Validate all assignments first
    const validationResults = await Promise.all(
      skillAssignments.map(async ({ skillId, proficiency }) => {
        try {
          const skill = await this.skillsRegistry.loadSkill(skillId);
          return { skillId, proficiency, skill, valid: true };
        } catch (error) {
          return {
            skillId,
            proficiency,
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const validAssignments = validationResults.filter(r => r.valid);
    const invalidAssignments = validationResults.filter(r => !r.valid);

    if (invalidAssignments.length > 0 && !options.force) {
      result.results = invalidAssignments.map(r => ({
        skillId: r.skillId,
        success: false,
        error: r.error || 'Invalid skill'
      }));
      result.failed = invalidAssignments.length;
      return result;
    }

    // Perform assignments
    const assignmentPromises = validAssignments.map(async ({ skillId, proficiency }) => {
      const assignmentResult = await this.assignSkillToAgent(agentId, skillId, {
        proficiency,
        force: options.force,
        skipDependencies: options.skipDependencies
      });

      return {
        skillId,
        success: assignmentResult.success,
        error: assignmentResult.error,
        compatibility: assignmentResult.compatibility,
        dependenciesResolved: assignmentResult.dependenciesResolved
      };
    });

    result.results = await Promise.all(assignmentPromises);
    result.successful = result.results.filter(r => r.success).length;
    result.failed = result.results.filter(r => !r.success).length;
    result.success = result.failed === 0;

    return result;
  }

  /**
   * Get comprehensive skill assignment status for an agent
   */
  async getAgentSkillStatus(agentId: string): Promise<AgentSkillStatus> {
    const agent = await this.agentManager.loadAgent(agentId, true);

    const skillStatuses: Array<SkillStatus> = await Promise.all(
      agent.skills.map(async (agentSkill) => {
        try {
          const skill = await this.skillsRegistry.loadSkill(agentSkill.skillId);

          // Check compatibility
          const compatibility = await this.skillsRegistry.checkSkillCompatibility(
            skill,
            {
              domains: agent.capabilities.domains,
              preferredTools: agent.capabilities.preferredTools,
              category: agent.metadata.category
            }
          );

          // Check dependencies
          const dependencies = await this.resolveSkillDependencies(agent, skill);
          const dependenciesResolved = dependencies.every(dep => dep.resolved);

          // Get proficiency requirements
          const proficiencyReqs = await this.skillsRegistry.getSkillProficiencyRequirements(agentSkill.skillId);

          return {
            skillId: agentSkill.skillId,
            name: skill.name,
            category: skill.category,
            proficiency: {
              current: agentSkill.proficiency,
              minimum: proficiencyReqs.minimumLevel,
              recommended: proficiencyReqs.recommendedLevel,
              isAdequate: agentSkill.proficiency >= proficiencyReqs.minimumLevel
            },
            compatibility,
            dependenciesResolved,
            lastUsed: agentSkill.lastUsed,
            usageCount: agentSkill.usageCount,
            assignedAt: agentSkill.acquiredAt
          };
        } catch (error) {
          return {
            skillId: agentSkill.skillId,
            name: 'Unknown',
            category: 'unknown',
            proficiency: {
              current: agentSkill.proficiency,
              minimum: ProficiencyLevel.NOVICE,
              recommended: ProficiencyLevel.INTERMEDIATE,
              isAdequate: false
            },
            compatibility: { compatible: false, reasons: ['Skill not found'] },
            dependenciesResolved: false,
            lastUsed: agentSkill.lastUsed,
            usageCount: agentSkill.usageCount,
            assignedAt: agentSkill.acquiredAt,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return {
      agentId,
      agentName: agent.name,
      totalSkills: skillStatuses.length,
      skills: skillStatuses,
      summary: {
        adequateProficiency: skillStatuses.filter(s => s.proficiency.isAdequate).length,
        compatible: skillStatuses.filter(s => s.compatibility.compatible).length,
        dependenciesResolved: skillStatuses.filter(s => s.dependenciesResolved).length,
        withErrors: skillStatuses.filter(s => s.error).length
      }
    };
  }

  // Private methods

  private async resolveSkillDependencies(
    agent: AgentProfile,
    skill: SkillDefinition,
    options: AssignSkillOptions = {}
  ): Promise<Array<{ skillId: string; resolved: boolean; assigned?: boolean }>> {
    const results: Array<{ skillId: string; resolved: boolean; assigned?: boolean }> = [];

    for (const dep of skill.dependencies) {
      const depId = dep.skillId;
      const isAssigned = agent.skills.some(s => s.skillId === depId);
      const isRequired = dep.required;

      if (isAssigned) {
        results.push({ skillId: depId, resolved: true });
      } else if (isRequired && !options.skipDependencies) {
        // Try to assign the dependency
        try {
          const depAssignment = await this.assignSkillToAgent(agent.id, depId, {
            proficiency: ProficiencyLevel.NOVICE,
            force: options.force
          });

          results.push({
            skillId: depId,
            resolved: depAssignment.success,
            assigned: depAssignment.success
          });
        } catch (error) {
          results.push({ skillId: depId, resolved: false });
        }
      } else {
        results.push({ skillId: depId, resolved: !isRequired });
      }
    }

    return results;
  }

  private async determineProficiencyLevel(
    agent: AgentProfile,
    skill: SkillDefinition,
    options: AssignSkillOptions
  ): Promise<ProficiencyLevel> {
    if (options.proficiency) {
      return options.proficiency;
    }

    // Get skill requirements
    const requirements = await this.skillsRegistry.getSkillProficiencyRequirements(skill.id);

    // Check agent's existing expertise in related domains
    const relevantDomains = agent.capabilities.domains.filter(domain =>
      skill.metadata.tags.includes(domain.toLowerCase())
    );

    const averageExpertise = relevantDomains.length > 0
      ? relevantDomains.reduce((sum, domain) =>
          sum + (agent.capabilities.expertise[domain] || 0), 0) / relevantDomains.length
      : 0;

    // Determine starting proficiency based on expertise
    if (averageExpertise >= 8) {
      return ProficiencyLevel.ADVANCED;
    } else if (averageExpertise >= 6) {
      return ProficiencyLevel.INTERMEDIATE;
    } else if (averageExpertise >= 4) {
      return ProficiencyLevel.BEGINNER;
    } else {
      return ProficiencyLevel.NOVICE;
    }
  }

  private async updateAgentCapabilities(agent: AgentProfile, skill: SkillDefinition): Promise<void> {
    // Update domains if skill introduces new ones
    const newDomains = skill.compatibility.agentTypes.filter(type =>
      !agent.capabilities.domains.includes(type)
    );

    if (newDomains.length > 0) {
      agent.capabilities.domains.push(...newDomains);
    }

    // Update expertise levels
    const skillDomains = skill.metadata.tags.filter(tag =>
      agent.capabilities.domains.includes(tag)
    );

    for (const domain of skillDomains) {
      const currentLevel = agent.capabilities.expertise[domain] || 0;
      // Increase expertise slightly when assigning related skills
      agent.capabilities.expertise[domain] = Math.min(10, currentLevel + 0.5);
    }

    // Update preferred tools if skill has platform requirements
    const newTools = skill.compatibility.platforms.filter(platform =>
      !agent.capabilities.preferredTools.some(tool =>
        tool.toLowerCase().includes(platform.toLowerCase())
      )
    );

    if (newTools.length > 0) {
      agent.capabilities.preferredTools.push(...newTools);
    }

    await this.agentManager.saveAgent(agent);
  }

  private async updateAgentCapabilitiesAfterRemoval(agent: AgentProfile, skillId: string): Promise<void> {
    // This could be enhanced to remove domains/tools that are no longer used
    // For now, we keep all capabilities to avoid breaking other skill assignments
    await this.agentManager.saveAgent(agent);
  }

  private async updateAgentCapabilitiesForProficiency(
    agent: AgentProfile,
    skill: SkillDefinition,
    proficiency: ProficiencyLevel
  ): Promise<void> {
    // Update expertise based on proficiency level
    const skillDomains = skill.metadata.tags.filter(tag =>
      agent.capabilities.domains.includes(tag)
    );

    for (const domain of skillDomains) {
      const proficiencyMultiplier = proficiency / 6; // Normalize to 0-1 scale
      const currentLevel = agent.capabilities.expertise[domain] || 0;
      agent.capabilities.expertise[domain] = Math.min(10, currentLevel + proficiencyMultiplier);
    }

    await this.agentManager.saveAgent(agent);
  }

  private async getDependentSkills(agent: AgentProfile, skillId: string): Promise<AgentSkill[]> {
    // Get skills that depend on this skill
    const dependentSkills: AgentSkill[] = [];

    for (const agentSkill of agent.skills) {
      if (agentSkill.skillId === skillId) continue;

      try {
        const skill = await this.skillsRegistry.loadSkill(agentSkill.skillId);
        const dependsOnSkill = skill.dependencies.some(dep => dep.skillId === skillId);

        if (dependsOnSkill) {
          dependentSkills.push(agentSkill);
        }
      } catch (error) {
        // Skip invalid skills
      }
    }

    return dependentSkills;
  }

  private async validateProficiencyChange(
    currentAssignment: AgentSkill,
    newProficiency: ProficiencyLevel,
    skill: SkillDefinition
  ): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check for downgrade that might break dependencies
    if (newProficiency < currentAssignment.proficiency) {
      warnings.push({
        field: 'proficiency',
        rule: 'downgrade',
        message: 'Proficiency downgrade may affect skill effectiveness',
        severity: 'warning'
      });
    }

    // Check skill requirements
    const requirements = await this.skillsRegistry.getSkillProficiencyRequirements(skill.id);
    if (newProficiency < requirements.minimumLevel) {
      errors.push({
        field: 'proficiency',
        rule: 'minimum',
        message: `Proficiency below minimum requirement (${requirements.minimumLevel})`,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos: []
    };
  }
}

/**
 * Types for skill assignment operations
 */

export interface AssignSkillOptions {
  proficiency?: ProficiencyLevel;
  force?: boolean; // Skip compatibility and validation checks
  skipDependencies?: boolean; // Don't auto-assign dependencies
}

export interface RemoveSkillOptions {
  cascade?: boolean; // Remove dependent skills as well
  force?: boolean;
}

export interface ProficiencyUpdateOptions {
  force?: boolean;
}

export interface BulkAssignOptions {
  force?: boolean;
  skipDependencies?: boolean;
}

export interface AssignmentResult {
  success: boolean;
  agentId: string;
  skillId: string;
  assigned: boolean;
  proficiency: ProficiencyLevel;
  compatibility: { compatible: boolean; reasons: string[] };
  dependenciesResolved: boolean;
  dependenciesAssigned?: number;
  error?: string;
}

export interface RemovalResult {
  success: boolean;
  agentId: string;
  skillId: string;
  removed: boolean;
  dependentSkillsAffected?: number;
  dependentSkillsRemoved?: number;
  error?: string;
}

export interface ProficiencyUpdateResult {
  success: boolean;
  agentId: string;
  skillId: string;
  oldProficiency: ProficiencyLevel;
  newProficiency: ProficiencyLevel;
  updated: boolean;
  error?: string;
}

export interface BulkAssignmentResult {
  success: boolean;
  agentId: string;
  totalRequested: number;
  successful: number;
  failed: number;
  results: Array<{
    skillId: string;
    success: boolean;
    error?: string;
    compatibility?: { compatible: boolean; reasons: string[] };
    dependenciesResolved?: boolean;
  }>;
}

export interface SkillStatus {
  skillId: string;
  name: string;
  category: string;
  proficiency: {
    current: ProficiencyLevel;
    minimum: ProficiencyLevel;
    recommended: ProficiencyLevel;
    isAdequate: boolean;
  };
  compatibility: { compatible: boolean; reasons: string[] };
  dependenciesResolved: boolean;
  lastUsed?: Date;
  usageCount: number;
  assignedAt: Date;
  error?: string;
}

export interface AgentSkillStatus {
  agentId: string;
  agentName: string;
  totalSkills: number;
  skills: SkillStatus[];
  summary: {
    adequateProficiency: number;
    compatible: number;
    dependenciesResolved: number;
    withErrors: number;
  };
}