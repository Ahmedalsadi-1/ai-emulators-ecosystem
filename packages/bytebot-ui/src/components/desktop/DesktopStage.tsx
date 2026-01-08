'use client';

import { useState, useEffect } from 'react';
import styles from './DesktopStage.module.css';

interface DesktopStageProps {
  activeDesktop: string;
}

export function DesktopStage({ activeDesktop }: DesktopStageProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeDesktop]);
  
  return (
    <div className={styles.stageContainer}>
      <div className={styles.desktopFrame}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Connecting to {activeDesktop}...</span>
          </div>
        ) : (
          <div className={styles.desktopContent}>
            <div className={styles.vncPlaceholder}>
              <p>🖥️ {activeDesktop} Desktop</p>
              <p className={styles.hint}>
                VNC connection will be displayed here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
