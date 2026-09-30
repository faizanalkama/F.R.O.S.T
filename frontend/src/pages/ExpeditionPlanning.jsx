import { backendApi, mlApi } from '../api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CloudSnow, Wind, Droplet, ArrowRight, CheckCircle2, XCircle, Users, IndianRupee, MapPin } from 'lucide-react';

export default function ExpeditionPlanning() {
 const [expedition, setExpedition] = useState(null);
 const [roster, setRoster] = useState([]);
 const [forecast, setForecast] = useState(null);
 const [loading, setLoading] = useState(false);
 const [inputs, setInputs] = useState({
  U10: 5.0,
  pressure_drop: -0.5,
  temperature: -15.0,
  humidity: 60.0
 });

 const [awsMode, setAwsMode] = useState(true);

 useEffect(() => {
  const fetchData = async () => {
   try {
    const [expRes, rosterRes] = await Promise.all([
     backendApi.get('/api/v1/expeditions'),
     backendApi.get('/api/v1/roster')
    ]);
    if (expRes.data.length > 0) setExpedition(expRes.data[0]);
    setRoster(rosterRes.data);
   } catch (e) {
    console.error('Failed to fetch data', e);
   }
  };
  fetchData();
 }, []);

 useEffect(() => {
  let interval;
  if (awsMode) {
   const fetchAWSAndPredict = async () => {
    try {
     const res = await backendApi.get('/api/v1/aws/current');
     const newData = {
      U10: res.data.U10,
      pressure_drop: res.data.pressure_drop,
      temperature: res.data.temperature,
      humidity: res.data.humidity
     };
     setInputs(newData);
     
     // Automatically run the prediction with the fresh data
     const predRes = await axios.get('http://localhost:5000/api/v1/ml/predict-window', {
      params: {
       ...newData,
       timestamp: new Date().toISOString(),
       station: 'Maitri'
      }
     });
     setForecast(predRes.data);
    } catch (e) { console.error('AWS Fetch/Predict Error', e); }
   };
   fetchAWSAndPredict();
   interval = setInterval(fetchAWSAndPredict, 5000); // refresh and predict every 5s
  }
  return () => clearInterval(interval);
 }, [awsMode]);

 const checkTransportWindow = async () => {
  setLoading(true);
  try {
   const res = await axios.get('http://localhost:5000/api/v1/ml/predict-window', {
    params: {
     ...inputs,
     timestamp: new Date().toISOString(),
     station: 'Maitri'
    }
   });
   setForecast(res.data);
  } catch(e) {
   console.error(e);
   setForecast({ error: 'Failed to reach prediction service' });
  }
  setLoading(false);
 };

 const calculateTotalBudget = (budgetArr) => {
  return budgetArr.reduce((sum, item) => sum + item.amount, 0);
 };

 const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
 };

 return (
  <div className="page-container overflow-x-hidden">
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
    <div>
     <h1><Calendar style={{display:'inline', marginRight:12, verticalAlign:'bottom'}} /> Expedition Planning</h1>
     {expedition && <h2 style={{ color: '#3B82F6', margin: '8px 0 0 0' }}>{expedition.name} ({expedition.season})</h2>}
    </div>
    {expedition && (
     <div style={{ textAlign: 'right' }}>
      <span className={`badge ${expedition.status === 'Planning' ? 'warning' : 'safe'}`}>{expedition.status}</span>
     </div>
    )}
   </div>
   
   <div className="grid-2">
    <div className="glass-panel">
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h2>PGML Transport Predictor</h2>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
       <input 
        type="checkbox" 
        checked={awsMode} 
        onChange={(e) => setAwsMode(e.target.checked)} 
       /> 
       Live AWS Feed
      </label>
     </div>
     <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
      Physics-Guided ML model to predict safe transport windows avoiding Severe Blowing Snow (BLSN).
      {awsMode && <span style={{ display: 'block', color: '#3B82F6', marginTop: '4px' }}>✓ Streaming live from Maitri-AWS-01</span>}
     </p>
     
     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', opacity: awsMode ? 0.7 : 1 }}>
      <div>
       <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}><Wind size={14}/> Wind Speed (m/s)</label>
       <input type="number" step="0.1" value={inputs.U10} onChange={e => setInputs({...inputs, U10: parseFloat(e.target.value)})} disabled={awsMode} />
      </div>
      <div>
       <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Pressure Drop (hPa)</label>
       <input type="number" step="0.1" value={inputs.pressure_drop} onChange={e => setInputs({...inputs, pressure_drop: parseFloat(e.target.value)})} disabled={awsMode} />
      </div>
      <div>
       <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Temperature (°C)</label>
       <input type="number" step="0.1" value={inputs.temperature} onChange={e => setInputs({...inputs, temperature: parseFloat(e.target.value)})} disabled={awsMode} />
      </div>
      <div>
       <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}><Droplet size={14}/> Humidity (%)</label>
       <input type="number" step="1" value={inputs.humidity} onChange={e => setInputs({...inputs, humidity: parseFloat(e.target.value)})} disabled={awsMode} />
      </div>
     </div>
     
     <button className="btn transition-all duration-300 ease-out hover:-translate-y-0.5 shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10 w-full md:w-auto" onClick={checkTransportWindow} disabled={loading || awsMode}>
      {awsMode ? (
       <>Auto-Predicting via AWS...</>
      ) : (
       <>{loading ? 'Analyzing...' : 'Predict 72h Window'} <ArrowRight size={18} /></>
      )}
     </button>
    </div>

    {forecast ? (
     <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      {forecast.error ? (
       <div style={{ color: 'var(--danger)' }}>{forecast.error}</div>
      ) : (
       <>
        {forecast.safe ? (
         <CheckCircle2 size={80} color="var(--success)" style={{ marginBottom: '16px' }} />
        ) : (
         <XCircle size={80} color="var(--danger)" style={{ marginBottom: '16px' }} />
        )}
        
        <h2 style={{ color: forecast.safe ? 'var(--success)' : 'var(--danger)', fontSize: '2rem', margin: 0 }}>
         {forecast.safe ? 'GO' : 'NO-GO'}
        </h2>
        <div style={{ fontSize: '1.2rem', margin: '8px 0' }}>
         Whiteout Probability: <strong>{(forecast.probability * 100).toFixed(1)}%</strong>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
         Decision source: <strong>{forecast.reason === 'physics_failsafe' ? 'Physics Hard Failsafe' : 'XGBoost ML Model'}</strong>
        </div>
       </>
      )}
     </div>
    ) : (
     <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
      Enter metrics and predict transport window
     </div>
    )}
   </div>
   
   {/* Roster & Budget */}
   <div className="grid-2" style={{ marginTop: '24px' }}>
    <div className="glass-panel">
     <h2><Users size={20} style={{display:'inline', marginRight:8}}/> Assigned Roster</h2>
     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
      {roster.length === 0 ? (
       <p style={{ color: 'var(--text-muted)' }}>Loading roster...</p>
      ) : (
       roster.map(person => (
        <div key={person.personnel_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
         <div>
          <div style={{ fontWeight: 600 }}>{person.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{person.role} • <MapPin size={12} style={{display:'inline'}}/> {person.station}</div>
         </div>
         <span className={`badge ${person.team === 'Summer' ? 'warning' : 'safe'}`}>{person.team}</span>
        </div>
       ))
      )}
     </div>
    </div>

    <div className="glass-panel">
     <h2><IndianRupee size={20} style={{display:'inline', marginRight:8}}/> Budget Allocation</h2>
     {expedition ? (
      <>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {expedition.budget.map(item => (
         <div key={item.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>{item.category}</span>
          <strong>{formatCurrency(item.amount)}</strong>
         </div>
        ))}
       </div>
       <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#3B82F6' }}>
        <span>Total Budget</span>
        <strong>{formatCurrency(calculateTotalBudget(expedition.budget))}</strong>
       </div>
      </>
     ) : (
       <p style={{ color: 'var(--text-muted)' }}>Loading budget...</p>
     )}
    </div>
   </div>

   <div className="glass-panel" style={{ marginTop: '24px' }}>
    <h2>Expedition Milestones (Gantt)</h2>
    {expedition ? (
     <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
      {expedition.milestones.map((m, i) => (
       <div key={m.id} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.85rem' }}>
         <span>{m.name}</span>
         <span>{new Date(m.date).toLocaleDateString()}</span>
        </div>
        <div style={{ height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
         <div style={{ 
          width: `${m.progress}%`, 
          height: '100%', 
          background: m.status === 'done' ? 'var(--success)' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-primary))' 
         }}></div>
        </div>
       </div>
      ))}
     </div>
    ) : (
     <p style={{ color: 'var(--text-muted)' }}>Loading timeline...</p>
    )}
   </div>
  </div>
 );
}
