from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from datetime import datetime, timedelta
from pycoingecko import CoinGeckoAPI
import yfinance as yf
import pandas as pd
import csv
import math

app = Flask(__name__)
CORS(app)
cg = CoinGeckoAPI()
cache_timeout = timedelta(minutes=5)
# Configura tu clave de API de OpenAI


# Cachés de datos
crypto_cache = {}
stocks_cache = {}
forex_cache = {}

# Variables globales
crypto_symbols_map = {}
crypto_ids = {}  # Mapa para nombres y IDs de criptomonedas
stocks_symbols_map = {}  # Mapa para nombres y símbolos de acciones
forex_symbols_map = {}  # Mapa para nombres y símbolos de pares de divisas
all_forex_symbols = []  # Lista solo de símbolos de divisas
all_symbols = []  # Lista solo de símbolos de acciones

# Funciones auxiliares


# Comprueba si el rango de índices está en la caché y si los datos están actualizados
def __is_cache_up_to_date(cache, startIndex):
    return (
        startIndex in cache
        and (datetime.now() - cache[startIndex]["timestamp"]) <= cache_timeout
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
    global forex_symbols_map, all_forex_symbols
    try:
        with open("data/forex.csv", newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                symbol = row["Ticker"]
                name = row["Instrument"]
                forex_symbols_map[name] = symbol
                all_forex_symbols.append(symbol)
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
    start_index = cache_page * 25
    subset_symbols = all_symbols[start_index:]

    try:
        data = yf.download(subset_symbols, period="7d", group_by="ticker")
    except Exception as e:
        print(f"Error descargando datos para los símbolos: {e}")
        return

    elements = 0
    for symbol in subset_symbols:
        try:
            if elements == 25:
                break
            if symbol not in data or len(data[symbol]) < 2:
                continue

            hist = data[symbol]
            today_price = hist["Close"].iloc[-1]
            if math.isnan(today_price):
                continue

            price_change_24h = (
                (today_price - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2] * 100
            )
            price_change_7d = (
                (today_price - hist["Close"].iloc[0]) / hist["Close"].iloc[0] * 100
            )

            stock = yf.Ticker(symbol)
            stock_info = {
                "symbol": symbol,
                "name": stock.info.get("shortName", ""),
                "current_price": round(today_price, 2),
                "price_change_24h": round(price_change_24h, 2),
                "price_change_7d": round(price_change_7d, 2),
                "sparkline": hist["Close"].tolist(),
                "market_cap": stock.info.get("marketCap", 0),
            }
            stocks_cache[start_index + elements] = {
                "timestamp": datetime.now(),
                "data": stock_info,
            }
            elements += 1

        except Exception as e:
            print(f"Error procesando el símbolo {symbol}: {e}")


@app.route("/stocks_listings")
def stocks_listings():
    actual_page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    start_index = (actual_page - 1) * limit
    end_index = start_index + limit

    if not __is_cache_up_to_date(stocks_cache, start_index):
        __get_stocks_data_from_api(start_index // 25)
    if not __is_cache_up_to_date(stocks_cache, end_index):
        __get_stocks_data_from_api(end_index // 25)

    stocks_data = [
        stocks_cache[index]["data"]
        for index in range(start_index, end_index)
        if index in stocks_cache
    ]
    return jsonify(stocks_data)


# ------------------------Divisas-------------------------


def __get_forex_data_from_api(cache_page):
    start_index = cache_page * 25
    subset_symbols = all_forex_symbols[start_index:]

    try:
        data = yf.download(subset_symbols, period="7d", group_by="ticker")
    except Exception as e:
        print(f"Error descargando datos para los símbolos: {e}")
        return

    elements = 0
    for symbol in subset_symbols:
        try:
            if elements == 25:
                break
            if symbol not in data or len(data[symbol]) < 2:
                continue

            hist = data[symbol]
            today_price = hist["Close"].iloc[-1]
            if math.isnan(today_price):
                continue

            price_change_24h = (
                (today_price - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2] * 100
            )
            price_change_7d = (
                (today_price - hist["Close"].iloc[0]) / hist["Close"].iloc[0] * 100
            )

            stock = yf.Ticker(symbol)
            stock_info = {
                "symbol": symbol,
                "name": stock.info.get("shortName", "-")
                if stock.info.get("shortName")
                else "-",
                "current_price": today_price if not math.isnan(today_price) else "-",
                "price_change_24h": round(price_change_24h, 2)
                if not math.isnan(price_change_24h)
                else "-",
                "price_change_7d": round(price_change_7d, 2)
                if not math.isnan(price_change_7d)
                else "-",
                "sparkline": [
                    price for price in hist["Close"].tolist() if not math.isnan(price)
                ],
            }
            forex_cache[start_index + elements] = {
                "timestamp": datetime.now(),
                "data": stock_info,
            }
            elements += 1

        except Exception as e:
            print(f"Error procesando el símbolo {symbol}: {e}")


@app.route("/forex_listings")
def forex_listings():
    actual_page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    start_index = (actual_page - 1) * limit
    end_index = start_index + limit

    if not __is_cache_up_to_date(forex_cache, start_index):
        __get_forex_data_from_api(start_index // 25)
    if not __is_cache_up_to_date(forex_cache, end_index):
        __get_forex_data_from_api(end_index // 25)

    forex_data = [
        forex_cache[index]["data"]
        for index in range(start_index, end_index)
        if index in forex_cache
    ]
    return jsonify(forex_data)


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
        return get_forex_summary(forex_symbols_map[symbol], symbol)
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


def get_forex_summary(forex_ticker, symbol):
    try:
        forex_data = yf.Ticker(forex_ticker)
        hist = forex_data.history(period="1d")

        if hist.empty:
            return jsonify({"error": "No se encontraron datos para el símbolo"}), 404

        current_price = hist["Close"].iloc[-1]
        summary = {
            "symbol": forex_ticker,
            "name": symbol,
            "current_price": current_price,
            "market_cap": None,
            "total_volume": None,
            "high_24h": hist["High"].iloc[-1],
            "low_24h": hist["Low"].iloc[-1],
        }
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos de divisas: {e}"}), 500


# Endpoint para obtener datos de gráfico de los activos financieros


@app.route("/api/chart", methods=["GET"])
def get_chart_data():
    symbol = request.args.get("symbol").upper()
    interval = request.args.get("interval", "1d")

    if symbol in crypto_symbols_map:
        return get_crypto_chart_data_yf(symbol, interval)
    elif symbol in stocks_symbols_map:
        return get_stock_chart_data(symbol, interval)
    elif symbol in forex_symbols_map:
        return get_forex_chart_data(forex_symbols_map[symbol], interval)
    else:
        return jsonify({"error": "Símbolo no encontrado"}), 404


def get_stock_chart_data(symbol, interval):
    try:
        yf_intervals = {
            "15m": "15m",
            "30m": "30m",
            "1h": "1h",
            "1D": "1d",
        }
        yf_interval = yf_intervals.get(interval, "1d")

        end_date = datetime.now()
        if yf_interval == "15m" or yf_interval == "30m":
            start_date = end_date - timedelta(days=59)
        elif yf_interval == "1h":
            start_date = end_date - timedelta(days=729)
        else:
            start_date = end_date - timedelta(days=1460)

        hist = yf.Ticker(symbol).history(
            interval=yf_interval,
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
        )

        print(
            f"Datos obtenidos para {symbol} en intervalo {interval}: {len(hist)} registros"
        )

        chart_data = [
            {
                "time": int(row.name.timestamp()),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
            }
            for index, row in hist.iterrows()
        ]
        return jsonify(chart_data)
    except Exception as e:
        return jsonify(
            {"error": f"Error al obtener datos del gráfico de acción: {e}"}
        ), 500


def get_forex_chart_data(symbol, interval):
    try:
        yf_intervals = {
            "15m": "15m",
            "30m": "30m",
            "1h": "1h",
            "1D": "1d",
        }
        yf_interval = yf_intervals.get(interval, "1d")

        end_date = datetime.now()
        if yf_interval == "15m" or yf_interval == "30m":
            start_date = end_date - timedelta(days=59)
        elif yf_interval == "1h":
            start_date = end_date - timedelta(days=729)
        else:
            start_date = end_date - timedelta(days=1460)

        hist = yf.Ticker(symbol).history(
            interval=yf_interval,
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
        )

        print(
            f"Datos obtenidos para {symbol} en intervalo {interval}: {len(hist)} registros"
        )

        chart_data = [
            {
                "time": int(row.name.timestamp()),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
            }
            for index, row in hist.iterrows()
        ]
        return jsonify(chart_data)
    except Exception as e:
        return jsonify(
            {"error": f"Error al obtener datos del gráfico de divisas: {e}"}
        ), 500


def get_crypto_chart_data_yf(symbol, interval):
    try:
        yf_intervals = {
            "15m": "15m",
            "30m": "30m",
            "1h": "1h",
            "1D": "1d",
        }
        yf_interval = yf_intervals.get(interval, "1d")

        symbol_yf = f"{symbol}-USD"

        end_date = datetime.now()
        if yf_interval == "15m" or yf_interval == "30m":
            start_date = end_date - timedelta(days=59)
        elif yf_interval == "1h":
            start_date = end_date - timedelta(days=729)
        else:
            start_date = end_date - timedelta(days=1460)

        hist = yf.Ticker(symbol_yf).history(
            interval=yf_interval,
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
        )

        print(
            f"Datos obtenidos para {symbol_yf} en intervalo {interval}: {len(hist)} registros"
        )

        chart_data = [
            {
                "time": int(row.name.timestamp()),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
            }
            for index, row in hist.iterrows()
        ]
        return jsonify(chart_data)
    except Exception as e:
        return jsonify(
            {"error": f"Error al obtener datos del gráfico de criptomoneda: {e}"}
        ), 500


# ---------------------------------------------------------------------------


def __get_historical_data(symbol, start_date, end_date, interval):
    yf_intervals = {
        "15m": "15m",
        "30m": "30m",
        "1h": "1h",
        "1D": "1d",
    }
    yf_interval = yf_intervals.get(interval, "1d")

    print("historical_data 1")
    if symbol in crypto_symbols_map:
        print("historical_data dentro de crypto")
        return __get_crypto_historical_data(symbol, yf_interval, start_date, end_date)
    elif symbol in stocks_symbols_map:
        print("historical_data dentro de stocks")
        return __get_Stocks_Forex_historical_data(
            symbol, yf_interval, start_date, end_date
        )
    elif symbol in forex_symbols_map:
        print("historical_data dentro de forex")
        return __get_Stocks_Forex_historical_data(
            forex_symbols_map[symbol], yf_interval, start_date, end_date
        )
    else:
        return ValueError("Simbolo no encontrado")


def __get_Stocks_Forex_historical_data(symbol, interval, start_date, end_date):
    hist = yf.Ticker(symbol).history(
        interval=interval,
        start=start_date,
        end=end_date,
    )

    print(
        f"Datos obtenidos para {symbol} en intervalo {interval}: {len(hist)} registros"
    )

    if hist.empty:
        raise ValueError(
            "No se han encontrado datos para el símbolo y el rango de fechas proporcionados"
        )
    return hist[["Close"]]


def __get_crypto_historical_data(symbol, interval, start_date, end_date):
    symbol_yf = f"{symbol}-USD"

    hist = yf.Ticker(symbol_yf).history(
        interval=interval,
        start=start_date,
        end=end_date,
    )

    print(
        f"Datos obtenidos para {symbol_yf} en intervalo {interval}: {len(hist)} registros"
    )
    if hist.empty:
        raise ValueError(
            "No se han encontrado datos para el símbolo y el rango de fechas proporcionados"
        )
    return hist[["Close"]]


def calculate_stop_loss_take_profit(
    total_portfolio, percentage_of_portfolio_to_risk, risk_benefit_ratio, leverage
):
    # Calculate the risk in dollars
    risk_in_dollars = total_portfolio * (percentage_of_portfolio_to_risk / 100)
    print("risk_in_dollars", risk_in_dollars)
    # Calculate the desired profit in dollars
    desired_profit_in_dollars = risk_in_dollars * risk_benefit_ratio

    # Calculate the total position (exposure)
    total_position = risk_in_dollars * leverage

    # Calculate the percentage change for stop loss
    percentage_change_stop_loss = risk_in_dollars / total_position

    # Calculate the percentage change for take profit
    percentage_change_take_profit = desired_profit_in_dollars / total_position

    print("percentage_change_stop_loss", percentage_change_stop_loss)
    print("percentage_change_take_profit", percentage_change_take_profit)

    return percentage_change_stop_loss, percentage_change_take_profit, risk_in_dollars


def backtest(
    data,
    signals,
    initial_capital,
    risk_reward_ratio,
    trade_amount,
    stop_loss,
    take_profit,
    leverage,
):
    positions = pd.DataFrame(index=signals.index).fillna(0.0)
    portfolio = pd.DataFrame(index=signals.index).fillna(0.0)
    portfolio["cash"] = initial_capital
    portfolio["hold"] = data["Close"] * (initial_capital / data["Close"].iloc[0])
    portfolio["total"] = initial_capital  # Inicializar la columna 'total'

    open_positions = []
    current_cash = initial_capital

    winning_trades = 0
    losing_trades = 0
    trade_durations = []
    peak = initial_capital
    trough = initial_capital

    for date, signal in signals.iterrows():
        print("date", date)

        entry_price = data.loc[date, "Close"]
        signals.loc[date, "price"] = entry_price

        # Verificar y cerrar posiciones abiertas
        for position in open_positions[:]:
            entry_price = position["entry_price"]
            position_size = position["position_size"]
            sl_price = position["sl_price"]
            tp_price = position["tp_price"]
            direction = position["direction"]
            current_price = data.loc[date, "Close"]

            if (direction == 1 and current_price <= sl_price) or (
                direction == -1 and current_price >= sl_price
            ):
                losing_trades += 1
                trade_duration = (date - position["entry_date"]).days
                trade_durations.append(trade_duration)
                open_positions.remove(position)
            elif (direction == 1 and current_price >= tp_price) or (
                direction == -1 and current_price <= tp_price
            ):
                winning_trades += 1
                trade_duration = (date - position["entry_date"]).days
                trade_durations.append(trade_duration)
                current_cash += trade_amount * risk_reward_ratio
                open_positions.remove(position)

        entry_price = data.loc[date, "Close"]
        # Verificar si hay efectivo suficiente para abrir nuevas posiciones
        if current_cash > 0:
            # Abrir nuevas posiciones
            if signal["positions"] > 0:  # Señal de compra
                position_size = (trade_amount * leverage) / entry_price
                sl_price = entry_price - (entry_price * stop_loss)
                tp_price = entry_price + (entry_price * take_profit)
                signals.loc[date, "sl_price"] = sl_price
                signals.loc[date, "tp_price"] = tp_price

                open_positions.append(
                    {
                        "entry_date": date,
                        "entry_price": entry_price,
                        "position_size": position_size,
                        "sl_price": sl_price,
                        "tp_price": tp_price,
                        "direction": 1,
                    }
                )
                current_cash -= trade_amount

            elif signal["positions"] < 0:  # Señal de venta
                position_size = (trade_amount * leverage) / entry_price
                sl_price = entry_price + (entry_price * stop_loss)
                tp_price = entry_price - (entry_price * take_profit)
                signals.loc[date, "sl_price"] = sl_price
                signals.loc[date, "tp_price"] = tp_price

                open_positions.append(
                    {
                        "entry_date": date,
                        "entry_price": entry_price,
                        "position_size": position_size,
                        "sl_price": sl_price,
                        "tp_price": tp_price,
                        "direction": -1,
                    }
                )
                current_cash -= trade_amount

        totalUnrealizedPnl = 0
        # Actualizar el valor de las posiciones y el efectivo
        for position in open_positions:
            current_price = data.loc[date, "Close"]
            if position["direction"] == 1:
                unrealizedPnl = (current_price - position["entry_price"]) * position[
                    "position_size"
                ]
            elif position["direction"] == -1:
                unrealizedPnl = (position["entry_price"] - current_price) * position[
                    "position_size"
                ]
            totalUnrealizedPnl += unrealizedPnl

        # Actualizar el valor del efectivo
        positions.loc[date, "asset"] = totalUnrealizedPnl
        portfolio.loc[date, "cash"] = current_cash

        # Calcular el máximo drawdown y el máximo incremento del portfolio
        total_value = current_cash + totalUnrealizedPnl
        if total_value > peak:
            peak = total_value
        if total_value < trough:
            trough = total_value

        portfolio.at[date, "total"] = total_value

    # Calcular el máximo drawdown y el máximo incremento del portfolio
    max_drawdown = (trough - peak) / peak
    max_increase = (peak - initial_capital) / initial_capital

    # Calcular la duración promedio de las operaciones
    if trade_durations:
        average_duration = sum(trade_durations) / len(trade_durations)
    else:
        average_duration = 0

    # Actualizar el valor total del portafolio
    portfolio["positions"] = positions["asset"]
    portfolio["total"] = portfolio["positions"] + portfolio["cash"]
    portfolio["returns"] = portfolio["total"].pct_change()

    summary = {
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
        "max_drawdown": max_drawdown,
        "max_increase": max_increase,
        "average_duration": average_duration,
        "num_trades": winning_trades + losing_trades,
        "num_positions": len(open_positions),
        "initial_capital": initial_capital,
        "unrealized_pnl": totalUnrealizedPnl,
        "final_capital": total_value,
    }

    return portfolio, summary


@app.route("/api/backtest", methods=["POST"])
def backtest_endpoint():
    data = request.json  # Obtener los datos del request en formato JSON

    # Obtener los parámetros
    symbol = data["symbol"]
    start_date = data["start_date"]
    end_date = data["end_date"]
    temporalidad = data["temporalidad"]
    algorithm_code = data["algorithm"]
    initial_capital = data.get("initial_capital", 10000.0)
    trade_risk = data.get("trade_risk", 1)
    leverage = data.get("leverage", 50)
    risk_reward_ratio = data.get("risk_reward_ratio", 2)

    stop_loss, take_profit, trade_amount = calculate_stop_loss_take_profit(
        initial_capital, trade_risk, risk_reward_ratio, leverage
    )

    # Obtener datos históricos del símbolo
    try:
        historical_data = __get_historical_data(
            symbol, start_date, end_date, temporalidad
        )
    except Exception as e:
        return jsonify({"error": f"Error fetching historical data: {str(e)}"}), 500

    # Crear un diccionario para el espacio de nombres local
    local_namespace = {}
    # Ejecutar el algoritmo proporcionado
    try:
        exec(algorithm_code, globals(), local_namespace)
    except Exception as e:
        return jsonify({"error": f"Error executing algorithm code: {str(e)}"}), 500

    # Obtenemos la función generate_signals del espacio de nombres local
    generate_signals = local_namespace.get("generate_signals")

    # Comprobar si la función generate_signals existe y es callable
    if not generate_signals or not callable(generate_signals):
        return jsonify(
            {"error": "Function 'generate_signals' not found in algorithm code"}
        ), 400

    # Generar señales
    try:
        signals = generate_signals(historical_data)
    except Exception as e:
        return jsonify({"error": f"Error executing generate_signals: {str(e)}"}), 500

    try:
        portfolio, summary = backtest(
            historical_data,
            signals,
            initial_capital,
            risk_reward_ratio,
            trade_amount,
            stop_loss,
            take_profit,
            leverage,
        )
    except Exception as e:
        return jsonify({"error": f"Error executing backtest: {str(e)}"}), 500

    # Convertir los índices a strings en el formato adecuado
    def format_date_index(index):
        return index.strftime("%Y-%m-%dT%H:%M:%S")

    signals.index = signals.index.map(format_date_index)
    portfolio.index = portfolio.index.map(format_date_index)

    # Función para limpiar valores NaN e Infinity
    def clean_data(data):
        for key, value in data.items():
            if isinstance(value, dict):
                clean_data(value)
            else:
                if pd.isna(value) or value == float("inf") or value == float("-inf"):
                    data[key] = None

    # Convertir a diccionario y limpiar datos
    signals_dict = signals.to_dict()
    portfolio_dict = portfolio.to_dict()
    clean_data(signals_dict)
    clean_data(portfolio_dict)

    results = {
        "signals": signals_dict,
        "portfolio": portfolio_dict,
        "summary": {
            "final_portfolio_value": portfolio["total"].iloc[-1],
            "total_return": (
                (portfolio["total"].iloc[-1] / portfolio["total"].iloc[0]) - 1
            )
            * 100,
            **summary,  # Añadir el summary calculado
        },
    }

    print("stop_loss", stop_loss)
    print("take_profit", take_profit)
    print("trade_amount", trade_amount)
    # Devolvemos los resultados del backtest
    return jsonify(results)


# ---------------------------------------------------------------------------

# Endpoint para obtener la respuesta de OpenAI


@app.route("/api/generate-algorithm", methods=["POST"])
def generate_algorithm():
    # Extraemos las instrucciones del cuerpo de la solicitud
    data = request.get_json()
    instructions = data.get("instructions", "")

    # Preparamos la consulta para la API de OpenAI incluyendo las instrucciones del usuario.
    prompt = (
        f"Crear un algoritmo de trading que cumpla con las siguientes instrucciones:\n"
        f"{instructions}\n\n"
        "El Algoritmo debe incluir únicamente la función generate_signals(data) que recibe un DataFrame con los precios. "
        "Debe retornar un DataFrame.\n\n"
        "Requisitos Obligatorios:\n"
        "1. Definición de la función:\ndef generate_signals(data):\n\n"
        "2. Creación de la estructura de datos:\nsignals = pd.DataFrame(index=data.index)\n\n"
        "3. Columna obligatoria 'positions':\nsignals['positions'] = ...\n"
        "- Valores > 0: posición larga (compra).\n"
        "- Valores < 0: posición corta (venta).\n"
        "- Valores = 0: sin operación.\n\n"
        "4. Devolución del DataFrame:\nreturn signals\n\n"
        "Por favor, proporciona solo el código de la función, no incluyas los import. Incluye comentarios explicativos en el codigo."
    )

    # Realizamos la consulta a la API de OpenAI
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 300,
            "n": 1,
            "stop": ["\n\n"],
        },
    )

    if response.status_code == 200:
        # Recuperamos la respuesta completa de la API.
        chatgpt_response = response.json()["choices"][0]["message"]["content"].strip()

        # Eliminamos las etiquetas de código ("```python" y "```") si están presentes.
        if chatgpt_response.startswith("```python"):
            chatgpt_response = chatgpt_response[9:].strip()
        if chatgpt_response.endswith("```"):
            chatgpt_response = chatgpt_response[:-3].strip()

        # Devolvemos la respuesta generada por OpenAI.
        return jsonify({"codigo": chatgpt_response})
    else:
        # Devolvemos un mensaje de error si la solicitud falló.
        return jsonify(
            {"error": "Failed to generate algorithm", "details": response.text}
        ), 500


# ----------------------------------------------------------------------------

if __name__ == "__main__":
    initialize_crypto_symbols()  # Cargar símbolos de criptomonedas al iniciar
    initialize_stock_symbols()  # Cargar símbolos de acciones al iniciar
    initialize_forex_symbols()  # Cargar símbolos de pares de divisas al iniciar
    app.run(debug=True, port=8080)
