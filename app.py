from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Blockscout API base URL for Rootstock testnet
BLOCKSCOUT_API = "https://rootstock-testnet.blockscout.com/api"

# RootstockVault contract address (wUSDC token)
WUSDC_ADDRESS = "0xf748869c88013d14e67558Dd05D139E87b2D9086"

def get_credit_score(collateral_value, tx_count, honey_minted, lsp_deposit):
    try:
        score = 0
        # 1. Collateral score
        score += min(50, collateral_value * 50)
        # 2. Transaction score
        score += min(30, tx_count * 2)
        # 3. Ratio score
        if collateral_value > 0 and honey_minted > 0:
            score += min(15, (collateral_value / honey_minted) * 5)
        # 4. LSP score
        if lsp_deposit:
            score += 5
        return round(min(max(score, 0), 100))
    except Exception:
        return 45  # Fallback score

def fetch_trbtc_balance(address):
    url = f"{BLOCKSCOUT_API}?module=account&action=balance&address={address}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data["status"] == "1":
            return int(data["result"]) / 10**18  # Wei to tRBTC
    except Exception as e:
        print(f"Error fetching tRBTC balance: {e}")
    return 0.0

def fetch_tx_count(address):
    url = f"{BLOCKSCOUT_API}?module=account&action=txlist&address={address}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data["status"] == "1":
            return len(data["result"])
    except Exception as e:
        print(f"Error fetching tx count: {e}")
    return 0

def fetch_wusdc_debt(address):
    url = f"{BLOCKSCOUT_API}?module=account&action=tokenbalance&contractaddress={WUSDC_ADDRESS}&address={address}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data["status"] == "1":
            return int(data["result"]) / 10**6  # wUSDC: 6 decimals
    except Exception as e:
        print(f"Error fetching wUSDC debt: {e}")
    return 0.0

@app.route('/credit-score', methods=['POST'])
def get_credit_score_endpoint():
    try:
        data = request.get_json()
        wallet = data.get('wallet')
        if not wallet or not wallet.startswith('0x') or len(wallet) != 42:
            return jsonify({'error': 'Invalid wallet address'}), 400

        collateral_value = fetch_trbtc_balance(wallet)
        tx_count = fetch_tx_count(wallet)
        honey_minted = fetch_wusdc_debt(wallet)
        lsp_deposit = False  # No LSP on Rootstock

        score = get_credit_score(collateral_value, tx_count, honey_minted, lsp_deposit)
        return jsonify({
            'wallet': wallet,
            'creditScore': score,
            'collateralValue': collateral_value,
            'txCount': tx_count,
            'wUSDCDebt': honey_minted
        })

    except requests.RequestException as e:
        return jsonify({'error': f'Blockscout API error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)