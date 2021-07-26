import winston, { Logger, LoggerOptions } from 'winston'
import escFormat from '@elastic/ecs-winston-format'
import { ReadonlyConfig } from '../../types'

export class LoggingService {
  private loggerOptions: LoggerOptions

  private constructor(options: LoggerOptions) {
    this.loggerOptions = options
  }

  public static withAppConfig(config: ReadonlyConfig): LoggingService {
    const transports: winston.LoggerOptions['transports'] = [
      new winston.transports.File({
        filename: `${config.directories.logs}/logs.json`,
        level: config.log?.file || 'debug',
      }),
    ]
    if (config.log?.console) {
      transports.push(
        new winston.transports.Console({
          level: config.log.console,
        })
      )
    }
    return new LoggingService({
      format: escFormat(),
      transports,
    })
  }

  public static withCLIConfig(): LoggingService {
    const colors = {
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      debug: 'grey',
    }

    winston.addColors(colors)

    const format = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => `${info.timestamp} ${info.label} ${info.level}: ${info.message}`)
    )
    return new LoggingService({
      transports: new winston.transports.Console({
        // Log everything to stderr, only the command output value will be written to stdout
        stderrLevels: Object.keys(winston.config.npm.levels),
      }),
      format,
    })
  }

  public createLogger(label: string): Logger {
    return winston.createLogger({
      ...this.loggerOptions,
      defaultMeta: { label },
    })
  }
}