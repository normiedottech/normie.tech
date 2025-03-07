# **Normie.tech Documentation**  
**Version 1.0**

---

## **1. Overview**  
### **What is Normie.tech?**  
Normie.tech is a **payment infrastructure platform** that enables Web3 businesses to accept **traditional card payments (Visa/Mastercard)** from users and automatically settle transactions in **crypto (e.g., stablecoins)**. It bridges the gap between fiat and crypto payments, simplifying onboarding for non-crypto-native users.  

### **Why Normie.tech?**  
- **Problem:**  
  - Users face friction with crypto onboarding (KYC, wallet setup, gas fees).  
  - Web3 businesses lose customers who prefer card payments and there is no way to onboard 4B+ card users.
- **Solution:**  
  - [Normie.tech](https://normie.tech/) accept card payments from your customers and auto-convert them to instant stablecoin settlements for you, no crypto complexity for your customers.

### **For Whom?**  
- **Web3 Businesses**: NFT platforms, DAOs, DeFi apps, crypto subscriptions, etc.  
- **Users**: Anyone who wants to interact with Web3 without holding crypto or managing wallets.  

## **2. Codebase Structure**  
- The repository is organized as:

### Key Directories:  
- **`infra/`**: SST infrastructure-as-code (API routes, secrets, event buses).  
- **`packages/core/`**: Shared business logic and type definitions.  
- **`packages/functions/`**: Serverless functions for payment/webhook handling.  
- **`packages/scripts/`**: Deployment scripts and precompiled project configurations.  
- **`packages/www/`**: Next.js frontend .  

## **3. Try It Yourself**
 ### **`1. Play with test enviornment`**

 - Go to [dev.normie.tech](https://www.dev.normie.tech) website.
 - Get Started by creating a dashboard page.
 - Redirect to `/dashboard` page and click on settings for a Test API.
 - If you have any questions, feel free to Contact Us.


 ### **`2. Try API Calls`**

 - Make sure to create an account on [dev.normie.tech](https://www.dev.normie.tech).
 - Copy your projectId from the dashboard.
 - Go to [`https://api-dev.normie.tech/v1/${your_project_id}/docs`](https://api-dev.normie.tech/v1/your_project_id/docs) replace your projectId here.
 - Just like this https://api-dev.normie.tech/v1/thirdpay/docs

 ### **`3. Sending API Requests to your project`**

   - **3.1. `creating checkout`**
    
      - Send POST request to the `api-dev.normie.tech/v1/${your_project_id}/0/checkout` by passing all required params.
      - Here is the example params for your reference
        ```
        params: {
              header: {
                "x-api-key":"your api key here",
                "Access-Control-Allow-Origin":"*"
              } as any
            },
            body:{
              customId,
              amount,
              chainId,
              customerEmail,
              name,
              blockChainName,
              success_url,
              extraMetadata:{
                // provide extra metadata as per requirement
              },
              metadata:{
                // provide necessary data (payoutAddress) 
              }
            }
        ```

      - Here is sample working cURL for your reference
        ```
        curl -X 'POST' \
          'https://api-dev.normie.tech/v1/thirdpay/0/checkout' \
          -H 'accept: application/json' \
          -H 'x-api-key: ' \
          -H 'Content-Type: application/json' \
          -d '{
          "description": "thirdpay test",
          "name": "Thirdpay",
          "amount": 100,
          "success_url": "https://www.thirdpay.io/",
          "chainId": 11155111,
          "blockChainName": "SEPOLIA-ETH",
          "metadata": {
            "payoutAddress": ""
          }
        }'
        ```
<br/>

  **3.2. `fetch all transactions`**
  - Send GET request to the `api-dev.normie.tech/v1/${your_project_id}/transactions`  
<br/>

  **3.3. `fetch transaction by transaction_id`**
  - Send GET request to the `api-dev.normie.tech/v1/${your_project_id}/transactions/{transaction_id}`


## **4.DOCS**

**[https://api-dev.normie.tech/v1/{your_project_id}/docs]**



<br/>

 
 ###  *** In Production make sure to use `api.normie.tech` instead of `api-dev.normie.tech`