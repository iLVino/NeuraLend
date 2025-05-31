import requests
import json

# Blockscout API base URL for Rootstock testnet
BLOCKSCOUT_API = "https://rootstock-testnet.blockscout.com/api"

# Predefined address for testing
ADDRESS = "0x93eC5e12AC770eF01920dF0D870b5A075937b55b"

# RootstockVault contract address (replace with your deployed vault)
WUSDC_ADDRESS = "0xD7749d762dA7B537E17C14DA5A4b69a71d8bdc49"  # wUSDC token address



# AI credit scoring function (from previous responses)
def get_credit_score(collateral_value, tx_count, honey_minted, lsp_deposit):
    prompt = (
        f"Input: Collateral = {collateral_value} tRBTC, Transactions = {tx_count}, "
        f"Honey Minted = {honey_minted} wUSDC, LSP Deposit = {lsp_deposit}. "
        f"Rules: Start with 0 points. "
        f"1. Collateral score: min(50, collateral_value * 50). "
        f"2. Transaction score: min(30, transactions * 2). "
        f"3. Ratio score: If collateral_value > 0 and honey_minted > 0, min(15, (collateral_value / honey_minted) * 5); else 0. "
        f"4. LSP score: If LSP Deposit is true, 5; else 0. "
        f"Total score: Sum, rounded to nearest integer (0–100). "
        f"Output: Exactly one integer (0–100). No text, no LaTeX, no explanation. "
        f"Examples: Collateral = 0.1, Transactions = 10, Honey = 0.05, LSP = true -> 45; "
        f"Collateral = 0.005, Transactions = 3, Honey = 0, LSP = false -> 7"
    )
    # Mock DeepSeek-R1:1.5b response (replace with actual API call)
    try:
        # Example calculation based on rules
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
        # Fallback: Return average score from examples
        return 45

def fetch_trbtc_balance(address):
    """Fetch tRBTC balance."""
    url = f"{BLOCKSCOUT_API}?module=account&action=balance&address={address}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data["status"] == "1":
            return int(data["result"]) / 10**18  # Convert Wei to tRBTC
    except Exception as e:
        print(f"Error fetching tRBTC balance: {e}")
    return 0.0

def fetch_tx_count(address):
    """Fetch transaction count."""
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
    """Fetch wUSDC balance (debt)."""
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

def main():
    print(f"Querying Rootstock testnet for address: {ADDRESS}")
    
    collateral_value = fetch_trbtc_balance(ADDRESS)
    tx_count = fetch_tx_count(ADDRESS)
    honey_minted = fetch_wusdc_debt(ADDRESS)
    lsp_deposit = False  # No LSP on Rootstock

    print(f"Collateral Value: {collateral_value} tRBTC")
    print(f"Transaction Count: {tx_count}")
    print(f"wUSDC Value: {honey_minted}")
    print(f"LSP Deposit: {lsp_deposit}")

    score = get_credit_score(collateral_value, tx_count, honey_minted, lsp_deposit)
    print(f"AI Credit Score: {score}")

if __name__ == "__main__":
    main()