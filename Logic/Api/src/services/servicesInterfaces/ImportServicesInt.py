from fastapi import UploadFile

from src.dto.ImportModels import DataImportReq


class ImportServicesInt:

    def import_data(self, zip_file: UploadFile):
        raise Exception('ImportServicesInt.import_data: Not implemented.')
