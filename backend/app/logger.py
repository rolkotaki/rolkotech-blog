from datetime import datetime, timezone
import json
import logging
from logging.config import dictConfig
import os


__all__ = ["logger"]


logger_name = "app"
log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "backend.log")


class JsonFormatter(logging.Formatter):

    def format(self, record):
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
            "message": record.getMessage(),
            "exception": ""
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record)


log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(module)s %(filename)s %(lineno)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {
            "()": JsonFormatter
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "DEBUG",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
        "rotating_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "json",
            "filename": log_path,
            "maxBytes": 10485760,  # 10 MB
            "backupCount": 5,
        },
    },
    "loggers": {
        logger_name: {
            "handlers": ["console", "rotating_file"],
            "level": "DEBUG", 
            "propagate": False
        },
    },
    "root": {"handlers": ["console"], "level": "DEBUG"}
}

dictConfig(log_config)
logger = logging.getLogger(logger_name)
