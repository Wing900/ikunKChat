export interface PerformanceMetrics {
  // 虚拟滚动相关
  visibleMessages: number;
  totalMessages: number;
  renderTime: number;
  
  // 公式渲染相关
  mathExpressions: number;
  renderMethod: 'lazy' | 'eager' | 'virtual';
  mathRenderTime: number;
  
  // 详细的任务耗时记录
  taskBreakdown: {
    jsonReadTime: number;        // JSON数据读取耗时
    markdownParseTime: number;   // Markdown解析耗时
    mathExtractionTime: number;  // 公式提取耗时
    katexRenderTime: number;     // KaTeX渲染耗时
    domUpdateTime: number;       // DOM更新耗时
    totalProcessingTime: number; // 总处理时间
  };
  
  // 内存使用
  memoryUsage?: number;
  
  // 时间戳
  timestamp: number;
  sessionId: string;
}

export class RenderingPerformanceMonitor {
  private static instance: RenderingPerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private sessionId: string;
  private observer: PerformanceObserver | null = null;

  private constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): RenderingPerformanceMonitor {
    if (!RenderingPerformanceMonitor.instance) {
      RenderingPerformanceMonitor.instance = new RenderingPerformanceMonitor();
    }
    return RenderingPerformanceMonitor.instance;
  }

  // 记录虚拟滚动性能
  recordVirtualScrollRender(totalMessages: number, renderTime: number) {
    const metrics: PerformanceMetrics = {
      visibleMessages: 0, // 这个会在后续计算
      totalMessages,
      renderTime,
      mathExpressions: 0,
      renderMethod: 'virtual',
      mathRenderTime: 0,
      taskBreakdown: {
        jsonReadTime: 0,
        markdownParseTime: 0,
        mathExtractionTime: 0,
        katexRenderTime: 0,
        domUpdateTime: 0,
        totalProcessingTime: renderTime
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.metrics.push(metrics);
    this.logMetrics('Virtual Scroll Render', metrics);
  }

  // 记录公式渲染性能
  recordMathRender(mathExpressions: number, renderTime: number, method: 'lazy' | 'eager') {
    const metrics: PerformanceMetrics = {
      visibleMessages: 0,
      totalMessages: 0,
      renderTime: 0,
      mathExpressions,
      renderMethod: method,
      mathRenderTime: renderTime,
      taskBreakdown: {
        jsonReadTime: 0,
        markdownParseTime: 0,
        mathExtractionTime: 0,
        katexRenderTime: renderTime,
        domUpdateTime: 0,
        totalProcessingTime: renderTime
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.metrics.push(metrics);
    this.logMetrics('Math Render', metrics);
  }

  // 记录完整消息渲染
  recordMessageRender(params: {
    visibleMessages: number;
    totalMessages: number;
    mathExpressions: number;
    renderTime: number;
    mathRenderTime: number;
    method: 'lazy' | 'eager';
    taskBreakdown?: {
      jsonReadTime: number;
      markdownParseTime: number;
      mathExtractionTime: number;
      katexRenderTime: number;
      domUpdateTime: number;
      totalProcessingTime: number;
    };
  }) {
    const defaultTaskBreakdown = {
      jsonReadTime: 0,
      markdownParseTime: 0,
      mathExtractionTime: 0,
      katexRenderTime: params.mathRenderTime,
      domUpdateTime: 0,
      totalProcessingTime: params.renderTime
    };

    const metrics: PerformanceMetrics = {
      visibleMessages: params.visibleMessages,
      totalMessages: params.totalMessages,
      renderTime: params.renderTime,
      mathExpressions: params.mathExpressions,
      renderMethod: params.method,
      mathRenderTime: params.mathRenderTime,
      taskBreakdown: params.taskBreakdown || defaultTaskBreakdown,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // 如果有性能观察器，发送数据
    if (this.observer) {
      try {
        this.observer.takeRecords().forEach(entry => {
          if (entry.entryType === 'measure') {
            // 发送性能数据到分析服务
            this.sendMetrics(metrics);
          }
        });
      } catch (error) {
        console.warn('Performance monitoring error:', error);
      }
    }

    this.metrics.push(metrics);
    this.logMetrics('Complete Message Render', metrics);
  }

  // 获取详细性能报告
  getDetailedPerformanceReport(): {
    averageRenderTime: number;
    averageMathRenderTime: number;
    totalMessages: number;
    efficiency: number;
    taskBreakdown: {
      averageJsonReadTime: number;
      averageMarkdownParseTime: number;
      averageMathExtractionTime: number;
      averageKatexRenderTime: number;
      averageDomUpdateTime: number;
    };
    recommendations: string[];
    detailedMetrics: PerformanceMetrics[];
  } {
    const recentMetrics = this.metrics.slice(-10); // 最近10次记录

    if (recentMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMathRenderTime: 0,
        totalMessages: 0,
        efficiency: 0,
        taskBreakdown: {
          averageJsonReadTime: 0,
          averageMarkdownParseTime: 0,
          averageMathExtractionTime: 0,
          averageKatexRenderTime: 0,
          averageDomUpdateTime: 0,
        },
        recommendations: ['暂无性能数据'],
        detailedMetrics: []
      };
    }

    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    const avgMathRenderTime = recentMetrics.reduce((sum, m) => sum + m.mathRenderTime, 0) / recentMetrics.length;
    const totalMessages = recentMetrics.reduce((sum, m) => sum + m.totalMessages, 0);
    
    // 计算任务分解的平均耗时
    const taskBreakdown = {
      averageJsonReadTime: recentMetrics.reduce((sum, m) => sum + m.taskBreakdown.jsonReadTime, 0) / recentMetrics.length,
      averageMarkdownParseTime: recentMetrics.reduce((sum, m) => sum + m.taskBreakdown.markdownParseTime, 0) / recentMetrics.length,
      averageMathExtractionTime: recentMetrics.reduce((sum, m) => sum + m.taskBreakdown.mathExtractionTime, 0) / recentMetrics.length,
      averageKatexRenderTime: recentMetrics.reduce((sum, m) => sum + m.taskBreakdown.katexRenderTime, 0) / recentMetrics.length,
      averageDomUpdateTime: recentMetrics.reduce((sum, m) => sum + m.taskBreakdown.domUpdateTime, 0) / recentMetrics.length,
    };
    
    // 计算效率 (可见消息数/总消息数)
    const avgVisibleRatio = recentMetrics.reduce((sum, m) => {
      return m.totalMessages > 0 ? sum + (m.visibleMessages / m.totalMessages) : sum;
    }, 0) / recentMetrics.length;
    
    const efficiency = Math.round(avgVisibleRatio * 100);

    const recommendations = this.generateDetailedRecommendations(avgRenderTime, avgMathRenderTime, efficiency, taskBreakdown);

    return {
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      averageMathRenderTime: Math.round(avgMathRenderTime * 100) / 100,
      totalMessages,
      efficiency,
      taskBreakdown: {
        averageJsonReadTime: Math.round(taskBreakdown.averageJsonReadTime * 100) / 100,
        averageMarkdownParseTime: Math.round(taskBreakdown.averageMarkdownParseTime * 100) / 100,
        averageMathExtractionTime: Math.round(taskBreakdown.averageMathExtractionTime * 100) / 100,
        averageKatexRenderTime: Math.round(taskBreakdown.averageKatexRenderTime * 100) / 100,
        averageDomUpdateTime: Math.round(taskBreakdown.averageDomUpdateTime * 100) / 100,
      },
      recommendations,
      detailedMetrics: recentMetrics
    };
  }

  // 获取性能报告（保持向后兼容）
  getPerformanceReport() {
    const detailedReport = this.getDetailedPerformanceReport();
    return {
      averageRenderTime: detailedReport.averageRenderTime,
      averageMathRenderTime: detailedReport.averageMathRenderTime,
      totalMessages: detailedReport.totalMessages,
      efficiency: detailedReport.efficiency,
      recommendations: detailedReport.recommendations
    };
  }

  // 初始化性能观察
  initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
            }
          });
        });
        
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  // 清理资源
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.metrics = [];
  }

  private logMetrics(type: string, metrics: PerformanceMetrics) {
    const logData = {
      type,
      session: this.sessionId,
      ...metrics
    };
    
    // 开发环境下输出详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${type}:`, logData);
    }
    
    // 发送性能数据到分析服务（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.sendMetrics(metrics);
    }
  }

  private generateRecommendations(avgRenderTime: number, avgMathRenderTime: number, efficiency: number): string[] {
    const recommendations: string[] = [];

    if (avgRenderTime > 1000) {
      recommendations.push(`🚨 总渲染时间过长 (${avgRenderTime.toFixed(0)}ms)，需要重点优化`);
    } else if (avgRenderTime > 500) {
      recommendations.push(`⚠️ 渲染时间偏长 (${avgRenderTime.toFixed(0)}ms)，建议优化`);
    }

    if (avgMathRenderTime > 300) {
      recommendations.push('🧮 公式渲染时间过长，建议启用更强的懒加载策略');
    }

    if (efficiency < 80) {
      recommendations.push('📈 分批渲染效果良好，但可进一步优化批次大小');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 性能表现良好，继续保持当前策略');
    }

    return recommendations;
  }

  // 生成详细建议
  private generateDetailedRecommendations(
    avgRenderTime: number,
    avgMathRenderTime: number,
    efficiency: number,
    taskBreakdown: any
  ): string[] {
    const recommendations: string[] = [];

    // 基于总渲染时间
    if (avgRenderTime > 1000) {
      recommendations.push(`🚨 总渲染时间过长 (${avgRenderTime.toFixed(0)}ms)，需要重点优化`);
    } else if (avgRenderTime > 500) {
      recommendations.push(`⚠️ 渲染时间偏长 (${avgRenderTime.toFixed(0)}ms)，建议优化`);
    }

    // 基于任务分解的耗时分析
    const tasks = [
      { name: 'JSON读取', time: taskBreakdown.averageJsonReadTime, threshold: 50 },
      { name: 'Markdown解析', time: taskBreakdown.averageMarkdownParseTime, threshold: 100 },
      { name: '公式提取', time: taskBreakdown.averageMathExtractionTime, threshold: 30 },
      { name: 'KaTeX渲染', time: taskBreakdown.averageKatexRenderTime, threshold: 200 },
      { name: 'DOM更新', time: taskBreakdown.averageDomUpdateTime, threshold: 100 }
    ];

    tasks.forEach(task => {
      if (task.time > task.threshold) {
        const percentage = (task.time / avgRenderTime * 100).toFixed(1);
        recommendations.push(`📊 ${task.name}耗时过长: ${task.time.toFixed(0)}ms (${percentage}%)`);
      }
    });

    // 基于公式渲染时间
    if (avgMathRenderTime > 300) {
      recommendations.push('🧮 公式渲染时间过长，建议启用更强的懒加载策略');
    }

    // 基于效率
    if (efficiency < 80) {
      recommendations.push('📈 分批渲染效果良好，但可进一步优化批次大小');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 性能表现良好，继续保持当前策略');
    }

    return recommendations;
  }

  private sendMetrics(metrics: PerformanceMetrics) {
    // 这里可以发送数据到分析服务
    // 例如：Google Analytics, 自建监控系统等
    try {
      // 模拟发送数据
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'performance_metrics', {
          event_category: 'rendering',
          event_label: 'chat_performance',
          value: Math.round(metrics.renderTime),
          custom_parameters: {
            session_id: metrics.sessionId,
            math_expressions: metrics.mathExpressions,
            efficiency: metrics.visibleMessages / Math.max(metrics.totalMessages, 1)
          }
        });
      }
    } catch (error) {
      console.warn('Failed to send metrics:', error);
    }
  }
}

// 创建全局实例
export const performanceMonitor = RenderingPerformanceMonitor.getInstance();