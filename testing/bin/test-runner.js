#!/usr/bin/env node

/**
 * Unified Testing Framework Launcher
 * Provides a centralized way to run tests across all projects in the ecosystem
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../..');
    this.projects = this.discoverProjects();
  }

  discoverProjects() {
    const projects = [];
    const items = fs.readdirSync(this.rootDir);

    for (const item of items) {
      const itemPath = path.join(this.rootDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'testing') {
        const packageJsonPath = path.join(itemPath, 'package.json');
        const pyprojectPath = path.join(itemPath, 'pyproject.toml');
        const setupPyPath = path.join(itemPath, 'setup.py');
        const requirementsPath = path.join(itemPath, 'requirements.txt');

        let projectType = 'unknown';
        if (fs.existsSync(packageJsonPath)) {
          projectType = 'typescript';
        } else if (fs.existsSync(pyprojectPath) || fs.existsSync(setupPyPath) || fs.existsSync(requirementsPath)) {
          projectType = 'python';
        }

        if (projectType !== 'unknown') {
          projects.push({
            name: item,
            path: itemPath,
            type: projectType
          });
        }
      }
    }

    return projects;
  }

  async runTests(projectName = null, testType = 'all') {
    console.log('🚀 Starting Unified Test Suite');
    console.log(`📊 Test Type: ${testType}`);
    console.log(`📁 Projects Found: ${this.projects.length}`);

    const targetProjects = projectName
      ? this.projects.filter(p => p.name === projectName)
      : this.projects;

    if (targetProjects.length === 0) {
      console.error(`❌ Project "${projectName}" not found`);
      process.exit(1);
    }

    const results = [];

    for (const project of targetProjects) {
      console.log(`\n🔍 Testing ${project.name} (${project.type})`);
      try {
        const result = await this.runProjectTests(project, testType);
        results.push({ project: project.name, ...result });
      } catch (error) {
        console.error(`❌ Failed to test ${project.name}:`, error.message);
        results.push({ project: project.name, success: false, error: error.message });
      }
    }

    this.printSummary(results);
  }

  async runProjectTests(project, testType) {
    const cwd = project.path;

    switch (project.type) {
      case 'typescript':
        return await this.runTypeScriptTests(cwd, testType);
      case 'python':
        return await this.runPythonTests(cwd, testType);
      default:
        throw new Error(`Unsupported project type: ${project.type}`);
    }
  }

  async runTypeScriptTests(cwd, testType) {
    const commands = [];

    if (testType === 'all' || testType === 'unit') {
      commands.push(['npm', ['test']]);
    }

    if (testType === 'all' || testType === 'integration') {
      commands.push(['npm', ['run', 'test:integration']]);
    }

    if (testType === 'all' || testType === 'e2e') {
      commands.push(['npm', ['run', 'test:e2e']]);
    }

    return await this.executeCommands(commands, cwd);
  }

  async runPythonTests(cwd, testType) {
    const commands = [];

    if (testType === 'all' || testType === 'unit') {
      commands.push(['python', ['-m', 'pytest', 'tests/', '-v']]);
    }

    if (testType === 'all' || testType === 'integration') {
      commands.push(['python', ['-m', 'pytest', 'tests/', '-v', '-m', 'integration']]);
    }

    if (testType === 'all' || testType === 'e2e') {
      commands.push(['python', ['-m', 'pytest', 'tests/', '-v', '-m', 'e2e']]);
    }

    return await this.executeCommands(commands, cwd);
  }

  async executeCommands(commands, cwd) {
    let allPassed = true;
    let totalTests = 0;
    let passedTests = 0;

    for (const [cmd, args] of commands) {
      try {
        const result = await this.executeCommand(cmd, args, cwd);
        if (!result.success) {
          allPassed = false;
        }
        totalTests += result.totalTests || 0;
        passedTests += result.passedTests || 0;
      } catch (error) {
        allPassed = false;
        console.error(`Command failed: ${cmd} ${args.join(' ')}`);
      }
    }

    return {
      success: allPassed,
      totalTests,
      passedTests
    };
  }

  executeCommand(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, {
        cwd,
        stdio: 'inherit',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          resolve({ success: false, code, stdout, stderr });
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  printSummary(results) {
    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));

    let totalProjects = results.length;
    let passedProjects = results.filter(r => r.success).length;
    let totalTests = results.reduce((sum, r) => sum + (r.totalTests || 0), 0);
    let passedTests = results.reduce((sum, r) => sum + (r.passedTests || 0), 0);

    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.project}: ${result.passedTests || 0}/${result.totalTests || 0} tests passed`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('='.repeat(50));
    console.log(`📊 Overall: ${passedProjects}/${totalProjects} projects passed`);
    console.log(`🧪 Tests: ${passedTests}/${totalTests} tests passed`);

    if (passedProjects === totalProjects) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed');
      process.exit(1);
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const projectName = args.find(arg => !arg.startsWith('--')) || null;
  const testType = args.includes('--unit') ? 'unit' :
                   args.includes('--integration') ? 'integration' :
                   args.includes('--e2e') ? 'e2e' : 'all';

  const runner = new TestRunner();
  runner.runTests(projectName, testType).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;