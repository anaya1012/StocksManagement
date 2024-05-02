import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Button from '@mui/material/Button';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
//import yfinance from 'yfinance';
import TextField from '@mui/material/TextField'; // Import TextField component
import { AgGridReact } from 'ag-grid-react';
import Typography from '@mui/material/Typography'; 

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataPoints: [],
            volumeDataPoints: [],
            displayChart: true,
            selectedStock: 'Apple', // Initialize selectedStock state
            stockDictionary : {},
            userBalance: 0,
            userStocks:[],
            stockData: []
        };
    }

    componentDidMount() {
        // Fetch stock data for the initial selected stock
        this.fetchStockData('AAPL');
        this.fetchAccountBalance();
        this.fetchStockNames(); // Fetch stock names dynamically
        this.fetchUserStocks();
        this.interval = setInterval(this.fetchCurrentStockPrices, 2000);
    }

    componentWillUnmount() {
        // Clear the interval when the component unmounts to avoid memory leaks
        clearInterval(this.interval);
    }

    handleQuantityChange = (event, stock) => {
        const quantity = parseInt(event.target.value) || 0; // Parse the quantity value to an integer
        this.setState(prevState => ({
            stockData: prevState.stockData.map(item => {
                if (item.id === stock.id) {
                    return { ...item, quantity: quantity };
                }
                return item;
            })
        }));
    };

    fetchStockNames() {
        fetch("http://localhost:5000/get_all_stock_names")
            .then(response => response.json())
            .then(data => {
                // Update the stockDictionary state with the fetched data
                console.log(data)
                //this.setState({ stockDictionary: data });
                const stockNamesArray = Object.entries(data).map(([symbol, names]) => ({
                    symbol: symbol,
                    name: names.stock_name
                }));
                // Update the stockDictionary state with the fetched data
                const stockDictionary = {};
                stockNamesArray.forEach(stock => {
                    stockDictionary[stock.symbol] = stock.name;
                });
                this.setState({ stockDictionary: stockDictionary }, () => {
                    this.fetchStockTable(); // Call fetchStockTable after stockDictionary is set
                });
            })
            
            .catch(error => {
                console.error('Error fetching stock names:', error);
            });
    }

    fetchUserStocks() {
        // Retrieve token from session storage
        const token = sessionStorage.getItem('token');
    
        // Make GET request to fetch user stocks
        fetch("http://localhost:5000/check_balance", {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if (data.stocks) {
                this.setState({ userStocks: data.stocks });
                console.log(data.stocks);
            }
        })
        .catch(error => {
            console.error('Error fetching user stocks:', error);
        });
    }
    
    fetchStockListData() {
        const stockSymbols = Object.keys(this.state.stockDictionary);
        const stockDataPromises = stockSymbols.map(symbol => {
            //return yfinance.quote(symbol);
        });

        Promise.all(stockDataPromises)
            .then(data => {
                const stockData = data.map((stock, index) => {
                    return {
                        id: index + 1,
                        name: this.state.stockDictionary[stock.symbol],
                        change: stock.changePercent
                    };
                });
                this.setState({ stockData });
            })
            .catch(error => {
                console.error('Error fetching stock list data:', error);
            });
    }

    fetchStockTable() {
        const stockSymbols = Object.keys(this.state.stockDictionary);
        console.log(this.state.stockDictionary)
        const stockData = stockSymbols.map((symbol, index) => ({
            id: index + 1, // Start id from 1 and increment
            name: this.state.stockDictionary[symbol],
            symbol: symbol,
            change: 100, // Initialize the current price of stocks to $100
            quantity: 0 
        }));
        console.log(stockData);
        this.setState({ stockData });
    }

    fetchAccountBalance() {
        // Retrieve token from session storage
        const token = sessionStorage.getItem('token');

        // Make GET request to fetch user account balance
        fetch("http://localhost:5000/check_balance", {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.balance) {
                this.setState({ userBalance: data.balance });
            }
            console.log(data.balance)
        })
        .catch(error => {
            console.error('Error fetching user account balance:', error);
        });
    }

    fetchCurrentStockPrices = () => {
        // Check if stockData exists in state
        if (!this.state || !this.state.stockData) {
            return;
        }
    
        const updatedStockData = this.state.stockData.map(stock => {
            // Generate a random price between 100 and 200
            const randomPrice = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
            return {
                ...stock,
                change: randomPrice
            };
        });
    
        // Update the state with the new stock data
        this.setState({ stockData: updatedStockData });
    }
    

    fetchStockData(stockName) {
        console.log("stockName",stockName)
        // Retrieve token from session storage
        const token = sessionStorage.getItem('token');

        // Make API call using the token
        fetch(`http://localhost:5000/search_stock?stock_name=${stockName}`, {
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(data => {
            const dataPoints = data.flat().map(entry => ({
                x: new Date(`${entry.Date.slice(0, 4)}-${entry.Date.slice(5, 7)}-${entry.Date.slice(8, 10)}`),
                y: parseFloat(entry.Close)
            }));
            const volumeDataPoints = data.flat().map(entry => ({
                x: new Date(`${entry.Date.slice(0, 4)}-${entry.Date.slice(5, 7)}-${entry.Date.slice(8, 10)}`),
                y: parseFloat(entry.Volume)
            }));

            console.log(data)
            this.setState({ dataPoints: dataPoints });
            this.setState({ volumeDataPoints: volumeDataPoints });
        })
        .catch(error => {
            console.error('Error fetching stock data:', error);
        });
    }

    handleBuyClick = (stock) => {
        const currentPrice = stock.change; // Get the current price from the stock data
        const quantity = stock.quantity; // Get the quantity from the stock data
    
        // Prepare the data for the POST request
        const data = {
            stock_name: stock.name,
            price: currentPrice,
            quantity: quantity
        };
    
        // Make the POST request to the /buy_stock endpoint
        fetch('http://localhost:5000/buy_stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': sessionStorage.getItem('token')
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            console.log('Buy response:', data);
            if (data.message.startsWith('Successfully bought')) {
                // Fetch the updated account balance
                this.fetchAccountBalance();
                this.fetchUserStocks();
                alert(data.message)
                this.setState(prevState => ({
                    stockData: prevState.stockData.map(item => {
                        if (item.id === stock.id) {
                            return { ...item, quantity: 0 };
                        }
                        return item;
                    })
                }));
            }
            else{
                alert(data.message)
            }
        })
        .catch(error => {
            console.error('Error buying stock:', error);
            // Handle error here
            // For example, show an error message to the user
        });
    };
    

    handleSellClick = (stock) => {
        // Handle sell logic here
        const currentPrice = stock.change; // Get the current price from the stock data
        const quantity = stock.quantity; // Get the quantity from the stock data
    
        // Prepare the data for the POST request
        const data = {
            stock_name: stock.name,
            price: currentPrice,
            quantity: quantity
        };
    
        // Make the POST request to the /buy_stock endpoint
        fetch('http://localhost:5000/sell_stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': sessionStorage.getItem('token')
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            console.log('Sell response:', data);
            if (data.message.startsWith('Successfully sold')) {
                // Fetch the updated account balance
                this.fetchAccountBalance();
                this.fetchUserStocks();
                alert(data.message)
                this.setState(prevState => ({
                    stockData: prevState.stockData.map(item => {
                        if (item.id === stock.id) {
                            return { ...item, quantity: 0 };
                        }
                        return item;
                    })
                }));
            }
            else{
                alert(data.message)
            }
        })
        .catch(error => {
            console.error('Error selling stock:', error);
            // Handle error here
            // For example, show an error message to the user
        });
    };

    handleStockClick = (stockName) => {
        
        this.setState({ selectedStock: stockName });
        this.fetchStockData(stockName);
    };


    handleChange = (event) => {
        const stockName = event.target.value;
        this.setState({ selectedStock: stockName });
        this.fetchStockData(stockName);
    };

    render() {
        const { dataPoints, selectedStock, volumeDataPoints } = this.state;
        const selectedStockName = this.state.stockDictionary[selectedStock] || 'Apple';
        const options = {
            animationEnabled: true,
            exportEnabled: true,
            zoomEnabled: true,
            theme: "light2",
            title: {
                text: `Stocks Price  - ${selectedStockName}`
            },
            data: [{
                type: "line",
                xValueFormatString: "MMM DD YYYY",
                yValueFormatString: "#,##0.00",
                dataPoints: dataPoints
            }]
        };

        const volumeChartOptions = {
            animationEnabled: true,
            exportEnabled: true,
            zoomEnabled: true,
            theme: "light2",
            title: {
                text: `Stock Volume- ${selectedStockName}`
            },
            data: [{
                type: "column",
                xValueFormatString: "MMM DD YYYY",
                yValueFormatString: "#,##0",
                dataPoints: volumeDataPoints
            }]
        };

        
        const tableColumnDefs = [
            { headerName: 'Stock Name', field: 'name' },
            { headerName: 'Stock Symbol', field: 'symbol' },
            { headerName: 'Current Price', field: 'change' },
            {
                headerName: 'Quantity',
                field: 'quantity',
                cellRenderer: params => (
                    <TextField
                    type="number"
                    value={params.data.quantity}
                    onChange={(event) => this.handleQuantityChange(event, params.data)}
                    
                />
                )
            },
            {
                headerName: 'Actions',
                cellRenderer: params => (
                    <div>
                        <Button variant="contained" color="primary" onClick={() => this.handleBuyClick(params.data)}>Buy</Button>
                        <span style={{ marginRight: '8px' }}></span> {/* Adjust the margin-right value as needed */}
                        <Button variant="contained" color="secondary" onClick={() => this.handleSellClick(params.data)}>Sell</Button>
                    </div>
                )
            }
        ];

        const columnDefs = [
            { headerName: 'Stock Symbol', field: 'symbol' },
            { headerName: 'Quantity', field: 'quantity' }
        ];

        // Convert userStocks object into an array of objects for row data
        const rowData = Object.keys(this.state.userStocks).map((symbol, index) => ({
            id: index,
            symbol: symbol,
            quantity: this.state.userStocks[symbol].quantity
        }));

        return (
            <>
             {/* Display stocks horizontally */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop:'30px'}}>
                    {Object.keys(this.state.stockDictionary).map(stock => (
                        <Button
                            key={stock}
                            variant="outlined"
                            style={{ fontSize: '15px', padding: '10px 20px', margin:'10px', fontWeight: 'bold', color: 'black', borderColor: 'black'}} 
                            // color={(this.state.selectedStock && this.state.selectedStock === stock) ? 'primary' : 'default'}
                            onClick={() => this.handleStockClick(stock)}
                        >
                            {this.state.stockDictionary[stock]}
                        </Button>
                    ))}
                </div>

            <Card elevation={5} style={{ marginLeft: '30px', marginRight: '30px' }}>
                <CardContent>
            
                    {this.state.displayChart && 
                        <CanvasJSChart 
                            options={options} 
                            onRef={ref => this.chart = ref} 
                        />
                    }
                </CardContent>
            </Card>
                <br/>
                <Card elevation={5} style={{ marginLeft: '30px', marginRight: '30px' }} >
                <CardContent>
                    {this.state.displayChart && 
                        <CanvasJSChart 
                            options={volumeChartOptions} 
                            onRef={ref => this.chart = ref} 
                        />
                    }
                </CardContent>
                </Card>
                <br></br>
            <Card className="balance-card" elevation={5} style={{ marginLeft: '30px', marginRight: '30px' }}>
            <CardContent>
            <Typography variant="h3" gutterBottom>User Information</Typography>
                
                <span><span><h3>Account Balance: ${this.state.userBalance}</h3></span></span>
                <div>
                            <h3>Stocks Bought by the user:</h3>
                            <div className="ag-theme-alpine" style={{ height: '200px', width: '400px' }}>
                                <AgGridReact
                                    columnDefs={columnDefs}
                                    rowData={rowData}
                                />
                            </div>
                        </div>
            </CardContent>
            </Card>
            <br/>
            <Card className="balance-card" elevation={5} style={{ marginLeft: '30px', marginRight: '30px' }}>
            <CardContent>
            <Typography variant="h3" gutterBottom>Trade Stocks at Real time price</Typography>
            <div className="ag-theme-alpine" style={{ height: '200px', width: '1000px', margin: '20px auto' }}>
                    <AgGridReact
                        columnDefs={tableColumnDefs}
                        rowData={this.state.stockData}
                    ></AgGridReact>
            </div>
            </CardContent>
            </Card>
            </>
        );
    }
}

export default Dashboard;