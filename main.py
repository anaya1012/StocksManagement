from datetime import datetime, timedelta
import jwt
from flask import Flask, request, jsonify
import yfinance as yf
import hashlib
import requests
import random
from functools import wraps
from flask import Flask
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

Database_URLS = {
    0: "https://stock-market-data-management-default-rtdb.firebaseio.com/",
    1: "https://stock-market-data-management-1-default-rtdb.firebaseio.com/",
    2: "https://stock-market-data-management-2-default-rtdb.firebaseio.com/",
    3: "https://stock-market-data-management-3-default-rtdb.firebaseio.com/"
}

User_URLS = {
    0: "https://user-profile-0-default-rtdb.firebaseio.com/",
    1: "https://user-profile-1-default-rtdb.firebaseio.com/"
}

# Secret key for encoding and decoding JWT tokens
SECRET_KEY = "secret"

# JWT token expiration time
TOKEN_EXPIRATION_SECONDS = 3600  # 1 hour

# Mock user database
users = {}

# Function to generate JWT token
def generate_token(username):
    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(seconds=TOKEN_EXPIRATION_SECONDS)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

# Function to decode and validate JWT token
def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return "Token expired. Please log in again."
    except jwt.InvalidTokenError:
        return "Invalid token. Please log in again."

# Function to validate JWT token from request headers
def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        decoded_token = decode_token(token)
        if isinstance(decoded_token, str):
            return jsonify({"message": decoded_token}), 401
        return func(*args, **kwargs)
    return decorated


def hash_function(username):
    # Combine username and password to create a string
    combined_str = f"{username}"
    # Compute the hash value
    hash_value = hash(combined_str)
    # Use some criteria to determine whether to return 1 or 0
    if hash_value % 2 == 0:
        return 0
    else:
        return 1


# Route for user registration and token generation
@app.route("/register", methods=["POST"])
def register():

    # Use request.form to retrieve form data
    data = request.json
    # Extract username and password from JSON data
    username = data.get("username")
    password = data.get("password")

    # Do something with the data (e.g., store it in a database)
    print("Username:", username)
    print("Password:", password)
    if not (username and password):
        return jsonify({"message": "Username or password is missing"}), 400
    # Your registration logic here
    return jsonify({"message": "User registered successfully"}), 200
    db_index = hash_function(username)
    db_url = User_URLS[db_index]
    account_balance = random.randint(1000, 10000)
    user_data = {
        "username": username,
        "password": password,
        "account_balance": account_balance
    }
    response = requests.put(f"{db_url}/users/{username}.json", json=user_data)
    if response.status_code == 200:
        token = generate_token(username)
        return jsonify({"token": token})
    else:
        return jsonify({"message": f"Failed to register user. Status code: {response.status_code}"}), 500


# Route for user login and token generation
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    # Extract username and password from JSON data
    username = data.get("username")
    password = data.get("password")
    print("Username:", username)
    print("Password:", password)
    if not (username and password):
        return jsonify({"message": "Username or password is missing"}), 400

    db_index = 0
    db_url = User_URLS[db_index]
    print(db_url,"sjbja")
    response = requests.get(f"{db_url}/users/{username}.json")
    if response.status_code == 200:
        user_data = response.json()
        print(user_data)
        if user_data is not None and user_data.get("password") == password:
            token = generate_token(username)
            return jsonify({"token": token})
        else:
            return jsonify({"message": "Invalid username or password"}), 401
    else:
        return jsonify({"message": "User does not exist"}), 404


def get_hash_bucket(stock_name):
    hash_object = hashlib.sha1(stock_name.encode())
    hash_hex = hash_object.hexdigest()
    hash_int = int(hash_hex, 16)
    return hash_int % 4




# Route to add stock data
@app.route("/add_stock", methods=["POST"])
def add_stock():
    data = request.json
    stock_name = data.get("stock_name")
    start_year = data.get("start_year")
    end_year = data.get("end_year")
    if not (stock_name and start_year and end_year):
        return jsonify({"message": "Stock name, start year, or end year is missing"}), 400
    start_date = datetime(int(start_year), 1, 1)
    end_date = datetime(int(end_year), 1, 1)
    db_index = get_hash_bucket(stock_name)
    db_url = Database_URLS[db_index]
    data_stock = yf.download(stock_name, start=start_date, end=end_date)
    data_stock.reset_index(inplace=True)
    data_stock['Date'] = data_stock['Date'].dt.strftime('%Y-%m-%d')
    data_stock_json = data_stock.to_json(orient='records')
    response = requests.put(f"{db_url}/stocks/{stock_name}.json", data=data_stock_json)
    if response.status_code == 200:
        return "Stock data added successfully."
    else:
        return jsonify({"message": f"Failed to add stock data. Status code: {response.status_code}"}), 500

# Route to search stock by name
@app.route("/search_stock", methods=["GET"])
def search_stock():
    stock_name = request.args.get("stock_name")
    print("stock name",stock_name)
    if not stock_name:
        return jsonify({"message": "Stock name is missing"}), 400
    db_index = get_hash_bucket(stock_name)
    db_url = Database_URLS[db_index]
    response = requests.get(f"{db_url}/stocks/{stock_name}.json")
    if response.status_code == 200:
        stocks_data = response.json()
        return jsonify(stocks_data)
    else:
        return jsonify({"message": f"Failed to search stock. Status code: {response.status_code}"}), 500

