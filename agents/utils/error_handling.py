"""
Error Handling Utilities for Agents
====================================
Provides consistent error handling patterns, retry logic, and connection recovery
for all agent components.
"""

import asyncio
import logging
import time
import functools
from typing import Callable, TypeVar, Optional, Any, Dict, List
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

T = TypeVar('T')


class ErrorSeverity(Enum):
    """Error severity levels for monitoring and alerting"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorContext:
    """Context information for error reporting"""
    error_type: str
    error_message: str
    severity: ErrorSeverity
    component: str
    operation: str
    metadata: Dict[str, Any]
    timestamp: str
    traceback: Optional[str] = None


class RetryableError(Exception):
    """Base exception for errors that should be retried"""
    pass


class NonRetryableError(Exception):
    """Base exception for errors that should not be retried"""
    pass


class ConnectionError(RetryableError):
    """Connection-related errors (Redis, HTTP, etc.)"""
    pass


class ValidationError(NonRetryableError):
    """Data validation errors"""
    pass


class ConfigurationError(NonRetryableError):
    """Configuration errors"""
    pass


def retry_with_backoff(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    retryable_exceptions: tuple = (Exception,),
    on_retry: Optional[Callable[[Exception, int], None]] = None
):
    """
    Decorator for retrying functions with exponential backoff.
    
    Args:
        max_attempts: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff
        retryable_exceptions: Tuple of exception types to retry on
        on_retry: Optional callback function called on each retry
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {max_attempts} attempts: {e}",
                            exc_info=True
                        )
                        raise
                    
                    delay = min(
                        initial_delay * (exponential_base ** (attempt - 1)),
                        max_delay
                    )
                    logger.warning(
                        f"{func.__name__} failed (attempt {attempt}/{max_attempts}): {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    
                    if on_retry:
                        try:
                            on_retry(e, attempt)
                        except Exception as callback_error:
                            logger.warning(f"Retry callback failed: {callback_error}")
                    
                    await asyncio.sleep(delay)
                except Exception as e:
                    # Non-retryable exception
                    logger.error(f"{func.__name__} failed with non-retryable error: {e}", exc_info=True)
                    raise
            
            # Should never reach here, but type checker needs it
            raise last_exception  # type: ignore
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {max_attempts} attempts: {e}",
                            exc_info=True
                        )
                        raise
                    
                    delay = min(
                        initial_delay * (exponential_base ** (attempt - 1)),
                        max_delay
                    )
                    logger.warning(
                        f"{func.__name__} failed (attempt {attempt}/{max_attempts}): {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    
                    if on_retry:
                        try:
                            on_retry(e, attempt)
                        except Exception as callback_error:
                            logger.warning(f"Retry callback failed: {callback_error}")
                    
                    time.sleep(delay)
                except Exception as e:
                    # Non-retryable exception
                    logger.error(f"{func.__name__} failed with non-retryable error: {e}", exc_info=True)
                    raise
            
            # Should never reach here, but type checker needs it
            raise last_exception  # type: ignore
        
        # Return appropriate wrapper based on whether function is async
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def handle_redis_error(
    operation: str,
    component: str,
    error: Exception,
    context: Optional[Dict[str, Any]] = None
) -> ErrorContext:
    """
    Handle Redis-related errors with proper context.
    
    Returns:
        ErrorContext object for logging/monitoring
    """
    error_type = type(error).__name__
    severity = ErrorSeverity.HIGH
    
    # Determine if error is retryable
    if isinstance(error, (ConnectionError, TimeoutError, OSError)):
        severity = ErrorSeverity.CRITICAL
    elif "timeout" in str(error).lower() or "connection" in str(error).lower():
        severity = ErrorSeverity.HIGH
    
    error_context = ErrorContext(
        error_type=error_type,
        error_message=str(error),
        severity=severity,
        component=component,
        operation=operation,
        metadata=context or {},
        timestamp=datetime.utcnow().isoformat()
    )
    
    logger.error(
        f"[{component}] Redis error in {operation}: {error}",
        extra={"error_context": error_context.__dict__},
        exc_info=True
    )
    
    return error_context


def handle_validation_error(
    operation: str,
    component: str,
    error: Exception,
    data: Optional[Any] = None
) -> ErrorContext:
    """
    Handle data validation errors.
    """
    error_context = ErrorContext(
        error_type=type(error).__name__,
        error_message=str(error),
        severity=ErrorSeverity.MEDIUM,
        component=component,
        operation=operation,
        metadata={"data_sample": str(data)[:200] if data else None},
        timestamp=datetime.utcnow().isoformat()
    )
    
    logger.warning(
        f"[{component}] Validation error in {operation}: {error}",
        extra={"error_context": error_context.__dict__}
    )
    
    return error_context


async def safe_redis_operation(
    operation: Callable,
    operation_name: str,
    component: str,
    max_retries: int = 3,
    default_return: Any = None,
    **kwargs
) -> Any:
    """
    Safely execute a Redis operation with retry logic.
    
    Args:
        operation: Async Redis operation to execute
        operation_name: Name of operation for logging
        component: Component name for logging
        max_retries: Maximum retry attempts
        default_return: Value to return if all retries fail
        **kwargs: Arguments to pass to operation
    
    Returns:
        Result of operation or default_return if all retries fail
    """
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            if asyncio.iscoroutinefunction(operation):
                return await operation(**kwargs)
            else:
                return operation(**kwargs)
        except Exception as e:
            last_error = e
            handle_redis_error(operation_name, component, e, {"attempt": attempt})
            
            if attempt < max_retries:
                delay = min(1.0 * (2 ** (attempt - 1)), 10.0)
                await asyncio.sleep(delay)
            else:
                logger.error(
                    f"[{component}] Redis operation {operation_name} failed after {max_retries} attempts"
                )
                if default_return is not None:
                    return default_return
                raise
    
    # Should never reach here
    if default_return is not None:
        return default_return
    raise last_error  # type: ignore


def log_error_with_context(
    error: Exception,
    component: str,
    operation: str,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Optional[Dict[str, Any]] = None,
    include_traceback: bool = True
):
    """
    Log error with structured context.
    """
    error_context = ErrorContext(
        error_type=type(error).__name__,
        error_message=str(error),
        severity=severity,
        component=component,
        operation=operation,
        metadata=context or {},
        timestamp=datetime.utcnow().isoformat()
    )
    
    log_level = {
        ErrorSeverity.LOW: logging.INFO,
        ErrorSeverity.MEDIUM: logging.WARNING,
        ErrorSeverity.HIGH: logging.ERROR,
        ErrorSeverity.CRITICAL: logging.CRITICAL
    }[severity]
    
    logger.log(
        log_level,
        f"[{component}] Error in {operation}: {error}",
        extra={"error_context": error_context.__dict__},
        exc_info=include_traceback
    )


class ConnectionManager:
    """
    Manages connection lifecycle with automatic reconnection.
    """
    
    def __init__(
        self,
        connect_func: Callable,
        disconnect_func: Optional[Callable] = None,
        component_name: str = "component",
        max_reconnect_attempts: int = 5,
        reconnect_delay: float = 2.0
    ):
        self.connect_func = connect_func
        self.disconnect_func = disconnect_func
        self.component_name = component_name
        self.max_reconnect_attempts = max_reconnect_attempts
        self.reconnect_delay = reconnect_delay
        self.connection = None
        self.is_connected = False
        self._reconnect_lock = asyncio.Lock()
    
    async def ensure_connected(self) -> bool:
        """Ensure connection is active, reconnect if needed."""
        if self.is_connected and self.connection:
            return True
        
        async with self._reconnect_lock:
            # Double-check after acquiring lock
            if self.is_connected and self.connection:
                return True
            
            for attempt in range(1, self.max_reconnect_attempts + 1):
                try:
                    if asyncio.iscoroutinefunction(self.connect_func):
                        self.connection = await self.connect_func()
                    else:
                        self.connection = self.connect_func()
                    
                    self.is_connected = True
                    logger.info(f"[{self.component_name}] Connection established")
                    return True
                except Exception as e:
                    handle_redis_error(
                        "reconnect",
                        self.component_name,
                        e,
                        {"attempt": attempt}
                    )
                    
                    if attempt < self.max_reconnect_attempts:
                        await asyncio.sleep(self.reconnect_delay * attempt)
                    else:
                        logger.error(
                            f"[{self.component_name}] Failed to reconnect after "
                            f"{self.max_reconnect_attempts} attempts"
                        )
                        return False
        
        return False
    
    async def disconnect(self):
        """Disconnect and cleanup."""
        if self.disconnect_func and self.connection:
            try:
                if asyncio.iscoroutinefunction(self.disconnect_func):
                    await self.disconnect_func(self.connection)
                else:
                    self.disconnect_func(self.connection)
            except Exception as e:
                logger.warning(f"[{self.component_name}] Error during disconnect: {e}")
        
        self.connection = None
        self.is_connected = False

