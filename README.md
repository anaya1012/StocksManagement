# Stocks Market Data Management System
This project provides a comprehensive platform for observing historical stock data for various companies and making informed decisions. By leveraging visualization tools, users can analyze trends and patterns, ensuring a deeper understanding of market dynamics, gain insights into stock performance over time, identify potential investment opportunities, and mitigate risks effectively. In addition to visualizing historical stock data, our system empowers users with the capability to buy and sell stocks at the current market price. This functionality enables users to actively participate in the stock market and execute trades efficiently. To ensure reliable and accurate stock data, our system utilizes the Yahoo Finance database for fetching stock data.

## Features
- **Historical data visualization:** Our platform provides users with access to a vast repository of historical stock data for various companies, enabling them to make informed decisions based on comprehensive insights into market trends and performance over time.
- **Real-time Stock Trading:** Our system empowers users to buy and sell stocks at the current market price, enabling active participation in the stock market and efficient execution of trades.
-  **Data Reliability:** To ensure reliable and accurate stock data, our platform utilizes the Yahoo Finance database, providing users with access to up-to-date and trustworthy information essential for successful trading and investment activities.

## Setup instructions:

To run this project locally, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Navigate to the source folder to run frontend
   ### `cd src`
4. Install the required dependencies
   ### `npm install`
5. Navigate to the project directory to run backend
    ### `cd ..`
6. Install the required dependencies.
    ### `npm install`
7. Start the backend server
    ### `python main.py`
8. Start the frontend server
    ### `npm start`

This will run the app in the development mode.
- Open [http://localhost:3000/admin](http://localhost:3000/admin) to view the Admin interface.
- Open [http://localhost:3000](http://localhost:3000) to view the User Interface.

## File structure:
**public folder:** Contains files that are publicly accessible. It also contains the index.html file which serves as the entry point for the React application. 

**src folder:** This directory contains source code for the frontend ReactJS application. 

   -components folder: This folder contains the React components listed below:
   1. Admin.js: This file contains compaonent to add stocks, delete stocks and update user information.
   2. Dashboard.js: THhis file contains component to render graphs to analyse historical data,user information and options to buy and sell stocks.
   3. Login.js:  This file contains the component responsible for rendering the login form and handling user authentication.
   4. Login.css: This file likely contains CSS styles specific to the login component of the application
   5. Register.js: This file contains the component responsible for rendering the registration form and handling user registration. 

**README.md:** This file contains information about the project, its structure, dependencies, and how to run.   
  
**main.py:** This contains backend code for the flask application. It provides API's for managing stock data and user profiles.

**package.json and package-lock.json:**
package.json contains metadata about the project and lists dependencies.
package-lock.json is automatically generated and locks the version of dependencies to ensure consistency across different environments.

