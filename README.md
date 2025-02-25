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
