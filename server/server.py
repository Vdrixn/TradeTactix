from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from pycoingecko import CoinGeckoAPI
from yahoo_fin import stock_info as si
import yfinance as yf
import csv

app = Flask(__name__)
CORS(app)
cg = CoinGeckoAPI()
cache_timeout = timedelta(minutes=5)

# Cachés de datos
crypto_cache = {}
stocks_cache = {}
forex_cache = {}

# Variables globales
crypto_symbols_map = {}
crypto_ids = {}  # Mapa para nombres y IDs de criptomonedas
stocks_symbols_map = {}  # Mapa para nombres y símbolos de acciones
forex_symbols_map = {}  # Mapa para nombres y símbolos de pares de divisas
all_symbols = []  # Lista solo de símbolos de acciones

# Funciones auxiliares

# Comprueba si el índice está en la caché y si los datos están actualizados
def __is_cache_up_to_date(cache, index):
    return (
        index in cache and (datetime.now() - cache[index]["timestamp"]) <= cache_timeout
    )

def get_coin_id(symbol):
    return crypto_ids.get(symbol.upper())

# ---------------------------------------------------------------------------

# Funciones de inicialización de datos

def initialize_crypto_symbols(limit=250):  # Aumentado el límite para más criptomonedas
    global crypto_symbols_map, crypto_ids
    try:
        coins_list = cg.get_coins_markets(
            vs_currency="usd", order="market_cap_desc", per_page=limit, page=1
        )
        for coin in coins_list:
            symbol = coin.get("symbol", "").upper()
            name = coin.get("name", "")
            coin_id = coin.get("id", "")
            crypto_symbols_map[symbol] = name
            crypto_ids[symbol] = coin_id
    except Exception as e:
        print(f"Error al inicializar los símbolos de criptomonedas: {e}")


def initialize_stock_symbols():
    global stocks_symbols_map, all_symbols
    try:
        with open("data/stocks.csv", newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile, delimiter=";")
            for row in reader:
                symbol = row["Symbol"]
                name = row["Name"]
                stocks_symbols_map[symbol] = name
                all_symbols.append(symbol)
    except Exception as e:
        print(f"Error al inicializar los símbolos de acciones: {e}")

