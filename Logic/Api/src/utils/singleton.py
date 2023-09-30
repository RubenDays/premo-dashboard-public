def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        # hash the class and the args, so it will create a new instance if the args are different
        h = hash(str(cls)+str(args))
        if h not in instances:
            instances[h] = cls(*args, **kwargs)
            
        return instances[h]    
    
    return get_instance
