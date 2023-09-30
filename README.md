# premo-dashboard-public

This is the public repo for PREMO dashboard.
This project allows the visualization of COVID-19 infected patients data while they were in the ICU, for project PREMO.

This allows graphical representation with circular/bar charts, scatter plots and boxplots for cross-sectional data. Regarding longitudinal data, it has the Kaplan Meier survival curves and scatter lines.


# How to run
 There are several .env files that are used by the applications running on containers. All of these present dummy values, but should work. The only exception is the variable "PREMO_DB_CS", located in [this](/Logic/Api/.env) .env file. This variable represents the connection string for the relational database and must be changed. 

To run the application, run [this](/docker/docker-up.bat) .bat file for Windows. It will run docker-compose and create the images and run the containers.
