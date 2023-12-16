# ETL

This is the ETL service, which allows to import and transform the data to be available for graphical representation.

To have data in the relational DB first, run [this](/Logic/etl/src/main.py) file. This script receives the path to a ZIP file. This ZIP may contain the following folders:

* lab_data: which contains the laboratory results. One file (.xls) per patient, in which the name is the ID of the patient;
* patient_data: a single file (.xlsx) which contains the clinical and demographic data.
* therapy_data: contains the therapy data for each patient. Like the lab_data, one file (.xls) per patient in which the name is the ID of the patient.

The script allows the execution of the steps separately or all of them at once. The option is given at runtime.

Note that the working directory of python must be in /etl, otherwise it will result in errors.

# Steps description

This service contains the following steps:
* __f00_import_lab_data__, which imports the raw data to the relational DB, while removing excess whitespaces and some unused columns;
* __f01_0_create_filtered_viw__, creates a view with only the necessary parameters. These parameters are present [here](/Logic/etl/configs/vars.txt).
* __f01_transform_values__, is the process of transformation. Converts the parameters into numeric values. These transformation rules are located in [here](/Logic/etl/configs/rules.json).
* __f02_categorize_values__, which categorizes the values by 'val_ref' (reference value) after being convert into numeric. This results in the following categorizations:
    * __1__, within normality values;
    * __2__, outside the normality values, in case the reference value is binary;
    * __3__, below the normality values, in case the reference value is an interval;
    * __4__, above the normality values, in case the reference value is an interval.
* __f03_create_merged_params__, creates the merged IDs for the parameters;
* __f04_agreg_cat_values__, aggregates the categorized parameters following the IDs generated in the previous step;
* __f05_agreg_num_values__, aggregates the numeric parameters following the IDs generated in the __f03__ step;
* __f06_0_import_delirium__, this was created from the need of importing delirium data of the patients. This data can vary with time so it's considered longitudinal;
* __f07_create_min_max_results_tbl__, creates the table that contains the daily and daily morning minimum and maximum results for every patient;
* __f08_min_max_results_cat__, categorizes the daily parameters, following [this](/Logic/etl/configs/max.min-cat.json). These values were provided by a clinician;
* __f09_import_therapy__, imports the therapy data;
* __f10_create_cols_tbl__, creates a table that contains the columns that are not parameters. This table is used to tell wether the columns represent parameters or demography.

