/**
 * 性能监控工具
 * 用于跟踪附件加载的性能指标
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private enabled: boolean = true;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始计时
   * @param name 计时器名称
   */
  public startTimer(name: string): void {
    if (!this.enabled) return;
    this.metrics.set(name, [...(this.metrics.get(name) || []), performance.now()]);
  }

  /**
   * 结束计时并记录耗时
   * @param name 计时器名称
   * @returns 耗时（毫秒）
   */
  public endTimer(name: string): number {
    if (!this.enabled) return 0;

    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;

    const startTime = times[times.length - 1];
    const endTime = performance.now();
    const duration = endTime - startTime;

    // 保留前10次记录
    const recentTimes = times.slice(-9);
    this.metrics.set(name, [...recentTimes, duration]);

    if (process.env.NODE_ENV === 'development') {
      console.log(`性能监控 - ${name}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  /**
   * 获取平均耗时
   * @param name 计时器名称
   * @returns 平均耗时（毫秒）
   */
  public getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    return totalTime / times.length;
  }

  /**
   * 打印所有性能指标
   */
  public logMetrics(): void {
    if (!this.enabled || process.env.NODE_ENV !== 'development') return;

    console.group('性能指标汇总');
    this.metrics.forEach((times, name) => {
      const average = this.getAverageTime(name);
      const latest = times[times.length - 1];
      console.log(`${name}: 平均 ${average.toFixed(2)}ms, 最近 ${latest.toFixed(2)}ms, 总计 ${times.length}次`);
    });
    console.groupEnd();
  }

  /**
   * 清除所有指标
   */
  public clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * 启用/禁用性能监控
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearMetrics();
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();