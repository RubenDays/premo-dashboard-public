import sys
from zipfile import ZipFile

from src.process.f04_agreg_cat_values import AgregCatValues
from src.process.f05_agreg_num_values import AgregNumValues
from src.process.f06_import_patient_data import ImportPatientData
from src.process.f07_create_min_max_results_tbl import CreateMinMaxResultsTbl
from src.utils import logger, connection
from src.process.f00_import_lab_data import ImportLabData
from src.process.f01_transform_values import TransformValues
from src.process.f01_0_create_filtered_view import CreateFilteredView
from src.process.f02_categorize_values import CategorizeValues
from src.process.f03_create_merged_params import CreateMergedParams
from src.process.f08_min_max_results_cat import MinMaxResultsCat


# run script 00 - import patient lab results and new parameters
def run00(log, archive, engine):
    import_data = ImportLabData(logger=log, archived_data=archive, engine=engine)
    num_new_params = import_data.run()


def run01_0(log, engine):
    # rebuild view with filtered columns if there are new parameters
    # if num_new_params > 0:
    create_view = CreateFilteredView(logger=log, engine=engine)
    create_view.run()


def run01(log, engine):
    # run script 01 - apply transformations to values (patient lab results)
    transform_values = TransformValues(logger=log, engine=engine)
    transform_values.run()


def run02(log, engine):
    # run script 02 - categorize values (patient lab results)
    categorize_values = CategorizeValues(logger=log, engine=engine)
    categorize_values.run()


def run03(log, engine):
    # run script 03 - create merged parameters
    create_merge_params = CreateMergedParams(logger=log, engine=engine)
    create_merge_params.run()


def run04(log, engine):
    # run script 04 - merge categorized values
    agreg_cat_values = AgregCatValues(logger=log, engine=engine)
    agreg_cat_values.run()


def run05(log, engine):
    # run script 05 - merge numeric values
    agreg_num_values = AgregNumValues(logger=log, engine=engine)
    agreg_num_values.run()


def run06(log, engine, archive):
    # run script 06 - import patient data
    import_patient_data = ImportPatientData(logger=log, engine=engine, archived_data=archive)
    import_patient_data.run()


def run07(log, engine):
    # run script 07 - create min max results
    create_min_max_results_tbl = CreateMinMaxResultsTbl(logger=log, engine=engine)
    create_min_max_results_tbl.run()


def run08(log, engine):
    # run script 08 - create min max categorized results
    min_max_results_cat = MinMaxResultsCat(logger=log, engine=engine)
    min_max_results_cat.run()


def run_all(log, engine, archive):
    run00(log, archive, engine)
    run01_0(log, engine)
    run01(log, engine)
    run02(log, engine)
    run03(log, engine)
    run04(log, engine)
    run05(log, engine)
    run06(log, engine, archive)
    run07(log, engine)
    run08(log, engine)


def print_help_menu():
    print('Select an option:')
    print('00 - import lab data')
    print('01-0 - create filtered view')
    print('01 - transform values')
    print('02 - categorize values')
    print('03 - create merged params')
    print('04 - aggregate categorized values')
    print('05 - aggregate numeric values')
    print('06 - import patient data')
    print('07 - create min max results table')
    print('08 - categorize min max results')
    print('all - run all')
    print('')


def run():
    if len(sys.argv) <= 1:
        print('Usage: <path to zipfile>')
        return

    filepath = sys.argv[1]

    print_help_menu()
    script = input('Select option')

    archive = ZipFile(filepath)

    LOGGER = logger.get_logger(f'etl-{script}.txt')
    ENGINE = connection.get_engine()

    if script == '00':
        run00(LOGGER, archive, ENGINE)
    elif script == '01-0':
        run01_0(LOGGER, ENGINE)
    elif script == '01':
        run01(LOGGER, ENGINE)
    elif script == '02':
        run02(LOGGER, ENGINE)
    elif script == '03':
        run03(LOGGER, ENGINE)
    elif script == '04':
        run04(LOGGER, ENGINE)
    elif script == '05':
        run05(LOGGER, ENGINE)
    elif script == '06':
        run06(LOGGER, ENGINE, archive)
    elif script == '07':
        run07(LOGGER, ENGINE)
    elif script == '08':
        run08(LOGGER, ENGINE)
    elif script == 'all':
        run_all(LOGGER, ENGINE, archive)
    else:
        print('Invalid option')


if __name__ == '__main__':
    run()
