from io import BytesIO
from zipfile import ZipFile

import pika  # recommended by rabbitmq team
import pymongo
import gridfs
from bson import ObjectId
from pika.exchange_type import ExchangeType
from sqlalchemy.future import Engine

from src.process.f04_agreg_cat_values import AgregCatValues
from src.process.f05_agreg_num_values import AgregNumValues
from src.process.f06_import_patient_data import ImportPatientData
from src.process.f07_create_min_max_results_tbl import CreateMinMaxResultsTbl
from src.utils.global_vars import MONGO_URI, MONGO_USER, MONGO_PASSWORD, MQ_HOST, MQ_PORT, MQ_QUEUE, MQ_EXCHANGE, \
    MQ_ROUTING_KEY
from src.utils import logger, connection
from src.process.f00_import_lab_data import ImportLabData
from src.process.f01_transform_values import TransformValues
from src.process.f01_0_create_filtered_view import CreateFilteredView
from src.process.f02_categorize_values import CategorizeValues
from src.process.f03_create_merged_params import CreateMergedParams
from src.process.f08_min_max_results_cat import MinMaxResultsCat
from src.process.f09_import_therapy import ImportTherapy


def process(archive: ZipFile):
    if archive is None or len(archive.namelist()) == 0:
        LOGGER.info(f'There are no files - nothing to do.')
        return

    # run script 00 - import patient lab results and new parameters
    import_data = ImportLabData(logger=LOGGER, archived_data=archive, engine=ENGINE)
    num_new_params = import_data.run()
    del import_data

    # rebuild view with filtered columns if there are new parameters
    # if num_new_params > 0:
    create_view = CreateFilteredView(logger=LOGGER, engine=ENGINE)
    create_view.run()
    del create_view

    # run script 01 - apply transformations to values (patient lab results)
    transform_values = TransformValues(logger=LOGGER, engine=ENGINE)
    transform_values.run()
    del transform_values

    # run script 02 - categorize values (patient lab results)
    categorize_values = CategorizeValues(logger=LOGGER, engine=ENGINE)
    categorize_values.run()
    del categorize_values

    # run script 03 - create merged parameters
    create_merge_params = CreateMergedParams(logger=LOGGER, engine=ENGINE)
    create_merge_params.run()
    del create_merge_params

    # run script 04 - merge categorized values
    agreg_cat_values = AgregCatValues(logger=LOGGER, engine=ENGINE)
    agreg_cat_values.run()
    del agreg_cat_values

    # run script 05 - merge numeric values
    agreg_num_values = AgregNumValues(logger=LOGGER, engine=ENGINE)
    agreg_num_values.run()
    del agreg_num_values

    # run script 06 - import patient data
    import_patient_data = ImportPatientData(logger=LOGGER, engine=ENGINE, archived_data=archive)
    import_patient_data.run()
    del import_patient_data

    # run script 07 - create min max results
    create_min_max_results_tbl = CreateMinMaxResultsTbl(logger=LOGGER, engine=ENGINE)
    create_min_max_results_tbl.run()
    del create_min_max_results_tbl

    # run script 08 - create min max categorized results
    min_max_results_cat = MinMaxResultsCat(logger=LOGGER, engine=ENGINE)
    min_max_results_cat.run()
    del agreg_cat_values
    
    # run scrip 09 - import therapy data
    import_therapy_data = ImportTherapy(logger=log, engine=engine, archive_data=archive)
    import_therapy_data.run()
    del import_therapy_data


def on_receive_message(ch, method, properties, body):
    LOGGER.info(f'Message received -> "{body}"')

    # connect mongodb
    db = MONGOCLIENT["premo"]
    fs = gridfs.GridFS(db)
    table = db["dataupload"]

    # get file from db
    file_id = str(body, 'utf-8')
    file_entry = table.find_one({'_id': ObjectId(file_id)})
    file = fs.get(file_entry['file']).read()

    # transform it to zipfile object
    data = BytesIO(file)
    archive = ZipFile(data, 'r')

    process(archive)


# Creates the Exchange, Queue and Binding for MQ use.
# These operations are idempotent.
def setup_mq(channel):
    # create exchange
    channel.exchange_declare(
        exchange=MQ_EXCHANGE,
        exchange_type=ExchangeType.direct,
        durable=True,
        auto_delete=False
    )

    # create queue
    channel.queue_declare(queue=MQ_QUEUE, durable=True, auto_delete=False)

    # create binding
    channel.queue_bind(queue=MQ_QUEUE, exchange=MQ_EXCHANGE, routing_key=MQ_ROUTING_KEY)


def run():
    # create connection
    con = pika.BlockingConnection(pika.ConnectionParameters(host=MQ_HOST, port=MQ_PORT))

    # create channel
    channel = con.channel()

    # sets up exchange, queue and bind
    setup_mq(channel)

    # define the queues from where to consume
    channel.basic_consume(queue=MQ_QUEUE, on_message_callback=on_receive_message, auto_ack=True)

    # start consuming
    channel.start_consuming()

    channel.close()


if __name__ == '__main__':
    LOGGER = logger.get_logger('etl.txt')

    MONGOCLIENT = pymongo.MongoClient(MONGO_URI, username=MONGO_USER, password=MONGO_PASSWORD)

    ENGINE: Engine = connection.get_engine()

    run()
