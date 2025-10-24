import packageJson from '../package.json';
import updatesConfig from '../config/updates.json';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  notes: {
    [key: string]: string[];
  };
  important?: boolean;
}

export interface UserUpdatePreference {
  lastReadVersion: string;
  dismissedVersions: string[];
  autoCheck: boolean;
}

const UPDATE_PREFERENCES_KEY = 'kchat_update_preferences';
const CURRENT_VERSION = packageJson.version;

class UpdateService {
  // 获取当前版本
  getCurrentVersion(): string {
    return CURRENT_VERSION;
  }

  // 获取所有更新日志
  getAllUpdates(): Record<string, VersionInfo> {
    const result: Record<string, VersionInfo> = {};

    Object.keys(updatesConfig).forEach(version => {
      const config = (updatesConfig as any)[version];
      result[version] = {
        version,
        releaseDate: this.getReleaseDate(version),
        notes: config.notes,
        important: config.important || false
      };
    });

    return result;
  }

  // 获取指定版本的更新信息
  getVersionInfo(version: string): VersionInfo | null {
    const updates = this.getAllUpdates();
    return updates[version] || null;
  }

  // 获取最新版本信息
  getLatestVersion(): VersionInfo | null {
    const updates = this.getAllUpdates();
    const versions = Object.keys(updates).sort((a, b) => this.compareVersions(b, a));
    return versions.length > 0 ? updates[versions[0]] : null;
  }

  // 检查是否有未读的重要更新
  hasUnreadImportantUpdate(): boolean {
    const preferences = this.getUserPreferences();
    const updates = this.getAllUpdates();

    return Object.keys(updates).some(version => {
      const update = updates[version];
      const isImportant = update.important;
      const isUnread = version !== preferences.lastReadVersion;
      const isNotDismissed = !preferences.dismissedVersions.includes(version);

      return isImportant && isUnread && isNotDismissed;
    });
  }

  // 获取用户更新偏好设置
  getUserPreferences(): UserUpdatePreference {
    try {
      const stored = localStorage.getItem(UPDATE_PREFERENCES_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        // 确保所有必需的字段都存在
        return {
          lastReadVersion: parsed.lastReadVersion || '',
          dismissedVersions: parsed.dismissedVersions || [],
          autoCheck: parsed.autoCheck !== false // 默认为true
        };
      }
    } catch (error) {
      console.error('[UpdateService] Failed to load user preferences:', error);
    }

    // 返回默认设置
    return {
      lastReadVersion: '',
      dismissedVersions: [],
      autoCheck: true
    };
  }

  // 保存用户更新偏好设置
  saveUserPreferences(preferences: UserUpdatePreference): void {
    try {
      localStorage.setItem(UPDATE_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('[UpdateService] Failed to save user preferences:', error);
    }
  }

  // 标记版本为已读
  markVersionAsRead(version: string): void {
    const preferences = this.getUserPreferences();
    preferences.lastReadVersion = version;
    // 从忽略列表中移除（如果存在）
    preferences.dismissedVersions = preferences.dismissedVersions.filter(v => v !== version);
    this.saveUserPreferences(preferences);
  }

  // 忽略指定版本的通知
  dismissVersion(version: string): void {
    const preferences = this.getUserPreferences();
    if (!preferences.dismissedVersions.includes(version)) {
      preferences.dismissedVersions.push(version);
      this.saveUserPreferences(preferences);
    }
  }

  // 检查是否应该显示更新通知
  shouldShowUpdateNotice(): boolean {
    const preferences = this.getUserPreferences();
    const latestVersion = this.getLatestVersion();

    if (!latestVersion) {
      return false;
    }

    // 如果用户已读过最新版本，不显示通知
    if (latestVersion.version === preferences.lastReadVersion) {
      return false;
    }

    // 如果用户忽略了该版本，不显示通知
    if (preferences.dismissedVersions.includes(latestVersion.version)) {
      return false;
    }

    // 对于重要更新，总是显示通知
    if (latestVersion.important) {
      return true;
    }

    // 对于普通更新，仅在用户启用自动检查时显示
    return preferences.autoCheck;
  }

  // 比较版本号
  private compareVersions(a: string, b: string): number {
    const parseVersion = (version: string): number[] => {
      return version.split('.').map(Number);
    };

    const partsA = parseVersion(a);
    const partsB = parseVersion(b);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;

      if (partA !== partB) {
        return partA - partB;
      }
    }

    return 0;
  }

  // 获取版本的发布日期（从配置或使用当前日期）
  private getReleaseDate(version: string): string {
    // 这里可以根据需要扩展，比如从Git历史记录获取
    // 现在简单返回当前日期
    return new Date().toISOString().split('T')[0];
  }
}

// 导出单例实例
export const updateService = new UpdateService();

// 导出便捷函数
export const useUpdateService = () => {
  return {
    currentVersion: updateService.getCurrentVersion(),
    getVersionInfo: updateService.getVersionInfo.bind(updateService),
    getAllUpdates: updateService.getAllUpdates.bind(updateService),
    getLatestVersion: updateService.getLatestVersion.bind(updateService),
    hasUnreadImportantUpdate: updateService.hasUnreadImportantUpdate.bind(updateService),
    getUserPreferences: updateService.getUserPreferences.bind(updateService),
    markVersionAsRead: updateService.markVersionAsRead.bind(updateService),
    dismissVersion: updateService.dismissVersion.bind(updateService),
    shouldShowUpdateNotice: updateService.shouldShowUpdateNotice.bind(updateService),
  };
};

// 调试工具函数 - 仅用于开发调试
export const debugUpdateService = {
  // 获取当前状态摘要
  getStatus: () => {
    console.log('UPDATE SERVICE DEBUG STATUS');
    console.log(`Current Version: ${updateService.getCurrentVersion()}`);
    console.log(`Latest Version: ${updateService.getLatestVersion()?.version || 'none'}`);
    console.log(`User Preferences:`, updateService.getUserPreferences());
    console.log(`Should Show Notice: ${updateService.shouldShowUpdateNotice()}`);
    console.log(`Has Unread Important: ${updateService.hasUnreadImportantUpdate()}`);
    console.log('Available Updates:');
    Object.entries(updateService.getAllUpdates()).forEach(([version, info]) => {
      console.log(`  ${version}: important=${info.important}, notes=${info.notes.zh?.length || 0} items`);
    });
    console.log('UPDATE SERVICE DEBUG STATUS END');
  },

  // 重置用户偏好（用于测试）
  resetPreferences: () => {
    console.log('Resetting user preferences to default');
    const defaultPrefs = {
      lastReadVersion: '',
      dismissedVersions: [],
      autoCheck: true
    };
    updateService.saveUserPreferences(defaultPrefs);
  },

  // 模拟读取某个版本
  markVersionAsRead: (version: string) => {
    console.log(`Force marking version ${version} as read`);
    updateService.markVersionAsRead(version);
  },

  // 模拟忽略某个版本
  dismissVersion: (version: string) => {
    console.log(`Force dismissing version ${version}`);
    updateService.dismissVersion(version);
  }
};

// 在开发环境中自动注册到全局作用域
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).kchatDebug = {
    ...(window as any).kchatDebug,
    update: debugUpdateService
  };
  console.log('UpdateService debug functions available');
}