People’s Information System (PIS)
A Secure, Modern, Full-Stack Cooperative Management Platform

Built for People’s Multipurpose Cooperative (PMPC) using Laravel 12 + React (Inertia.js)

<p align="center"> <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" /> <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" /> <img src="https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" /> <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white" /> <img src="https://img.shields.io/badge/Maya-Payments-00C383?style=for-the-badge&logo=stripe&logoColor=white" /> <img src="https://img.shields.io/badge/License-Private-red?style=for-the-badge" /> </p>
📌 Overview

The People’s Information System (PIS) is PMPC’s unified digital platform built to manage members, financial transactions, loan operations, and internal administrative processes with high accuracy, automation, and security.

It serves as the core digital ecosystem of the cooperative, supporting daily operations, approvals, financial activities, and branch-level management.

🔧 Main Features
🧍 Member Registration

Multi-step onboarding

Address cascading (Region → Province → City → Barangay)

Dependents management

Profile picture upload

PDF export

Strong validation logic

👤 Client Member Portal

Modern dashboard with charts and analytics

Savings, Share Capital, Capital Contribution, Time Deposit ledgers

Date filtering + pagination

Maya payment processing

Payment reminders (₱300 membership + ₱1,000 initial capital)

Animated modals for profile updates

💰 Financial Modules
Savings Deposit

Running balance

Debit/Credit transaction style

Latest transaction on top

Date range filtering

Capital Contribution

Monthly capital build-up

Maya payment integration

Ledger and balance overview

Share Capital

Real-time computation

Interest-based structure

Running balance

Time Deposit

Multi-term deposit planning

Maturity and interest logic

📄 Loan Management

Fully online loan application

Requirements upload and verification

Approval workflow: Processor → Recommender → Approver

Auto-generated loan ledger

Administrator recomputation (Net Proceeds, CapCon, Membership Fee, Term)

Configurable Loan Settings per term (Interest, Service Fee, Insurance, etc.)

🛠 Admin Panel

Member management

Loan control & monitoring

Capital/Savings/Share/Time deposit modules

Requirements and document verification

Loan computation settings

System analytics & dashboards

🧰 Tech Stack Overview
Backend

Laravel 12

PHP 8.2+

MySQL 8

Sanctum SPA authentication

Database queue driver

Pure Eloquent ORM

Frontend

React + Inertia.js

TailwindCSS

Framer Motion

Lucide Icons

Tremor charts

🔐 Security Highlights

Full sanitization + strict validation

Database-backed server sessions

No sensitive data exposed to React DevTools

Admin login uses email-based verification (2FA-like)

CSRF protection

Secure file uploads

Environment-protected payment keys

📌 Versioning

The PIS uses semantic versioning:

PIS vX.Y.Z


Displayed in the footer of the system.

👨‍💼 Credits

People’s Multipurpose Cooperative (PMPC)
Developed under the leadership of
COL Alexander L. Feria (Ret), CPA, MNSA
Chief Executive Officer

PIS is continuously enhanced to support PMPC’s digital transformation and operational excellence.

🔒 License

Private Proprietary Software
Unauthorized copying, distribution, or use is strictly prohibited.