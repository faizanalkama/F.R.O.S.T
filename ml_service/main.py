from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="F.R.O.S.T PGML Transport Predictor")

origins = [os.environ.get("FRONTEND_URL", "http://localhost:5173")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "xgboost_model.joblib"
model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    else:
        print("Warning: Model not found. Please run train_model.py first.")

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/predict-window")
def predict_window(
    U10: float = Query(..., description="10m Wind Speed in m/s"),
    pressure_drop: float = Query(..., description="Pressure drop over 3 hours in hPa"),
    temperature: float = Query(..., description="Temperature in Celsius"),
    humidity: float = Query(..., description="Relative Humidity in percentage"),
    timestamp: str = Query(..., description="Timestamp of reading"),
    station: str = Query(..., description="Station ID")
):
    inputs = {
        "U10": U10,
        "pressure_drop": pressure_drop,
        "temperature": temperature,
        "humidity": humidity,
        "timestamp": timestamp,
        "station": station
    }
    
    # Physics failsafe (hard rule, evaluated first)
    # If 10 m wind speed U10 >= 10 m/s and pressure drop <= -2 hPa over 3 hours
    if U10 >= 10.0 and pressure_drop <= -2.0:
        return {
            "safe": False,
            "probability": 1.0,
            "reason": "physics_failsafe",
            "inputs_used": inputs
        }
    
    # ML step
    if model is None:
        return {"error": "Model not loaded"}
        
    df = pd.DataFrame([{
        "temperature": temperature,
        "humidity": humidity,
        "U10": U10,
        "pressure_drop": pressure_drop
    }])
    
    # probability of whiteout (class 1)
    prob = float(model.predict_proba(df)[0][1])
    
    # configurable probability threshold for safety (e.g. 0.5)
    is_safe = prob < 0.5
    
    return {
        "safe": is_safe,
        "probability": prob,
        "reason": "ml_model",
        "inputs_used": inputs
    }
