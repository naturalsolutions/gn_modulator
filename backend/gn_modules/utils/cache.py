global_cache = {}


class CacheKeysNotListError(Exception):
    """
    Pour éviter les cas où l'on utilise les fonctions de global_cache
    en mettant un str à la place d'une liste pour keys
    """

    pass


def clear_global_cache():
    """
    RAZ global cache
    """
    global_cache_keys = list(global_cache.keys())
    for key in global_cache_keys:
        del global_cache[key]


def get_global_cache(keys, default=None):

    if not isinstance(keys, list):
        raise CacheKeysNotListError(f"La variable 'keys' n'est pas une liste {keys}")
    current = global_cache
    for key in keys:
        current = current.get(key)
        if current is None:
            return default

    return current


def set_global_cache(keys, value):

    if not isinstance(keys, list):
        raise CacheKeysNotListError(f"La variable 'keys' n'est pas une liste {keys}")

    current = global_cache

    for index, key in enumerate(keys):

        if index == len(keys) - 1:
            current[key] = value
        else:
            current[key] = current.get(key) or {}
            current = current[key]
