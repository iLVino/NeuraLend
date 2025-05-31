# NeuraLend

Decentralized micro-lending platform on Rootstock with AI-based credit scoring.

## Features
- Connect wallet via MetaMask
- Deposit tRBTC as collateral
- Borrow wUSDC based on AI credit score
- Repay wUSDC loans
- Liquidate positions
- View real-time stats (tRBTC/wUSDC balance, collateral, debt, credit score)

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Blockchain**: Rootstock (Ethers.js v5.7.2)
- **API**: Axios
- **Backend**: Flask (Python)
- **Server**: http-server
- **Smart Contract**: `0xf748869c88013d14e67558Dd05D139E87b2D9086`

## Prerequisites
- Node.js
- Python
- MetaMask (Rootstock network)
- tRBTC for gas fees

## Setup

### 1. Clone Repository
```bash
git clone https://github.com/iLVino/NeuraLend.git
cd NeuraLend

2. Install Frontend Dependencies
bash

npm install -g http-server

Ensure files: index.html, app.js, styles.css, favicon.png, node_modules/axios/dist/axios.min.js
3. Set Up Flask Backend
Create app.py:
python

from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/credit-score": {"origins": "http://localhost:8080"}})

@app.route('/credit-score', methods=['POST'])
def credit_score():
    data = request.get_json()
    wallet = data.get('wallet')
    return {"creditScore": 750}  # Replace with AI logic

Install dependencies:
bash

pip install flask flask-cors

Run Flask:
bash

python app.py

4. Configure Rootstock
Add to MetaMask:
Testnet:
Name: Rootstock Testnet

RPC: https://public-node.testnet.rsk.co

Chain ID: 31

Symbol: tRBTC

5. Run Frontend
bash

http-server --cors

Access: http://localhost:8080
Usage
Open http://localhost:8080 with MetaMask

Click Connect Wallet

View stats: tRBTC/wUSDC balance, collateral, debt, credit score

Actions:
Deposit tRBTC

Borrow wUSDC

Repay wUSDC

Liquidate

Refresh stats as needed

Project Structure

NeuraLend/
├── index.html
├── app.js
├── styles.css
├── favicon.png
├── node_modules/axios/dist/axios.min.js
└── app.py  # Optional

Troubleshooting
Button Issues: Check MetaMask, console (F12), app.js load

CORS: Verify http-server --cors and Flask CORS

Contract: Confirm vaultAddress on Rootstock

Backend: Test http://localhost:5001/credit-score with:
bash

curl -X POST http://localhost:5001/credit-score -H "Content-Type: application/json" -d '{"wallet": "0x..."}'

Contributing
Fork repo

Create branch: git checkout -b feature/your-feature

Commit: git commit -m "Add feature"

Push: git push origin feature/your-feature

Open pull request

License
MIT License. See LICENSE.

