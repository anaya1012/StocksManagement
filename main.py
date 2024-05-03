from datetime import datetime, timedelta
import jwt
from flask import Flask, request, jsonify
import yfinance as yf
import requests
import random
from functools import wraps
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

Database_URLS = {
    0: "https://stockdata0-cef07-default-rtdb.firebaseio.com/",
    1: "https://stocksdata1-default-rtdb.firebaseio.com/",
    2: "https://stocksdata2-default-rtdb.firebaseio.com/",
    3: "https://stocksdata3-default-rtdb.firebaseio.com/"
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
    # Calculate the sum of ASCII values of all characters in the username
    ascii_sum = sum(ord(char) for char in username)

    # Determine whether the sum is odd or even
    if ascii_sum % 2 == 1:
        return 0
    else:
        return 1

def get_hash_bucket(stock_name):
    ascii_sum = sum(ord(char) for char in stock_name)
    return ascii_sum%4

@app.route("/delete_stock/<stock_name>", methods=["DELETE"])
def delete_stock(stock_name):
    print("IN DELETE REQUEST", stock_name)
    # Delete the stock from the Firebase database
    firebase_url = "https://stock-name-6df87-default-rtdb.firebaseio.com/"
    db_index = get_hash_bucket(stock_name)
    firebase_url2 = Database_URLS[db_index]
    response = requests.delete(f"{firebase_url}/stock_names/{stock_name}.json")
    response2 = requests.delete(f"{firebase_url2}/stocks/{stock_name}.json")
    if response.status_code == 200 and response2.status_code == 200:
        return "Stock deleted successfully."
    else:
        return jsonify({"message": f"Failed to delete stock. Status code: {response.status_code}"}), 500


@app.route("/update_user_info", methods=["POST"])
def update_user_info():
    data = request.json
    original_username = data.get("original_username")
    updated_email = data.get("updated_email")

    if not (original_username and updated_email):
        return jsonify({"message": "Original username or updated email is missing"}), 400

    db_index = hash_function(original_username)
    db_url = User_URLS[db_index]

    response = requests.get(f"{db_url}/users/{original_username}.json")
    if response.status_code == 200:
        user_data = response.json()
        user_data["email"] = updated_email

        update_response = requests.put(f"{db_url}/users/{original_username}.json", json=user_data)

        if update_response.status_code == 200:
            print("EMail Updated")
            return jsonify({"message": "Email updated successfully"}), 200
        else:
            return jsonify({"message": f"Failed to update email. Status code: {update_response.status_code}"}), 500
    else:
        return jsonify({"message": f"Failed to fetch user information. Status code: {response.status_code}"}), 500


@app.route("/get_all_stock_names", methods=["GET"])
def get_all_stock_names():
    firebase_url = "https://stock-name-6df87-default-rtdb.firebaseio.com/"
    response = requests.get(f"{firebase_url}/stock_names.json")
    if response.status_code == 200:
        stock_names = response.json()
        return jsonify(stock_names)
    else:
        return jsonify({"message": f"Failed to fetch stock names. Status code: {response.status_code}"}), 500


# Route for user registration and token generation
@app.route("/register", methods=["POST"])
def register():
    print("GOT INTO REGISTER CALL")
    # Use request.form to retrieve form data
    data = request.json
    # Extract username and password from JSON data
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

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
        "account_balance": account_balance,
        "email": email
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

    db_index = hash_function(username)
    db_url = User_URLS[db_index]
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

# Route to add stock data
# Route to add stock data
@app.route("/add_stock", methods=["POST"])
def add_stock():
    data = request.json
    stock_name = data.get("stock_name")
    stock_nameF = data.get("stock_nameF")
    start_year = data.get("start_year")
    end_year = data.get("end_year")
    if not (stock_name and start_year and end_year):
        return jsonify({"message": "Stock name, start year, or end year is missing"}), 400

    # Add the stock name to the Firebase Realtime Database
    firebase_url = "https://stock-name-6df87-default-rtdb.firebaseio.com/"
    response = requests.put(f"{firebase_url}/stock_names/{stock_name}.json",
                            json={"stock_name": stock_name, "stock_nameF": stock_nameF})
    if response.status_code != 200:
        return jsonify(
            {"message": f"Failed to add stock name to the database. Status code: {response.status_code}"}), 500

    # Proceed to download stock data and add it to the database as before
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
        print("stock added to ", db_url)
        return "Stock data added successfully."
    else:
        return jsonify({"message": f"Failed to add stock data. Status code: {response.status_code}"}), 500


# Route to search stock by name
@app.route("/search_stock", methods=["GET"])
def search_stock():
    stock_name = request.args.get("stock_name")
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
    if response.status_code == 200:
        user_data = response.json()
        print(user_data)
        return jsonify({"username": username, "balance": user_data["account_balance"], "stocks": user_data["stocks"]})
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
        print("userData", user_data)
        if user_data["account_balance"] >= total_cost:
            # Deduct the total cost from the user's balance
            user_data["account_balance"] -= total_cost
            # Update the user's data in the database
            print("stocks", user_data.get("stocks", {}))
            if "stocks" not in user_data:
                user_data["stocks"] = {}  # Initialize the stocks dictionary if it doesn't exist
            if stock_name in user_data["stocks"]:
                # If the user already owns shares, update the quantity
                user_data["stocks"][stock_name]["quantity"] += quantity
            else:
                # If the user doesn't own shares, add the stock to the user's portfolio
                user_data["stocks"][stock_name] = {"quantity": quantity}
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
    print("userData", data)
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
    print("dbUrl", db_url)
    print("response", response)
    if response.status_code == 200:
        user_data = response.json()
        print("userData", user_data)
        # Check if the user has enough shares to sell
        if stock_name in user_data.get("stocks", {}):
            current_quantity = quantity
            print("current", current_quantity)
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


@app.route("/get_user_info", methods=["GET"])
def get_user_info():
    print("MAKING EFFORT")
    username = request.args.get("username")
    if not username:
        return jsonify({"message": "Username is missing"}), 400

    db_index = hash_function(username)
    db_url = User_URLS[db_index]
    response = requests.get(f"{db_url}/users/{username}.json")
    if response.status_code == 200:
        user_info = response.json()
        return jsonify(user_info)
    else:
        return jsonify({"message": f"Failed to fetch user information. Status code: {response.status_code}"}), 500


if __name__ == "__main__":
    app.run()