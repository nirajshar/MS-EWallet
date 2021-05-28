## Description

EWallet (closed wallet) microservice for storing System (Master) & Wallet (Users)

1. System CRUD
2. Wallet CRUD
3. User CRUD
4. Transactions CR

## Rest endpoints (JSON)

  1 : System 

    - [ POST ]    - Register System (App)
    - [ GET ]     - Get all Systems [Limited Details]
    - [ GET ]     - Get System details by System UUID
    - [ PUT ]     - Update System details
    - [ POST ]    - Generate / Regenerate API Token (Only One API Token)
    - [ DELETE ]  - Delete System [Hard] (Restrict Cascade)

  2. Wallet 

    A. Infrastructure Management Team
	
      1: Wallet (CRUD)
        - [ POST ]      - Register Wallet
        - [ GET ]       - Get all Wallets [Limited Details]
        - [ GET ]       - Get Wallet details by Wallet UUID 
        - [ PUT ]       - Update Wallet details 
        - [ PUT ]       - Block / Unblock Wallet 
        - [ DELETE ]    - Delete Wallet [Hard] (Restrict Cascade)

      2: Wallet Transactions
        - [ POST ]      - Deposit (CREDIT) to Regular Wallet      [ Accept Payment via NEFT ]
        - [ POST ]      - Get Wallet Transactions by Wallet UUID  
        
        
    B. User
      
      1. Wallet (RU)
        - [ GET ]       - Get Wallet Balance [ OWN ]

      2: Wallet Transactions        
        - [ POST ]      - Get Balance                   [ OWN ]
        - [ POST ]      - Check Transactions            [ OWN ]
        - [ POST ]      - Pay (DEBIT) to Master Wallet  [ Transfer: Regular to Master Account ] 

## Installation

```bash
$ npm install
```

## Running the app

```bash
# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Stay in touch

- Author - [Niraj Sharma](https://github.com/nirajshar)