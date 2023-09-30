import pymongo
import gridfs
from fastapi import UploadFile
from zipfile import ZipInfo
import pika

from src.exceptions.CustomExceptions import GatewayTimeoutException
from src.services.servicesInterfaces.ImportServicesInt import ImportServicesInt
from src.utils.logger import get_app_logger
import src.utils.global_vars as global_vars


class ImportServices(ImportServicesInt):

    def __init__(self):
        self.__LOGGER = get_app_logger()
        self.__mongoclient = pymongo.MongoClient(global_vars.MONGO_URI,
                                                 username=global_vars.MONGO_USER,
                                                 password=global_vars.MONGO_PASSWORD)

        self.__connection = None
        self.__channel = None

        try:
            self.__open_connection()
            self.__open_channel()
        except:
            self.__LOGGER.warning('Could not connect to MQ')

    def __is_file_excel(self, zip_info: ZipInfo):
        if not zip_info:
            return False

        file_extension = zip_info.filename.split(".")[-1]

        return file_extension in ['xls', 'xlsx', 'csv']

    def import_data(self, zip_file: UploadFile):
        # maybe do some verifications?

        # extract bytes
        data = zip_file.file.read()

        # ### put file and the document in mongodb
        db = self.__mongoclient["premo"]
        fs = gridfs.GridFS(db)

        # put file in db
        try:
            f = fs.put(data)
        except pymongo.errors.ServerSelectionTimeoutError as e:
            raise GatewayTimeoutException(content={'service': 'mongo', 'cause': 'could not connect'})

        table = db["dataupload"]

        # create new document (entry)
        newdoc = {
            "filename": zip_file.filename,
            "status": "NOT STARTED",
            "progress": {},
            "file": f
        }

        # put the new entry in db
        new_obj = table.insert_one(newdoc)

        # ### send message to MQ
        # verify connection and channel
        try:
            if not self.__connection or self.__connection.is_closed:
                self.__open_connection()
                self.__open_channel()
            elif not self.__channel or self.__channel.is_closed:
                self.__open_channel()
        except Exception as e:
            raise GatewayTimeoutException(content={'service': 'mq', 'cause': 'could not connect'})


        # publish message
        ins_id = str(new_obj.inserted_id)

        body: bytes = ins_id.encode(encoding='UTF-8')

        self.__channel.basic_publish(exchange=global_vars.MQ_EXCHANGE, routing_key=global_vars.MQ_ROUTING_KEY, body=body)

        # ### return
        return ins_id

    def __open_connection(self):
        self.__connection = pika.BlockingConnection(pika.ConnectionParameters(host=global_vars.MQ_HOST, port=global_vars.MQ_PORT))

    def __open_channel(self):
        self.__channel = self.__connection.channel()