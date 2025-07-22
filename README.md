# TA-Appointment-System

This repository contains the full-stack application for the Teaching Assistant (TA) Appointment System. This system streamlines the recruitment and appointment process for Teaching Assistants within the CSE department, involving Admins, Lecturers, Potential TAs, the CSE Office, and the Head of Department (HoD).

## Project Overview

The TA Appointment System aims to automate and centralize the management of TA requests, applications, approvals, and final appointments. It features:
* **Admin Dashboard:** For initiating recruiting rounds, setting dates/hours, monitoring status, and managing communication.
* **Lecturer Portal:** For submitting and approving TA requests for their courses.
* **Potential TA Interface:** For viewing available positions, applying, and submitting necessary documents.
* **Automated Workflows:** Including email notifications and status updates.

## Technology Stack

* **Frontend:** React.js with Vite
* **Backend:** Node.js (Express.js)
* **Database:** MongoDB
* **Authentication:** Google OAuth 2.0 (restricted to `cse.mrt.ac.lk` domain)
* **Email Service:** Nodemailer
* **File Storage:** Google Cloud Storage

## Repository Structure

This is a monorepo containing both the frontend and backend applications, along with project documentation.

/TA-Appointment-System
├── client/        # Vite React Frontend
├── server/        # Node.js Express Backend
└── docs/          # Project Documentation (Proposal, Feasibility Report, etc.)