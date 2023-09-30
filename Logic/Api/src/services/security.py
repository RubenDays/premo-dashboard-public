import yaml
from passlib.context import CryptContext


with open("./configs/security.yaml", "r", encoding='utf8') as f:
    yaml_config = yaml.load(f, Loader=yaml.FullLoader)

security_config = yaml_config['pwd']
secret_key: str = security_config['secret_key']
algorithm: str = security_config['algorithm']
access_token_expire_mins: float = security_config['access_token_expire_mins']
refresh_token_expire_mins: float = security_config['refresh_token_expire_mins']
default_password: str = security_config['default_password']
pwd_context: CryptContext = CryptContext(schemes=['argon2'], deprecated='auto')
