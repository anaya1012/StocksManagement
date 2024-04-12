import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import './Dashboard.css'; 
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
//import yfinance from 'yfinance';
import { AgGridReact } from 'ag-grid-react';

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataPoints: [],
            volumeDataPoints: [],
            displayChart: true,
            selectedStock: 'Apple', // Initialize selectedStock state
            stockDictionary : {
                GOOG: 'Google',
                AAPL: 'Apple',
                MSFT: 'Microsoft',
                NVDA: 'NVIDIA',
                ADBE: 'Adobe',
                ORCL: 'Oracle',
                INTC: 'Intel',
                QCOM: 'Qualcomm',
                CSCO: 'Cisco',
                IBM: 'IBM'
            },
            userBalance: 0,
            stockData:[]
        };
    }

    componentDidMount() {
        // Fetch stock data for the initial selected stock
        this.fetchStockData('AAPL');
        this.fetchAccountBalance();
        this.fetchStockListData();
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

    fetchStockData(stockName) {
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
                text: `Stock Voulme- ${selectedStockName}`
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
            { headerName: '% Change', field: 'change' }
        ];

        return (
            <>
            {/* Dropdown to select stock */}
            <Select
                        value={selectedStock}
                        onChange={this.handleChange}
                    >
                        <MenuItem value="GOOG">Google</MenuItem>
                        <MenuItem value="AAPL">Apple</MenuItem>
                        <MenuItem value="MSFT">Microsoft</MenuItem>
                        <MenuItem value="NVDA">NVIDIA</MenuItem>
                        <MenuItem value="ADBE">Adobe</MenuItem>
                        <MenuItem value="ORCL">Oracle</MenuItem>
                        <MenuItem value="INTC">Intel</MenuItem>
                        <MenuItem value="QCOM">Qualcomm</MenuItem>
                        <MenuItem value="CSCO">Cisco</MenuItem>
                        <MenuItem value="IBM">IBM</MenuItem>
                    </Select>
            <br/><br/>
            <Card elevation={5}>
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
                <Card elevation={5} >
                <CardContent>
                    {this.state.displayChart && 
                        <CanvasJSChart 
                            options={volumeChartOptions} 
                            onRef={ref => this.chart = ref} 
                        />
                    }
                </CardContent>
                </Card>
                
            <Card className="balance-card" elevation={5}>
            <CardContent>
                <MonetizationOnIcon style={{ fontSize: 30 }} />
                <span><span>Account Balance: ${this.state.userBalance}</span></span>
            </CardContent>
            </Card>

            <div className="ag-theme-alpine" style={{ height: '200px', width: '600px', margin: '20px auto' }}>
                    <AgGridReact
                        columnDefs={tableColumnDefs}
                        rowData={this.state.stockData}
                    ></AgGridReact>
                </div>
            </>
        );
    }
}

export default Dashboard;
