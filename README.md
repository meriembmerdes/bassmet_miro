# 🛍️ Bassmet Miro — Full Stack E-Commerce Platform

Bassmet Miro is a modern full-stack e-commerce web application built with powerful and scalable technologies.
The platform provides a complete online shopping experience for customers and a professional admin dashboard for management.

---

# 🚀 Tech Stack

## Frontend

* React
* Vite
* Redux Toolkit
* Axios
* React Router

## Backend

* NestJS
* PostgreSQL
* TypeORM
* JWT Authentication
* Stripe-ready payment integration

---

# ✨ Features

## 👤 Customer Features

* User Registration & Login
* JWT Authentication
* Product Browsing
* Product Search & Filters
* Shopping Cart
* Wishlist
* Checkout System
* Coupon Support
* Order History
* Product Reviews & Ratings

## 🛠️ Admin Dashboard

* Add / Edit / Delete Products
* Manage Users
* Manage Orders
* Manage Categories
* Stock Management
* Role Management
* Dashboard Statistics

---

# 📂 Project Structure

```bash
bassmet_miro/
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── frontend/
│   ├── src/
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone git@github.com:meriembmerdes/bassmet_miro.git
cd bassmet_miro
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bassmet_miro

JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm run start:dev
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🗄️ Database

* PostgreSQL
* Managed using TypeORM
* Automatic table synchronization enabled during development

---

# 🔐 Authentication

* JWT-based authentication
* Protected admin routes
* Role-based authorization

---

# 👩‍💻 Author

Developed by **Meriem Bmerdes**

GitHub:
[git@github.com](mailto:git@github.com):meriembmerdes/bassmet_miro.git

---

# 📄 License

This project is for educational and portfolio purposes.
