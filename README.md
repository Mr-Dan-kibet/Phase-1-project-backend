# 🚐 Luxury Rides

**Ease your journey — Book your ride, order your meal, and pay via M-Pesa.**

---

## 🚌 Overview

Luxury Rides is a **single-page seat booking platform** built for travelers moving between **Nairobi**, **Nakuru**, and **Eldoret**. This app allows users to:

- 🪑 Book multiple seats on a luxury ride  
- 🧾 View ticket information and receive a digital receipt  
- 📲 Pay seamlessly via **M-Pesa** integration (sandbox mode)  
- 🍽️ *Preorder food for the stopover* (planned feature)

This project demonstrates frontend engineering using **HTML**, **CSS**, **JavaScript**, and `json-server` for local data persistence.

---

## 🎯 Features

- 🔍 View available rides and seat availability  
- 🪑 Select multiple seats per booking  
- 🧾 View a receipt with ticket information  
- 📲 Make M-Pesa payments *(mocked using Safaricom sandbox API)*  
- 📋 Booking form with **live validation**  
- ✅ Clean, responsive UI  

---

## 🛠️ Technologies Used

- **HTML5 & CSS3**  
- **JavaScript (ES6+)**  
- **JSON Server** for local backend  
- **M-Pesa Daraja API (sandbox)**  
- **Live Server** (for frontend preview)

---

## 📁 File Structure
```
Luxury-Rides/
├── index.html
├── css/
│   └── style.css
├── src/
│   └── index.js
├── server/
│   ├── db.json
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── README.md
```

---

## 🚀 Setup Instructions

1. **Clone the Repository**
 ```bash
  git clone git@github.com:Mr-Dan-kibet/Phase-1-project.git
  cd Phase-1-project
```
2. Install JSON Server (if not already installed)
```
npm install -g json-server
```
3. Start JSON Server
```
json-server --watch db.json
```
5. Start the Frontend
```
Use the Live Server extension in VS Code
OR simply open index.html in your browser
```
---
## 👨🏽‍💻 Author
Dan Rotich
Full-Stack Developer @ Moringa School
GitHub: @Mr-Dan-kibet

---
## 🖼️ Preview
“Designed to reduce queues and waiting time at booking offices and stopovers — all from your phone.”

---

## 📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