# Route to delete stock data by date range
@app.route("/delete_date_range", methods=["DELETE"])
def delete_date_range():
    data = request.json
    stock_name = data.get("stock_name")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    if not (stock_name and start_date and end_date):
        return jsonify({"message": "Stock name, start date, or end date is missing"}), 400
    db_index = get_hash_bucket(stock_name)
    db_url = Database_URLS[db_index]
    response = requests.get(f"{db_url}/stocks/{stock_name}.json")
    if response.status_code == 200:
        stocks_data = response.json()
        updated_data = [entry for entry in stocks_data if not (start_date <= entry['Date'] <= end_date)]
        response = requests.put(f"{db_url}/stocks/{stock_name}.json", json=updated_data)
        if response.status_code == 200:
            return "Date range deleted successfully."
        else:
            return jsonify({"message": f"Failed to delete date range. Status code: {response.status_code}"}), 500
    else:
        return jsonify({"message": f"Failed to delete date range. Status code: {response.status_code}"}), 500



# Route to check user balance
@app.route("/check_balance", methods=["GET"])
@token_required
def check_balance():
    token = request.headers.get("Authorization")
    username = decode_token(token)["username"]
    db_index = hash_function(username)
    db_url = User_URLS[db_index]
    response = requests.get(f"{db_url}/users/{username}.json")
    print("response",response)
    if response.status_code == 200:
        user_data = response.json()
        print("user data",user_data)
        return jsonify({"username": username, "balance": user_data["account_balance"]})
    else:
        return jsonify({"message": f"Failed to fetch user balance. Status code: {response.status_code}"}), 500


@app.route("/buy_stock", methods=["POST"])
@token_required
def buy_stock():
    data = request.json
    token = request.headers.get("Authorization")
    username = decode_token(token)["username"]
    stock_name = data.get("stock_name")
    price = data.get("price")
    quantity = data.get("quantity")

    # Check if any of the required parameters are missing
    if not (stock_name and price and quantity):
        return jsonify({"message": "Stock name, price, or quantity is missing"}), 400

    # Calculate the total cost of the transaction
    total_cost = price * quantity

    # Retrieve user data from the database to check the balance
    db_index = hash_function(username)
    db_url = User_URLS[db_index]
    response = requests.get(f"{db_url}/users/{username}.json")

    if response.status_code == 200:
        user_data = response.json()
        # Check if the user's balance is sufficient for the transaction
        if user_data["account_balance"] >= total_cost:
            # Deduct the total cost from the user's balance
            user_data["account_balance"] -= total_cost
            # Update the user's data in the database
            response = requests.put(f"{db_url}/users/{username}.json", json=user_data)
            if response.status_code == 200:
                return jsonify({"message": f"Successfully bought {quantity} shares of {stock_name}"}), 200
            else:
                return jsonify({"message": f"Failed to update user balance. Status code: {response.status_code}"}), 500
        else:
            return jsonify({"message": "Insufficient balance"}), 400
    else:
        return jsonify({"message": f"Failed to fetch user data. Status code: {response.status_code}"}), 500



@app.route("/sell_stock", methods=["POST"])
@token_required
def sell_stock():
    data = request.json
    token = request.headers.get("Authorization")
    username = decode_token(token)["username"]
    stock_name = data.get("stock_name")
    price = data.get("price")
    quantity = data.get("quantity")

    # Check if any of the required parameters are missing
    if not (stock_name and price and quantity):
        return jsonify({"message": "Stock name, price, or quantity is missing"}), 400

    # Calculate the total value of the transaction
    total_value = price * quantity

    # Retrieve user data from the database to check the balance
    db_index = hash_function(username)
    db_url = User_URLS[db_index]
    response = requests.get(f"{db_url}/users/{username}.json")

    if response.status_code == 200:
        user_data = response.json()
        # Check if the user has enough shares to sell
        if stock_name in user_data.get("stocks", {}):
            current_quantity = user_data["stocks"][stock_name]["quantity"]
            if current_quantity >= quantity:
                # Calculate the new balance after selling the stocks
                user_data["account_balance"] += total_value
                user_data["stocks"][stock_name]["quantity"] -= quantity
                # Update the user's data in the database
                response = requests.put(f"{db_url}/users/{username}.json", json=user_data)
                if response.status_code == 200:
                    return jsonify({"message": f"Successfully sold {quantity} shares of {stock_name}"}), 200
                else:
                    return jsonify({"message": f"Failed to update user data. Status code: {response.status_code}"}), 500
            else:
                return jsonify({"message": "Insufficient shares to sell"}), 400
        else:
            return jsonify({"message": f"You don't own any shares of {stock_name}"}), 400
    else:
        return jsonify({"message": f"Failed to fetch user data. Status code: {response.status_code}"}), 500




if __name__ == "__main__":
    app.run()
