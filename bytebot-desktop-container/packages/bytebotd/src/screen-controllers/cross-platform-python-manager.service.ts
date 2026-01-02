import { Injectable, Logger } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface PythonEnvironment {
  version: string;
  executable: string;
  platform: string;
  hasRequiredPackages: boolean;
  missingPackages: string[];
}

export interface DependencyCheck {
  package: string;
  installed: boolean;
  version?: string;
  required: boolean;
}

@Injectable()
export class CrossPlatformPythonManager {
  private readonly logger = new Logger(CrossPlatformPythonManager.name);
  private readonly execAsync = promisify(exec);

  // Required Python packages for Open-Interface
  private readonly requiredPackages = [
    'flask',
    'flask-cors',
    'pillow',
    'opencv-python',
    'pyautogui',
    'openai',
    'google-generativeai',
  ];

  // Optional packages
  private readonly optionalPackages = [
    'speechrecognition',
    'pyaudio',
  ];

  async detectPythonEnvironment(): Promise<PythonEnvironment> {
    const platform = process.platform;
    this.logger.log(`Detecting Python environment on ${platform}`);

    // Try different Python executables based on platform
    const pythonExecutables = this.getPythonExecutables(platform);

    for (const executable of pythonExecutables) {
      try {
        const env = await this.checkPythonExecutable(executable, platform);
        if (env.hasRequiredPackages) {
          this.logger.log(`✅ Found suitable Python environment: ${executable}`);
          return env;
        } else {
          this.logger.warn(`⚠️ Python ${executable} found but missing packages: ${env.missingPackages.join(', ')}`);
        }
      } catch (error) {
        this.logger.debug(`Python executable ${executable} not available: ${error.message}`);
      }
    }

    throw new Error(`No suitable Python environment found on ${platform}`);
  }

  private getPythonExecutables(platform: string): string[] {
    switch (platform) {
      case 'win32':
        return [
          'python',           // Python launcher
          'python3',
          'py',               // Python launcher (alternative)
          'C:\\Python311\\python.exe',
          'C:\\Python310\\python.exe',
          'C:\\Python39\\python.exe',
          'C:\\Python38\\python.exe',
        ];

      case 'darwin': // macOS
        return [
          'python3',
          'python',
          '/usr/local/bin/python3',
          '/usr/bin/python3',
          '/opt/homebrew/bin/python3',
          '/Library/Frameworks/Python.framework/Versions/Current/bin/python3',
        ];

      case 'linux':
        return [
          'python3',
          'python',
          '/usr/bin/python3',
          '/usr/local/bin/python3',
        ];

      default:
        return ['python3', 'python'];
    }
  }

  private async checkPythonExecutable(executable: string, platform: string): Promise<PythonEnvironment> {
    // Check if executable exists and get version
    const versionCommand = `"${executable}" --version`;
    const { stdout: versionOutput } = await this.execAsync(versionCommand);
    const version = versionOutput.trim().replace('Python ', '');

    // Check required packages
    const dependencyChecks = await this.checkPythonPackages(executable, this.requiredPackages);
    const missingPackages = dependencyChecks
      .filter(check => !check.installed && check.required)
      .map(check => check.package);

    const hasRequiredPackages = missingPackages.length === 0;

    return {
      version,
      executable,
      platform,
      hasRequiredPackages,
      missingPackages,
    };
  }

  private async checkPythonPackages(executable: string, packages: string[]): Promise<DependencyCheck[]> {
    const checks: DependencyCheck[] = [];

    for (const packageName of packages) {
      try {
        // Try to import the package
        const testCommand = `"${executable}" -c "import ${packageName}; print('${packageName} OK')"`;
        await this.execAsync(testCommand, { timeout: 10000 });

        checks.push({
          package: packageName,
          installed: true,
          required: this.requiredPackages.includes(packageName),
        });
      } catch (error) {
        checks.push({
          package: packageName,
          installed: false,
          required: this.requiredPackages.includes(packageName),
        });
      }
    }

    return checks;
  }