def initialize_forex_symbols():
    global forex_symbols_map
    try:
        with open("data/currencies.csv", newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Saltar la cabecera
            for row in reader:
                symbol = row[0]
                forex_symbols_map[symbol] = (
                    symbol  # El nombre es el mismo símbolo en este caso
                )
    except Exception as e:
        print(f"Error al inicializar los símbolos de pares de divisas: {e}")

# ---------------------------------------------------------------------------

# Endpoints para obtener listados de los simbolos de criptomonedas, acciones y divisas para barra de busqueda
@app.route("/api/crypto-symbols")
def api_crypto_symbols():
    # Devuelve el mapa de símbolos y nombres de criptomonedas
    return jsonify(crypto_symbols_map)

@app.route("/api/stock-symbols")
def api_stock_symbols():
    # Devuelve el mapa de símbolos y nombres de acciones
    return jsonify(stocks_symbols_map)

@app.route("/api/forex-symbols")
def api_forex_symbols():
    # Devuelve el mapa de símbolos y nombres de pares de divisas
    return jsonify(forex_symbols_map)

# ---------------------------------------------------------------------------

# Endpoints para listado de activos financieros

# ------------------------Criptomonedas-------------------
def __get_crypto_data_from_api(cache_page):
    start_index = cache_page * 50
    coins = cg.get_coins_markets(
        vs_currency="usd",
        order="market_cap_desc",
        per_page=50,
        page=cache_page,
        sparkline=True,
        price_change_percentage="7d",
    )

    for index, coin in enumerate(coins, start=start_index):
        crypto_info = {
            "symbol": coin["symbol"].upper(),
            "name": coin["name"],
            "image": coin["image"],
            "current_price": coin["current_price"],
            "price_change_24h": round(coin["price_change_percentage_24h"], 2),
            "price_change_7d": round(coin["price_change_percentage_7d_in_currency"], 2),
            "market_cap": coin["market_cap"],
            "sparkline": coin["sparkline_in_7d"]["price"]
            if "sparkline_in_7d" in coin
            else [],
        }
        crypto_cache[index] = {"timestamp": datetime.now(), "data": crypto_info}

@app.route("/crypto_listings")
def crypto_listings():
    actual_page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    start_index = (actual_page - 1) * limit
    end_index = start_index + limit

    all_data_recent = __is_cache_up_to_date(crypto_cache, start_index)
    if not all_data_recent:
        __get_crypto_data_from_api(start_index // 50)
    all_data_recent = __is_cache_up_to_date(crypto_cache, end_index)
    if not all_data_recent:
        __get_crypto_data_from_api(end_index // 50)

    crypto_data = [
        crypto_cache[index]["data"] for index in range(start_index, end_index)
    ]
    return jsonify(crypto_data)

# ------------------------Acciones------------------------

def __get_stocks_data_from_api(cache_page):
    start_index = cache_page * 50
    end_index = start_index + 50
    # Asegura que no excedas el número de símbolos disponibles
    subset_symbols = all_symbols[start_index : min(end_index, len(all_symbols))]
    processed_count = 0
    symbol_index = 0

    while processed_count < 50 and symbol_index < len(subset_symbols):
        symbol = subset_symbols[symbol_index]
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="7d")
            if len(hist) < 2:
                symbol_index += 1
                continue

            today_price = hist["Close"].iloc[-1]
            price_change_24h = (
                (today_price - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2] * 100
            )
            price_change_7d = (
                (today_price - hist["Close"].iloc[0]) / hist["Close"].iloc[0] * 100
            )

            stock_info = {
                "symbol": symbol,
                "name": stock.info.get("shortName", ""),
                "current_price": round(today_price, 2),
                "price_change_24h": round(price_change_24h, 2),
                "price_change_7d": round(price_change_7d, 2),
                "sparkline": hist["Close"].tolist(),
            }
            stocks_cache[start_index + processed_count] = {
                "timestamp": datetime.now(),
                "data": stock_info,
            }
            processed_count += 1

        except Exception as e:
            print(f"Error procesando el símbolo {symbol}: {e}")

        symbol_index += 1

    # Si no se alcanzaron los 50 y todavía hay símbolos por procesar
    if processed_count < 50 and (start_index + processed_count) < len(all_symbols):
        __get_stocks_data_from_api(cache_page + 1)

@app.route("/stocks_listings")
def stocks_listings():
    actual_page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    start_index = (actual_page - 1) * limit
    end_index = start_index + limit

    all_data_recent = __is_cache_up_to_date(stocks_cache, start_index)
    if not all_data_recent:
        __get_stocks_data_from_api(start_index // 50)
    all_data_recent = __is_cache_up_to_date(stocks_cache, end_index)
    if not all_data_recent:
        __get_stocks_data_from_api(end_index // 50)

    stocks_data = [
        stocks_cache[index]["data"] for index in range(start_index, end_index)
    ]
    return jsonify(stocks_data)

# ------------------------Divisas-------------------------

def __get_forex_data_from_api(cache_page):
    pass

@app.route("/forex_listings")
def forex_listings():
    pass

# ---------------------------------------------------------------------------

# Endpoints para obtener resúmenes de activos financieros

@app.route("/api/summary")
def api_summary():
    symbol = request.args.get("symbol")

    if symbol in crypto_symbols_map:
        return get_crypto_summary(symbol)
    elif symbol in stocks_symbols_map:
        return get_stock_summary(symbol)
    elif symbol in forex_symbols_map:
        return get_forex_summary(symbol)
    else:
        return jsonify({"error": "Símbolo no encontrado"}), 404
    
def get_crypto_summary(symbol):
    try:
        coin_id = get_coin_id(symbol)
        if not coin_id:
            return jsonify({"error": "Símbolo no encontrado en CoinGecko"}), 404

        print(f"Coin ID for {symbol}: {coin_id}")  # Agregar para depuración

        coin_data = cg.get_coin_by_id(coin_id, localization=False)
        summary = {
            "symbol": coin_data["symbol"].upper(),
            "name": coin_data["name"],
            "current_price": coin_data["market_data"]["current_price"]["usd"],
            "market_cap": coin_data["market_data"]["market_cap"]["usd"],
            "total_volume": coin_data["market_data"]["total_volume"]["usd"],
            "high_24h": coin_data["market_data"]["high_24h"]["usd"],
            "low_24h": coin_data["market_data"]["low_24h"]["usd"],
            "price_change_percentage_1h": coin_data["market_data"][
                "price_change_percentage_1h_in_currency"
            ]["usd"],
            "price_change_percentage_24h": coin_data["market_data"][
                "price_change_percentage_24h"
            ],
            "price_change_percentage_7d": coin_data["market_data"][
                "price_change_percentage_7d"
            ],
            "circulating_supply": coin_data["market_data"]["circulating_supply"],
            "total_supply": coin_data["market_data"]["total_supply"],
            "ath": coin_data["market_data"]["ath"]["usd"],
            "ath_date": coin_data["market_data"]["ath_date"]["usd"],
            "atl": coin_data["market_data"]["atl"]["usd"],
            "atl_date": coin_data["market_data"]["atl_date"]["usd"],
            "sentiment_votes_up_percentage": coin_data["sentiment_votes_up_percentage"],
            "sentiment_votes_down_percentage": coin_data[
                "sentiment_votes_down_percentage"
            ],
        }
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos de criptomoneda: {e}"}), 500

def get_stock_summary(symbol):
    try:
        stock = yf.Ticker(symbol)
        stock_info = stock.info
        summary = {
            "symbol": symbol.upper(),
            "name": stock_info.get("shortName", ""),
            "current_price": stock_info.get("currentPrice", 0),
            "market_cap": stock_info.get("marketCap", 0),
            "total_volume": stock_info.get("volume", 0),
            "high_24h": stock_info.get("dayHigh", 0),
            "low_24h": stock_info.get("dayLow", 0),
            "high_52_weeks": stock_info.get("fiftyTwoWeekHigh", 0),
            "low_52_weeks": stock_info.get("fiftyTwoWeekLow", 0),
            "beta": stock_info.get("beta", 0),
            "pe_ratio": stock_info.get("trailingPE", 0),
            "eps": stock_info.get("trailingEps", 0),
            "dividend_yield": stock_info.get("dividendYield", 0),
            "dividend_date": stock_info.get("dividendDate", ""),
        }
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos de acción: {e}"}), 500


def get_forex_summary(symbol):
    try:
        forex_data = si.get_quote_table(symbol)
        summary = {
            "symbol": symbol,
            "name": forex_symbols_map.get(symbol, ""),
            "current_price": forex_data.get("Previous Close", 0),
            "market_cap": None,
            "total_volume": None,
            "high_24h": None,
            "low_24h": None,
        }
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos de divisas: {e}"}), 500

# Endpoint para obtener datos de gráfico de los activos financieros

@app.route("/api/chart", methods=["GET"])
def get_chart_data():
    symbol = request.args.get("symbol").upper()
    interval = request.args.get("interval", "1d")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if symbol in crypto_symbols_map:
        return get_crypto_chart_data_yf(symbol, interval, start_date, end_date)
    elif symbol in stocks_symbols_map:
        return get_stock_chart_data(symbol, interval, start_date, end_date)
    else:
        return jsonify({"error": "Símbolo no encontrado"}), 404

def get_crypto_chart_data(symbol, interval, start_date, end_date):
    try:
        coin_id = get_coin_id(symbol)
        if not coin_id:
            return jsonify({"error": "Símbolo no encontrado en CoinGecko"}), 404

        from_timestamp = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
        to_timestamp = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp())

        data = cg.get_coin_market_chart_range_by_id(
            id=coin_id,
            vs_currency="usd",
            from_timestamp=from_timestamp,
            to_timestamp=to_timestamp,
        )
        chart_data = [
            {
                "time": datetime.fromtimestamp(point[0] / 1000).isoformat(),
                "value": point[1],
            }
            for point in data["prices"]
        ]
        return jsonify(chart_data)
    except Exception as e:
        return jsonify(
            {"error": f"Error al obtener datos del gráfico de criptomoneda: {e}"}
        ), 500

def get_crypto_chart_data_yf(symbol, interval, start_date, end_date):
    try:
        # Convertir intervalos a los permitidos por yfinance
        yf_intervals = {
            "1m": "1m",
            "5m": "5m",
            "15m": "15m",
            "1h": "60m",
            "1d": "1d",
            "1wk": "1wk",
            "1mo": "1mo",
        }
        yf_interval = yf_intervals.get(interval.lower(), "1d")

        # Ajustar el símbolo para yfinance (por ejemplo, BTC-USD)
        symbol_yf = f"{symbol}-USD"

        # Obtener datos históricos
        hist = yf.Ticker(symbol_yf).history(
            interval=yf_interval, start=start_date, end=end_date
        )

        # Procesar los datos para devolverlos en el formato esperado
        chart_data = [
            {"time": row.name.isoformat(), "value": row["Close"]}
            for index, row in hist.iterrows()
        ]
        return jsonify(chart_data)
    except Exception as e:
        return jsonify(
            {"error": f"Error al obtener datos del gráfico de criptomoneda: {e}"}
        ), 500


def get_stock_chart_data(symbol, interval, start_date, end_date):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(interval=interval, start=start_date, end=end_date)
        chart_data = [
            {"time": row.name.isoformat(), "value": row["Close"]}
            for index, row in hist.iterrows()
        ]
        return jsonify(chart_data)
    except Exception as e:
        return jsonify(
            {"error": f"Error al obtener datos del gráfico de acción: {e}"}
        ), 500

def get_forex_chart_data(symbol, interval, start_date, end_date):
    pass

# ---------------------------------------------------------------------------

# Endpoint para realizar el backtesting
@app.route("/api/backtest", methods=["POST"])
def backtest():
    pass


if __name__ == "__main__":
    initialize_crypto_symbols()  # Cargar símbolos de criptomonedas al iniciar
    initialize_stock_symbols()  # Cargar símbolos de acciones al iniciar
    initialize_forex_symbols()  # Cargar símbolos de pares de divisas al iniciar
    app.run(debug=True, port=8080)
