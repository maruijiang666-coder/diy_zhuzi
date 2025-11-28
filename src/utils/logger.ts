/**
 * 日志级别
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

/**
 * 日志配置
 */
interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  enableRemote: boolean // 是否启用远程日志上报
}

/**
 * 默认配置
 */
const defaultConfig: LoggerConfig = {
  enabled: true,
  level: LogLevel.INFO,
  enableRemote: false,
}

let config: LoggerConfig = { ...defaultConfig }

/**
 * 配置日志工具
 * @param newConfig 新的配置
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig }
}

/**
 * 格式化日志消息
 * @param level 日志级别
 * @param message 日志消息
 * @param data 附加数据
 * @returns 格式化后的日志字符串
 */
function formatLog(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `[${timestamp}] [${level}] ${message}${dataStr}`
}

/**
 * 上报日志到远程服务器（可选功能）
 * @param level 日志级别
 * @param message 日志消息
 * @param data 附加数据
 */
async function reportToRemote(
  level: LogLevel,
  message: string,
  data?: any
): Promise<void> {
  if (!config.enableRemote) {
    return
  }

  try {
    // TODO: 集成实际的日志上报服务（如Sentry、阿里云日志等）
    // 这里只是示例，实际项目中需要替换为真实的上报逻辑
    // await fetch('/api/logs', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     level,
    //     message,
    //     data,
    //     timestamp: Date.now(),
    //   }),
    // })
    // 暂时使用console避免未使用变量警告
    void level
    void message
    void data
  } catch (err) {
    // 上报失败时不影响主流程
    console.error('[Logger] 日志上报失败', err)
  }
}

/**
 * 记录信息日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function info(message: string, data?: any): void {
  if (!config.enabled) {
    return
  }

  const log = formatLog(LogLevel.INFO, message, data)
  console.log(log)

  reportToRemote(LogLevel.INFO, message, data)
}

/**
 * 记录警告日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function warn(message: string, data?: any): void {
  if (!config.enabled) {
    return
  }

  const log = formatLog(LogLevel.WARN, message, data)
  console.warn(log)

  reportToRemote(LogLevel.WARN, message, data)
}

/**
 * 记录错误日志
 * @param message 日志消息
 * @param err 错误对象或附加数据
 */
export function error(message: string, err?: Error | any): void {
  if (!config.enabled) {
    return
  }

  const errorData = err instanceof Error
    ? {
        name: err.name,
        message: err.message,
        stack: err.stack,
      }
    : err

  const log = formatLog(LogLevel.ERROR, message, errorData)
  console.error(log)

  reportToRemote(LogLevel.ERROR, message, errorData)
}

/**
 * 记录调试日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function debug(message: string, data?: any): void {
  if (!config.enabled || config.level !== LogLevel.DEBUG) {
    return
  }

  const log = formatLog(LogLevel.DEBUG, message, data)
  console.debug(log)
}

/**
 * 埋点追踪
 * @param event 事件名称
 * @param properties 事件属性
 */
export function track(event: string, properties?: Record<string, any>): void {
  if (!config.enabled) {
    return
  }

  const trackData = {
    event,
    properties,
    timestamp: Date.now(),
  }

  console.log(`[TRACK] ${event}`, properties)

  // TODO: 集成实际的埋点服务（如友盟、神策等）
  // 这里只是示例，实际项目中需要替换为真实的埋点逻辑
  reportToRemote(LogLevel.INFO, `Track: ${event}`, trackData)
}

/**
 * 导出默认logger对象
 */
export const logger = {
  info,
  warn,
  error,
  debug,
  track,
  configure: configureLogger,
}

export default logger
