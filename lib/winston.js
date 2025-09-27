import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'log');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'axiom-backend' },
    transports: [
        new DailyRotateFile({
            filename: path.join(logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
            level: 'info',
        }),
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '30d',
            level: 'error',
        }),
    ],
});

// Add Console transport based on environment
if (process.env.NODE_ENV !== 'production') {
    // Development: colorized and simple format
    logger.add(
        new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
        })
    );
} else {
    // Production: JSON format for better parsing
    logger.add(
        new transports.Console({
            format: format.json(),
        })
    );
}

// // Add backwards compatibility for logger.info() calls without level
// const originalLog = logger.info;
// logger.info = function () {
//     // If only one argument is provided and it's a string, assume 'info' level
//     if (arguments.length === 1 && typeof arguments[0] === 'string') {
//         return originalLog.call(this, 'info', arguments[0]);
//     }
//     return originalLog.apply(this, arguments);
// };

export default logger;
