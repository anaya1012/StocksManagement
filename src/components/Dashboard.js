import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
          dataPoints: [
            {x: 'Sun Jan 02 2000 16:00:00 GMT-0800', y: 0.9},
            {x: 'Jan 03', y: 0.9151790142},
            { x: new Date("2022-03-01"), y: 120 },
            // Add more data points as needed
        ],
        displayChart: true,
        };
    }

    componentDidMount() {
        var chart = this.chart;
        if (chart) {
            // Retrieve token from session storage
            const token = sessionStorage.getItem('token');

            // Make API call using the token
            fetch('http://localhost:5000/search_stock?stock_name=AAPL', {
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
               this.setState({ dataPoints: dataPoints }, () => {
                   console.log("Data points:", dataPoints); // Add this line to check the value of dataPoints
                  
 
                  // if (chart){
                  //   chart.render();
                  // }
                  this.setState({displayChart: true});
               });
               
          })
            .catch(error => {
                console.error('Error fetching stock data:', error);
            });
        }
    }

    render() {
        const { dataPoints } = this.state;

        const options = {
            animationEnabled: true,
            exportEnabled: true,
            theme: "light2",
            title: {
                text: "Stocks"
            },
            data: [{
                type: "line",
                xValueFormatString: "MMM DD",
                yValueFormatString: "#,##0.00",
                dataPoints: dataPoints
            }]
        };

        return (
            <Card>
                <CardContent>
                {this.state.displayChart && <CanvasJSChart options = {options} 
				 onRef={ref => this.chart = ref} 
			
			/> }
                </CardContent>
            </Card>
        );
    }
}

export default Dashboard;
