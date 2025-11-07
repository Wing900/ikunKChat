/**
 * 性能监控日志工具
 * 用于追踪和记录应用性能指标
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceLogger {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean = true;

  /**
   * 记录性能指标
   */
  log(name: string, duration: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // 控制台输出
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms${metaStr}`);

    // 如果耗时超过阈值，发出警告
    if (duration > 100) {
      console.warn(`[Performance Warning] ${name} 耗时过长: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.log(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.log(`${name} (Error)`, duration, { ...metadata, error: String(error) });
      throw error;
    }
  }

  /**
   * 创建性能追踪器
   */
  startTrace(name: string): () => void {
    const startTime = performance.now();
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.log(name, duration, metadata);
    };
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const durations = this.metrics.map(m => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const sorted = [...durations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: this.metrics.length,
      total: sum,
      average: avg,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50,
      p90,
      p99
    };
  }

  /**
   * 按名称分组统计
   */
  getStatsByName(): Record<string, ReturnType<typeof this.getStats>> {
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    const stats: Record<string, any> = {};
    for (const [name, metrics] of Object.entries(grouped)) {
      const durations = metrics.map(m => m.duration);
      const sum = durations.reduce((a, b) => a + b, 0);
      const sorted = [...durations].sort((a, b) => a - b);
      
      stats[name] = {
        count: metrics.length,
        total: sum,
        average: sum / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }

    return stats;
  }

  /**
   * 清除所有指标
   */
  clear() {
    this.metrics = [];
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * 导出性能报告
   */
  generateReport(): string {
    const stats = this.getStatsByName();
    let report = '\n========== 性能报告 ==========\n\n';

    for (const [name, stat] of Object.entries(stats)) {
      report += `📊 ${name}\n`;
      report += `   次数: ${stat.count}\n`;
      report += `   平均: ${stat.average.toFixed(2)}ms\n`;
      report += `   最小: ${stat.min.toFixed(2)}ms\n`;
      report += `   最大: ${stat.max.toFixed(2)}ms\n`;
      report += `   P50: ${stat.p50.toFixed(2)}ms\n`;
      report += `   P90: ${stat.p90.toFixed(2)}ms\n`;
      report += `   P99: ${stat.p99.toFixed(2)}ms\n\n`;
    }

    report += '==============================\n';
    return report;
  }

  /**
   * 打印性能报告到控制台
   */
  printReport() {
    console.log(this.generateReport());
  }
}

// 导出单例
export const performanceLogger = new PerformanceLogger();

// 便捷函数
export const logPerformance = (name: string, duration: number, metadata?: Record<string, any>) => {
  performanceLogger.log(name, duration, metadata);
};

export const measurePerformance = <T>(
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceLogger.measure(name, fn, metadata);
};

export const startPerformanceTrace = (name: string) => {
  return performanceLogger.startTrace(name);
};