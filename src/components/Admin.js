import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
    const [stockName, setStockName] = useState('');
    const [stockNameF, setStockNameF] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [error, setError] = useState('');
    const [stockNames, setStockNames] = useState([]);
    const [stockNamesF, setStockNamesF] = useState([]);
    const [usernameInput, setUsernameInput] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const [originalUsername, setOriginalUsername] = useState('');

    // Function to fetch all stock names
    const fetchStockNames = () => {
        axios.get('http://localhost:5000/get_all_stock_names')
            .then(response => {
                // Extract stock names from response data
                const stockNamesArray = Object.values(response.data).map(stock => stock.stock_name);
                const stockNamesArrayF = Object.values(response.data).map(stock => stock.stock_nameF);
                setStockNames(stockNamesArray);
                setStockNamesF(stockNamesArrayF);
            })
            .catch(error => {
                console.error('Error fetching stock names:', error);
            });
    };

    // Function to handle adding stock
    const addStock = () => {
        setError(''); // Reset error state
        axios.post('http://localhost:5000/add_stock', {
            stock_name: stockName,
            stock_nameF: stockNameF,
            start_year: startYear,
            end_year: endYear
        })
        .then(response => {
            console.log(response.data);
            // Optionally, update UI or show a success message
            // After adding stock, refresh the list of stock names
            fetchStockNames();
        })
        .catch(error => {
            console.error('Error adding stock:', error);
            setError('Error adding stock. Please try again.'); // Set error state
        });
    };

    // Function to handle deleting stock
    const deleteStock = (stockName) => {
        axios.delete(`http://localhost:5000/delete_stock/${stockName}`)
            .then(response => {
                console.log(response.data);
                // Refresh the list of stock names after deletion
                fetchStockNames();
            })
            .catch(error => {
                console.error('Error deleting stock:', error);
                setError('Error deleting stock. Please try again.'); // Set error state
            });
    };

    // Function to fetch user information by username
    const fetchUserInfo = () => {
    axios.get(`http://localhost:5000/get_user_info?username=${usernameInput}`)
        .then(response => {
            setUserInfo(response.data);
            // Set the original username
            setOriginalUsername(response.data.username);
        })
        .catch(error => {

            setError('Error fetching user information. Please try again.'); // Set error state
        });
    };


    // Function to update user email
// Function to update user email
const saveUserInfo = () => {
    setError(''); // Reset error state
    axios.post('http://localhost:5000/update_user_info', {
        original_username: originalUsername,
        updated_email: userInfo.email // Include updated email
        // Add other fields you want to update
    })
    .then(response => {
        console.log(response.data);
        // Optionally, update UI or show a success message
        alert('Email address updated successfully');
    })
    .catch(error => {
        console.error('Error updating user information:', error);
        setError('Error updating user information. Please try again.'); // Set error state
        alert('Error updating email address. Please try again.');
    });
};


    // Fetch stock names when component mounts
    useEffect(() => {
        fetchStockNames();
    }, []);

    return (
        <div className="container" style={{ border: '4px solid #007bff', borderRadius: '10px', padding: '20px' }}>
            <h1>Welcome, Admin!</h1>
            <div className="row">
                <div className="col-md-8">
                    <h3>Add stock to Distributed database:</h3>
                    <div className='row'>
                        <div className="col-md-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter stock ACRONYM"
                                value={stockName}
                                onChange={(e) => setStockName(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter stock Name"
                                value={stockNameF}
                                onChange={(e) => setStockNameF(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="start year"
                                value={startYear}
                                onChange={(e) => setStartYear(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="end year"
                                value={endYear}
                                onChange={(e) => setEndYear(e.target.value)}
                            />
                        </div>

                        <div className="col-md-2">
                            <button className="btn btn-success" onClick={addStock}>Add Stock</button>
                        </div>
                    </div>


                </div>
                {/* Display stock names */}

            </div>

            <div className="row">
                <div className="col-md-4">
                    <h3>Stock In Data Base:</h3>
                    <ul className="list-group">
                        {stockNames.map((stockName, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                {stockNamesF[index]}<span style={{ fontWeight: 'bold' }}> ({stockName})</span>
                                <button className="btn btn-danger"  style={{ marginLeft: '30px' }}  onClick={() => deleteStock(stockName)}>Delete From DB</button>
                            </li>
                        ))}
                    </ul>
                </div>


                <div className="col-md-8" >
                    <h3>Edit User Information:</h3>
                    <div className='row'>
                        <div className='col-md-4'>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter username"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                            />
                        </div>
                        <div className='col-md-4'>
                            <button className="btn btn-primary" onClick={fetchUserInfo}>Fetch User Info</button>
                        </div>

                    </div>

                    {/* Display fetched user information */}
                    {userInfo && (
    <div className="card mt-3">
        <div className="card-body">
            <h5 className="card-title">User Information</h5>
            <div className="form-group">
                <label htmlFor="usernameInput">Username:</label>
                    <input
                        type="text"
                        className="form-control"
                        id="usernameInput"
                        value={userInfo.username}
                        readOnly // Make username read-only
                    />
            </div>
            <div className="form-group">
                <label htmlFor="emailInput">Email Address:</label>
                <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                />
            </div>
            <button className="btn btn-primary" onClick={saveUserInfo} >Save</button>
            {/* Display any other user information you want */}
        </div>
    </div>
)}

                    {error && <p className="text-danger">{error}</p>}
                </div>


            </div>
            {/* Input field and button to fetch user information */}

            {/* Add admin-specific content here */}
        </div>

    );
}

export default Admin;
