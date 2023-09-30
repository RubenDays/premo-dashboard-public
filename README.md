# premo-dashboard-public

This is the public repo for PREMO dashboard.
This project allows the visualization of COVID-19 infected patients data while they were in the ICU, for project PREMO.

This allows graphical representation with circular/bar charts, scatter plots and boxplots for cross-sectional data. Regarding longitudinal data, it has the Kaplan Meier survival curves and scatter lines.


# How to run
 There are several .env files that are used by the applications running on containers. All of these present dummy values, but should work. The only exception is the variable "PREMO_DB_CS", located in [this](/Logic/Api/.env) .env file. This variable represents the connection string for the relational database and must be changed. 

To run docker, run [this](/docker/docker-up.bat) .bat file for Windows. It will run docker-compose and create the images and run the containers.

To have data in the relational DB first, run [this](/Logic/etl/src/main.py) file. This script receives the path to a ZIP file. This file must contain two folders:

* lab_data: which contains the laboratory results;
* patient_data: which contains the clinical and demographic data.

The script allows the execution of the steps separately or all of them at once. The option is given at runtime.

Note that the working directory of python must be in /etl, otherwise it will result in errors.

