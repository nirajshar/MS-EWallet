## Description

EWallet (closed wallet) microservice for storing System (Master) & Wallet (Users)

1. System CRUD
1. Wallet CRUD

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
	
      - [ POST ]    - Register Wallet 						
      - [ GET ]     - Get all Wallets [Limited Details]
      - [ GET ]     - Get Wallet details by Wallet UUID 
      - [ PUT ]     - Update Wallet details 
      - [ PUT ]     - Block / Unblock Wallet 
      - [ DELETE ]  - Delete Wallet [Hard] (Restrict Cascade)
          
		B. User

      - [ POST ]    - Debit from Wallet [ Owners Account ] [ Transfer: Regular to Master Account ] 
      - [ POST ]    - Credit to Wallet  [ Owners Account ] [ Accept Payment via Payment Gateway, Virtual Account, UPI ]
      - [ POST ]    - Check Balance by Wallet UUID [ Owners Account ]

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