  async installMissingPackages(executable: string, packages: string[]): Promise<void> {
    if (packages.length === 0) {
      return;
    }

    this.logger.log(`Installing missing packages: ${packages.join(', ')}`);

    // Use pip to install packages
    const pipCommand = `"${executable}" -m pip install ${packages.join(' ')}`;

    try {
      const { stdout, stderr } = await this.execAsync(pipCommand, {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      this.logger.log('Package installation completed');
      if (stdout) this.logger.debug(`pip stdout: ${stdout}`);
      if (stderr) this.logger.debug(`pip stderr: ${stderr}`);
    } catch (error) {
      this.logger.error(`Failed to install packages: ${error.message}`);
      throw new Error(`Package installation failed: ${packages.join(', ')}`);
    }
  }

  async validateOpenInterfaceInstallation(openInterfaceDir: string): Promise<boolean> {
    try {
      // Check if directory exists
      await fs.access(openInterfaceDir);

      // Check for required files
      const requiredFiles = [
        'app/app.py',
        'app/server.py',
        'server_launch.py',
        'requirements.txt',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(openInterfaceDir, file);
        await fs.access(filePath);
      }

      // Check if requirements.txt has required packages
      const requirementsPath = path.join(openInterfaceDir, 'requirements.txt');
      const requirements = await fs.readFile(requirementsPath, 'utf-8');

      const hasFlask = requirements.includes('flask');
      const hasPIL = requirements.includes('pillow') || requirements.includes('Pillow');
      const hasOpenCV = requirements.includes('opencv');

      if (!hasFlask || !hasPIL || !hasOpenCV) {
        this.logger.warn('requirements.txt may be missing required packages');
        return false;
      }

      this.logger.log('✅ Open-Interface installation validated');
      return true;
    } catch (error) {
      this.logger.error(`❌ Open-Interface validation failed: ${error.message}`);
      return false;
    }
  }

  async setupPythonEnvironment(openInterfaceDir: string): Promise<PythonEnvironment> {
    this.logger.log('Setting up Python environment for Open-Interface...');

    // First validate Open-Interface installation
    const isValidInstallation = await this.validateOpenInterfaceInstallation(openInterfaceDir);
    if (!isValidInstallation) {
      throw new Error('Invalid Open-Interface installation');
    }

    // Detect Python environment
    const pythonEnv = await this.detectPythonEnvironment();

    // Install missing packages if any
    if (pythonEnv.missingPackages.length > 0) {
      this.logger.log(`Installing missing packages: ${pythonEnv.missingPackages.join(', ')}`);
      await this.installMissingPackages(pythonEnv.executable, pythonEnv.missingPackages);

      // Re-check after installation
      const updatedEnv = await this.checkPythonExecutable(pythonEnv.executable, pythonEnv.platform);
      if (!updatedEnv.hasRequiredPackages) {
        throw new Error(`Failed to install required packages: ${updatedEnv.missingPackages.join(', ')}`);
      }

      return updatedEnv;
    }

    return pythonEnv;
  }

  getPlatformSpecificInstructions(platform: string): string {
    switch (platform) {
      case 'win32':
        return `
Windows Setup Instructions:
1. Install Python 3.8+ from https://python.org
2. Ensure Python is in PATH during installation
3. Install required packages: pip install flask flask-cors pillow opencv-python pyautogui openai google-generativeai
4. For audio features (optional): pip install speechrecognition pyaudio
        `.trim();

      case 'darwin':
        return `
macOS Setup Instructions:
1. Install Python 3.8+ using Homebrew: brew install python
2. Or download from https://python.org
3. Install required packages: pip install flask flask-cors pillow opencv-python pyautogui openai google-generativeai
4. For audio features (optional): pip install speechrecognition pyaudio
5. Grant screen recording permissions in System Preferences > Security & Privacy
        `.trim();

      case 'linux':
        return `
Linux Setup Instructions:
1. Install Python 3.8+ using your package manager:
   - Ubuntu/Debian: sudo apt install python3 python3-pip
   - CentOS/RHEL: sudo yum install python3 python3-pip
   - Arch: sudo pacman -S python python-pip
2. Install required packages: pip install flask flask-cors pillow opencv-python pyautogui openai google-generativeai
3. For audio features (optional): pip install speechrecognition pyaudio
4. Install system dependencies: sudo apt install python3-tk scrot
        `.trim();

      default:
        return 'Please refer to the Open-Interface README for setup instructions.';
    }
  }

  async diagnoseIssues(openInterfaceDir: string): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Python installation
    try {
      await this.detectPythonEnvironment();
    } catch (error) {
      issues.push('No suitable Python environment found');
      recommendations.push(this.getPlatformSpecificInstructions(process.platform));
    }

    // Check Open-Interface installation
    const isValid = await this.validateOpenInterfaceInstallation(openInterfaceDir);
    if (!isValid) {
      issues.push('Open-Interface installation is incomplete or corrupted');
      recommendations.push('Reinstall Open-Interface from https://github.com/AmberSahdev/Open-Interface');
    }

    // Check common issues
    if (process.platform === 'darwin') {
      // macOS specific checks
      try {
        await this.execAsync('system_profiler SPFrameworksDataType | grep -i "screen recording"');
      } catch (error) {
        issues.push('Screen recording permissions may not be granted');
        recommendations.push('Grant screen recording permissions in System Preferences > Security & Privacy > Screen Recording');
      }
    }

    return { issues, recommendations };
  }
}