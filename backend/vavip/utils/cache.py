"""
Caching utilities using Redis.
"""
from functools import wraps
from typing import Optional, Callable, Any
import json
import hashlib


def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate cache key from prefix and arguments."""
    key_data = f"{prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
    key_hash = hashlib.md5(key_data.encode()).hexdigest()
    return f"cache:{prefix}:{key_hash}"


def cache_result(ttl: int = 3600, prefix: str = "default"):
    """
    Decorator to cache function results in Redis.
    
    Args:
        ttl: Time to live in seconds
        prefix: Cache key prefix
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            from ..extensions import redis_client
            
            if redis_client is None:
                # If Redis is not available, just call the function
                return func(*args, **kwargs)
            
            # Generate cache key
            cache_key = get_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                try:
                    return json.loads(cached)
                except json.JSONDecodeError:
                    pass
            
            # Call function and cache result
            result = func(*args, **kwargs)
            
            try:
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
            except Exception:
                # If caching fails, just return result
                pass
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(prefix: str):
    """
    Invalidate all cache entries with given prefix.
    
    Args:
        prefix: Cache key prefix to invalidate
    """
    from ..extensions import redis_client
    
    if redis_client is None:
        return
    
    try:
        pattern = f"cache:{prefix}:*"
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass




