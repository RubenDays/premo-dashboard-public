# premo-dashboard-public

This is the public repo for PREMO dashboard.
This project allows the visualization of COVID-19 infected patients data while they were in the ICU, for project PREMO.

This allows graphical representation with circular/bar charts, scatter plots and boxplots for cross-sectional data. Regarding longitudinal data, it has the Kaplan Meier survival curves and scatter lines. Also allows import and export data, and user management.

This work was done in the context of the project __Predictive Models of COVID-19 Outcomes for Higher Risk Patients Towards a Precision Medicine (PREMO)__, supported by _Fundação para a Ciência e Tecnologia (FCT)_, under the grant DSAIPA/DS/0117/2020.

[https://www.isel.pt/investigacao-e-inovacao/ecossistema-de-inovacao/projetos/2020/premo](https://www.isel.pt/investigacao-e-inovacao/ecossistema-de-inovacao/projetos/2020/premo)

# How to run
This application use docker containers to run the various services, thus it's required to have Docker installed.

There are several .env files that are used by the applications running on containers. These files contain the environmental variables for the different services that are used to indicate usernames, password or URLs.

All of these present dummy values, but should work. The only exception is the variable "PREMO_DB_CS", located in [this](/Logic/Api/.env) .env file. This variable represents the connection string for the relational database and must be changed.

To run docker, run [this](/docker/docker-up.bat) .bat file for Windows. It will run docker-compose, create the images and run the containers.

# Import Data

To have data in the relational DB first, run [this](/Logic/etl/src/main.py) file. This script receives the path to a ZIP file. This file must contain two folders:

* lab_data: which contains the laboratory results;
* patient_data: which contains the clinical and demographic data.

The script allows the execution of the steps separately or all of them at once. The option is given at runtime.

Note that the working directory of python must be in /etl, otherwise it will result in errors.

