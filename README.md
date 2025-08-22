# Smart Traffic Monitoring System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/BenjiBenji20/smart_traffic_monitoring_system/actions)
[![Contributors](https://img.shields.io/github/contributors/BenjiBenji20/smart_traffic_monitoring_system)](https://github.com/BenjiBenji20/smart_traffic_monitoring_system/graphs/contributors)
[![Stars](https://img.shields.io/github/stars/BenjiBenji20/smart_traffic_monitoring_system)](https://github.com/BenjiBenji20/smart_traffic_monitoring_system/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/BenjiBenji20/smart_traffic_monitoring_system/blob/main/LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-orange?logo=pytorch)](https://pytorch.org/)
[![YOLO](https://img.shields.io/badge/YOLO-v11-red)](https://ultralytics.com/yolo)
[![Firebase](https://img.shields.io/badge/Firebase-yellow?logo=firebase)](https://firebase.google.com/)

<p align="center">
   <img width="1895" height="874" alt="Image" src="https://github.com/user-attachments/assets/62a42921-423d-418b-8d8f-25f10d7e979a" width="600"/>
</p>

This IoT-based smart traffic monitoring system uses real-time video feeds from Raspberry Pi devices to detect, classify, and count vehicles along Barangay Longos C-4 Road in Malabon City. It integrates AI for traffic prediction and data analytics to provide actionable insights for local government decision-making on urban congestion. The system enhances traffic management through data visualization, predictive modeling, and AI-generated recommendations.

## Table of Contents

- [Project Technologies](#project-technologies)
- [Features](#features)
- [Real World Application and Solutions](#real-world-application-and-solutions)
- [Demo](#demo)
- [Installation / Setup Instructions](#installation--setup-instructions)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contact / Support](#contact--support)

## Project Technologies

- **IoT Device**: Raspberry Pi Zero 2 W with CSI Camera Module for capturing and sending real-time video streams to the server.
- **Python**: Used for AI processing, data handling, and scripting.
- **FastAPI**: Provides RESTful API services for backend operations.
- **Databases**: MySQL for structured data storage and Firebase for real-time data logging.
- **JavaScript**: Handles client-side interactions in the web app.
- **AI/ML Libraries**: Ultralytics YOLOv11 for vehicle detection, PyTorch for model training/inference, Prophet for time-series forecasting of traffic patterns.
- **LLM Integration**: Mistral LLM for generating dynamic, proactive AI recommendations based on traffic data.

## Features

- **Vehicle Detection and Classification**: Identifies vehicles such as cars, trucks, buses, bicycles, motorbikes, and jeepneys in real-time using YOLOv11.
- **Viewable Livestream**: Provides live video streaming of traffic with overlaid vehicle detections.
- **Real-time Vehicle Counting and Data Logging**: Counts vehicles and logs data instantly to Firebase Realtime Database.
- **Traffic Prediction**: Uses Prophet model for time-series forecasting based on historical traffic patterns to predict future congestion.
- **Data Visualization and Analysis**: Displays charts (line and bar) using Chart.js for traffic trends and performs in-depth data analysis.
- **AI-Driven Recommendations**: Generates data-driven suggestions for road management using Mistral LLM, focusing on real-time insights for improved decision-making by local government units (LGUs).
- **Downloadable Reports**: Allows exporting traffic data and analysis reports as files.
- **Traffic History Viewing**: Access and review historical traffic data logs.
- **Data Caching Mechanism**: Implements caching to reduce frequent API requests and improve performance.
- **Admin Dashboard**: Secure login for admins to view live dashboards, manage data, and apply predictive models.
- **Public Mobile Access**: Mobile-friendly interface for public users to view traffic updates.

## Real World Application and Solutions
<p>
This project introduces an IoT-based Smart Traffic Monitoring System integrated with AI and data analytics to address urban congestion in Malabon City. Deployed along Barangay Longos C-4 Road, the system uses Raspberry Pi devices for real-time vehicle detection, classification (e.g., cars, trucks, buses, bicycles, motorbikes, jeepneys), and counting. It analyzes traffic data to identify trends, predict future patterns using predictive AI models like Prophet, and generates actionable recommendations via Mistral LLM for road management. Aligned with the MMDA's Comprehensive Traffic Management Plan (CTMP), it provides valuable insights to enhance local government unit (LGU) decision-making, improve traffic flow, and serve as a model for other congested areas in Metro Manila and beyond.
</p>

## Demo

Watch a short demo video showcasing the system's real-time vehicle detection, traffic prediction, and dashboard features.

<p align="center">
  <a href="https://drive.google.com/file/d/1c1HGO3NO9VcyNZVn6VlSdxPSWw8FYq2u/view?usp=sharing" target="_blank">
    <img width="1919" height="871" alt="Image" src="https://github.com/user-attachments/assets/87d01b5d-bb87-4a04-9064-4888789bdecb" width="600"/>
  </a>
</p>

## Installation / Setup Instructions

This guide assumes you have basic knowledge of command-line tools. We'll set up the project step by step.

### Prerequisites

- Python 3.8 or higher
- FastAPI
- MySQL 
- JavaScripts
- Firebase account (for real-time database and admin SDK)
- Git installed

### Step-by-Step Guide

1. **Clone the Repository**:
   ```
   git clone https://github.com/BenjiBenji20/smart_traffic_monitoring_system.git
   cd smart_traffic_monitoring_system
   ```

2. **Create and Activate Python Virtual Environment**:
   ```
   python -m venv .env
   source .env/bin/activate  # On Windows: .env\Scripts\activate
   ```

3. **Install Dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Prepare Environment Variables**:
   - You can follow the variable naming in the `src/app/core/settings.py` and create a `.env` file in the root directory.
   - Fill in details like MySQL credentials, Firebase project ID, API keys, etc.

5. **Set Up Firebase Admin SDK**:
   - Download your Firebase service account key JSON from the Firebase console.
   - Place it in `configs/firebase_admin_sdk.json`.

6. **Database Setup**:
   - Start MySQL and create a database (e.g., `traffic_db`).
   - Run any migration scripts if needed (e.g., using Alembic: `alembic upgrade head`).

## Usage

1. **Start the Server**:
   ```
   uvicorn src.app.main:app --reload --port 8000
   ```
   - The server runs on port 8000 by default. If you change it, update the client-side code (e.g., in JavaScript files) to match the new port.

2. **Access the Web App**:
   - Open a browser and go to `use your browser domain` for the admin dashboard.
   - For public mobile access, use a mobile device or responsive view.

3. **IoT Device Setup**:
   - Follow the guide to setup the Raspberry Pi Zero 2 W + CSI Camera Module:
   <a href="https://github.com/BenjiBenji20/RPi-Zero-2-W-MJPEG-Streaming.git" target="_blank">Configure RPi Zero 2 W</a>

## Project Structure

```
smart_traffic_monitoring_system/
├── cache/                  # Cached JSON files for data optimization
├── configs/                # Configuration files
│   ├── db_connection.py    # Database connection utilities
│   └── firebase_admin_sdk.json  # Firebase service account key
├── script/                 # Utility scripts
│   ├── aggregate_vehicle_data.py  # Script for data aggregation
│   └── import_sql_dataset.py      # Script for importing datasets to SQL
├── src/                    # Source code
│   ├── app/                # Main application
│   │   ├── client/         # Client-side files
│   │   │   ├── static/     # Static assets
│   │   │   │   ├── javascripts/  # JS files
│   │   │   │   ├── stylesheets/  # CSS files
│   │   │   │   └── images/      # Images
│   │   │   └── templates/  # HTML templates
│   │   │       └── *.html  # HTML files
│   │   ├── core/           # Core utilities
│   │   │   ├── address.py  # Address handling
│   │   │   ├── cors_configs.py  # CORS settings
│   │   │   └── settings.py # App settings
│   │   ├── db/             # Database modules
│   │   │   ├── base.py     # Base models
│   │   │   └── db_session.py  # Session management
│   │   ├── exceptions/     # Custom exceptions
│   │   ├── middleware/     # Middleware components
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── schemas/        # Data schemas (e.g., Pydantic)
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   └── main.py         # Entry point for FastAPI app
│   └── traffic_ai/         # AI-related modules
│       ├── traffic_forecast/  # Forecasting components
│       │   ├── forecast_manager.py
│       │   ├── prophet_modeling.py
│       │   └── traffic_prediction_json_bldr.py
│       ├── traffic_recommendation/  # Recommendation AI
│       │   ├── traffic_data_summarizer.py
│       │   ├── traffic_prompt_ai.py
│       │   └── traffic_recommendation_ai.py
│       └── vehicle_detection/  # Vehicle detection
│           ├── image-weights/  # Model weights
│           │   └── yolo-weights/  # YOLO weights
│           ├── shared/         # Shared utilities
│           └── ClassNames.py   # Class definitions
│           └── sort.py         # Sorting algorithms
│           └── vehicle_counter.py  # Vehicle counting logic
├── .env                    # Environment variables (gitignore this)
├── .gitignore              # Git ignore file
├── requirements.txt        # Python dependencies
└── alembic.ini             # Alembic migration config
```

## Documentation

This project is part of a capstone research titled "IoT-Based Smart Traffic Monitoring System with Data Analytics Along Barangay Longos C-4 Road for Enhanced Malabon LGU Decision-Making". It was developed by lead researcher and main web app developer Benji I. Cañones, along with co-researchers: Aero Louise C. Arnaldo, Kate Lavayne Marcos, Vanessa Joyce M. Monterde, and Wendy L. Pesimo. The project was completed at the City of Malabon University as partial fulfillment for the Bachelor of Science in Information Technology degree.

For full details, refer to the [capstone documentation PDF](./Group%206_%20IoT-Based%20Smart%20Traffic%20Monitoring%20System%20with%20Data%20Analytics%20Along%20Barangay%20Longos%20C-4%20Road%20for%20Enhanced%20Malabon%20LGU%20Decision-Making.pdf).

## Contact / Support

- **Email**: benjicanones6@gmail.com
- **LinkedIn**: [https://www.linkedin.com/in/benji-cañones](https://www.linkedin.com/in/benji-cañones)
- **GitHub**: [https://github.com/BenjiBenji20](https://github.com/BenjiBenji20)

Feel free to open an issue on GitHub for bugs or feature requests!
```
