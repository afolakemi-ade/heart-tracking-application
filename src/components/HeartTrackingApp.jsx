import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import * as tf from "@tensorflow/tfjs";

const HeartTrackingApp = () => {
  const [heartRate, setHeartRate] = useState("");
  const [bloodPressureSys, setBloodPressureSys] = useState("");
  const [bloodPressureDia, setBloodPressureDia] = useState("");
  const [age, setAge] = useState("");
  const [cholesterol, setCholesterol] = useState("");
  const [readings, setReadings] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [riskLevel, setRiskLevel] = useState("normal");
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002' 
  : ''; // Will force demo mode in production
  const modelRef = useRef(null);

  // Fallback data for testing with more varied values for better curves
  const demoData = [
    { date: "2025-06-08", heartRate: 72, systolic: 120, diastolic: 80, cholesterol: 180 },
    { date: "2025-06-09", heartRate: 75, systolic: 122, diastolic: 82, cholesterol: 182 },
    { date: "2025-06-10", heartRate: 78, systolic: 125, diastolic: 79, cholesterol: 185 },
    { date: "2025-06-11", heartRate: 76, systolic: 123, diastolic: 81, cholesterol: 183 },
    { date: "2025-06-12", heartRate: 80, systolic: 128, diastolic: 84, cholesterol: 190 },
    { date: "2025-06-13", heartRate: 77, systolic: 124, diastolic: 80, cholesterol: 185 },
    { date: "2025-06-14", heartRate: 74, systolic: 121, diastolic: 79, cholesterol: 182 }
  ];

  const [historicalData, setHistoricalData] = useState(demoData);

  // Authentication functions
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Signup failed');
      
      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
      setAuthError('');
    } catch (error) {
      setAuthError(error.message);
    }
  };
const handleLogin = async (e) => {
  e.preventDefault();
  
  // Bypass API in production
  if (process.env.NODE_ENV === 'production') {
    const demoUser = {
      id: 'demo-user',
      email,
      password: 'demo' // Not secure - for demo only
    };
    localStorage.setItem('user', JSON.stringify(demoUser));
    setIsAuthenticated(true);
    setHistoricalData(demoData);
    return;
  }

  // Original login code...
};
  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    setReadings([]);
    setHistoricalData(demoData);
  };

  // Fetch user readings from API
  const fetchUserReadings = async (userId) => {
    try {
      setIsLoading(true);
      setApiError('');
      const response = await fetch(`${API_URL}/readings?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reading');
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      // If no data from API, use demo data
      const readingsData = data.length > 0 ? data : demoData.map(item => ({
        ...item,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(item.date).toISOString(),
        userId
      }));
      
      setReadings(readingsData);
      
      // Transform data for charts
      const chartData = readingsData.map(reading => ({
        date: reading.date || new Date(reading.timestamp).toISOString().split('T')[0],
        heartRate: reading.heartRate || 0,
        systolic: reading.systolic || 0,
        diastolic: reading.diastolic || 0,
        cholesterol: reading.cholesterol || 0
      }));
      
      setHistoricalData(chartData);
      
    } catch (error) {
      console.error("Error fetching readings:", error);
      setApiError(error.message);
      setHistoricalData(demoData);
      setReadings(demoData.map(item => ({
        ...item,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(item.date).toISOString(),
        userId: 'demo'
      })));
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setIsAuthenticated(true);
      fetchUserReadings(user.id);
    } else {
      setHistoricalData(demoData);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize and train a simple neural network
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        
        if (!isMounted) return;

        setIsTraining(true);
        
        if (modelRef.current) {
          modelRef.current.dispose();
        }

        const neuralModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [4], units: 16, activation: "relu" }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 8, activation: "relu" }),
            tf.layers.dense({ units: 3, activation: "softmax" }),
          ],
        });

        neuralModel.compile({
          optimizer: "adam",
          loss: "categoricalCrossentropy",
          metrics: ["accuracy"],
        });

        const trainingData = generateTrainingData();
        const xs = tf.tensor2d(trainingData.inputs);
        const ys = tf.tensor2d(trainingData.outputs);

        await neuralModel.fit(xs, ys, {
          epochs: 50,
          batchSize: 32,
          validationSplit: 0.2,
          shuffle: true,
        });

        tf.dispose([xs, ys]);

        if (isMounted) {
          modelRef.current = neuralModel;
          setModel(neuralModel);
          setIsModelReady(true);
          setIsTraining(false);
        }
      } catch (error) {
        console.error("Model initialization error:", error);
        if (isMounted) {
          setIsModelReady(false);
          setIsTraining(false);
          setTimeout(initialize, 2000);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (modelRef.current) {
        modelRef.current.dispose();
      }
    };
  }, []);

  const generateTrainingData = () => {
    const inputs = [];
    const outputs = [];

    for (let i = 0; i < 1000; i++) {
      const age = Math.random() * 60 + 20;
      const heartRate = Math.random() * 80 + 60;
      const systolic = Math.random() * 60 + 90;
      const cholesterol = Math.random() * 150 + 150;

      inputs.push([age, heartRate, systolic, cholesterol]);

      let riskScore = 0;
      if (age > 50) riskScore += 1;
      if (heartRate > 100) riskScore += 1;
      if (systolic > 130) riskScore += 1;
      if (cholesterol > 240) riskScore += 1;

      const output =
        riskScore <= 1 ? [1, 0, 0] : riskScore === 2 ? [0, 1, 0] : [0, 0, 1];
      outputs.push(output);
    }

    return { inputs, outputs };
  };

  const addReading = async () => {
    try {
      if (!heartRate || !bloodPressureSys || !bloodPressureDia || !age) {
        alert("Please fill in all required fields");
        return;
      }

      const user = JSON.parse(localStorage.getItem('user')) || { id: 'demo' };

      const newReading = {
        id: Math.random().toString(36).substring(7),
        heartRate: parseInt(heartRate),
        systolic: parseInt(bloodPressureSys),
        diastolic: parseInt(bloodPressureDia),
        age: parseInt(age),
        cholesterol: parseInt(cholesterol) || 200,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0],
        userId: user.id
      };

      setReadings(prev => [...prev, newReading]);
      setHistoricalData(prev => [
        ...prev,
        {
          date: newReading.date,
          heartRate: newReading.heartRate,
          systolic: newReading.systolic,
          diastolic: newReading.diastolic,
          cholesterol: newReading.cholesterol
        },
      ]);

      if (modelRef.current) {
        await makePrediction(newReading);
      }

      setHeartRate("");
      setBloodPressureSys("");
      setBloodPressureDia("");
      setCholesterol("");
    } catch (error) {
      console.error("Error adding reading:", error);
      alert("Failed to add reading. Please try again.");
    }
  };

  const makePrediction = async (reading) => {
    try {
      if (!modelRef.current) return;

      const inputTensor = tf.tensor2d([
        [reading.age, reading.heartRate, reading.systolic, reading.cholesterol],
      ]);

      const prediction = modelRef.current.predict(inputTensor);
      const predictionArray = await prediction.data();

      tf.dispose([inputTensor, prediction]);

      const riskLevels = ["Low Risk", "Medium Risk", "High Risk"];
      const maxIndex = predictionArray.indexOf(Math.max(...predictionArray));
      const confidence = (predictionArray[maxIndex] * 100).toFixed(1);

      setPrediction({
        risk: riskLevels[maxIndex],
        confidence: confidence,
        details: {
          low: (predictionArray[0] * 100).toFixed(1),
          medium: (predictionArray[1] * 100).toFixed(1),
          high: (predictionArray[2] * 100).toFixed(1),
        },
      });

      setRiskLevel(
        maxIndex === 0 ? "normal" : maxIndex === 1 ? "warning" : "danger"
      );
    } catch (error) {
      console.error("Prediction error:", error);
    }
  };

  const getHealthTips = () => {
    if (!prediction) return [];

    const tips = {
      "Low Risk": [
        "Maintain your current healthy lifestyle",
        "Continue regular exercise routine",
        "Keep monitoring your vitals regularly",
      ],
      "Medium Risk": [
        "Consider increasing physical activity",
        "Monitor your diet and reduce sodium intake",
        "Schedule regular check-ups with your doctor",
      ],
      "High Risk": [
        "Consult with a healthcare provider immediately",
        "Consider lifestyle modifications",
        "Monitor blood pressure and heart rate daily",
      ],
    };

    return tips[prediction.risk] || [];
  };

  // Styles object
  const styles = {
    app: {
      minHeight: "100vh",
      width: "98vw",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px 0",
      boxSizing: "border-box",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    },
    container: {
      width:"100%",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 20px",
      boxSizing: "border-box",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
      color: "white",
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "15px",
      marginBottom: "10px",
    },
    headerTitleH1: {
      fontSize: "3rem",
      fontWeight: "bold",
      margin: "0",
    },
    headerSubtitle: {
      fontSize: "1.2rem",
      opacity: "0.9",
      marginBottom: "20px",
    },
    trainingIndicator: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      background: "rgba(255, 255, 255, 0.2)",
      backdropFilter: "blur(10px)",
      padding: "10px 20px",
      borderRadius: "25px",
      animation: "pulse 2s infinite",
    },
    mainContent: {
      display: "flex",
      flexDirection: "column",
      gap: "30px",
    },
    card: {
      background: "white",
      borderRadius: "15px",
      padding: "25px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      marginBottom: "20px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#2c3e50",
    },
    formGroup: {
      marginBottom: "20px",
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "15px",
    },
    formColumn: {
      flex: "1 1 500px",
      maxWidth: "500px",
      width: "100%",
      boxSizing: "border-box",
    },
    chartsColumn: {
      flex: "1 1 500px",
      maxWidth: "500px",
      width: "100%",
      boxSizing: "border-box",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: "#555",
      fontSize: "0.9rem",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      border: "2px solid #e1e8ed", 
      borderRadius: "8px",
      fontSize: "1rem",
      background: "#fafafa",
      transition: "all 0.3s ease",
      boxSizing: "border-box",
      color: "black"
    },
    submitBtn: {
      width: "100%",
      padding: "15px",
      background: "linear-gradient(135deg, #3498db, #9b59b6)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    riskIndicator: {
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "20px",
      borderLeft: "5px solid",
    },
    riskIndicatorNormal: {
      background: "#d5f5d5",
      color: "#2d5a2d",
      borderLeftColor: "#27ae60",
    },
    riskIndicatorWarning: {
      background: "#fff3cd",
      color: "#856404",
      borderLeftColor: "#f39c12",
    },
    riskIndicatorDanger: {
      background: "#f8d7da",
      color: "#721c24",
      borderLeftColor: "#e74c3c",
    },
    riskHeader: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    riskText: {
      fontWeight: "bold",
      fontSize: "1.1rem",
    },
    confidence: {
      marginLeft: "auto",
      fontSize: "0.9rem",
      fontWeight: "500",
    },
    riskDetails: {
      marginBottom: "20px",
      color:"black"
    },
    riskItem: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #eee",
      fontSize: "0.9rem",
    },
    lowRisk: {
      color: "#27ae60",
      fontWeight: "600",
    },
    mediumRisk: {
      color: "#f39c12",
      fontWeight: "600",
    },
    highRisk: {
      color: "#e74c3c",
      fontWeight: "600",
    },
    recommendations: {
      borderTop: "2px solid #f0f0f0",
      paddingTop: "15px",
      color:"black"
    },
    recommendationsList: {
      listStyle: "none",
      padding: "0",
      margin: "10px 0 0 0",
    },
    recommendationsItem: {
      padding: "5px 0",
      paddingLeft: "20px",
      position: "relative",
      fontSize: "0.9rem",
      color: "#555",
    },
    chartsSection: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      flex: 1,
    },
    chartCard: {
      minHeight: "400px",
    },
    chartContainer: {
      marginTop: "20px",
    },
    tableContainer: {
      overflowX: "auto",
      marginTop: "15px",
    },
    readingsTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.9rem",
    },
    tableHeader: {
      background: "#f8f9fa",
      fontWeight: "600",
      color: "#555",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontSize: "0.8rem",
    },
    tableCell: {
      padding: "12px 15px",
      textAlign: "left",
      borderBottom: "1px solid #eee",
      color: "black"
    },
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div style={styles.app}>
        <div style={{ 
          ...styles.container, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh'
        }}>
          <div style={{ 
            ...styles.card, 
            width: '100%',
            maxWidth: '400px',
            padding: '30px'
          }}>
            <h2 style={{ 
              ...styles.sectionTitle, 
              justifyContent: 'center',
              marginBottom: '30px'
            }}>
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </h2>
            
            {authError && (
              <div style={{ 
                color: '#e74c3c',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {authError}
              </div>
            )}
            
            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              
              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  marginTop: '20px'
                }}
              >
                {authMode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>
            
            <div style={{ 
              textAlign: 'center',
              marginTop: '20px',
              color: '#555'
            }}>
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3498db',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3498db',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app content
  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <button 
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "8px 15px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Heart size={48} color="#e74c3c" />
            <h1 style={styles.headerTitleH1}>CardioFola</h1>
          </div>
          <p style={styles.headerSubtitle}>
            Enhanced Heart Tracking with ANN-Based Health Predictions
          </p>
          {isTraining && (
            <div style={styles.trainingIndicator}>
              <Brain size={20} color="#3498db" />
              <span>Training AI model...</span>
            </div>
          )}
        </div>

        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'white'
          }}>
            Loading your data...
          </div>
        )}
        
        {apiError && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.2)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {apiError}
          </div>
        )}

        <div style={{
          ...styles.mainContent,
          flexDirection: isMobile ? "column" : "row",
          gap: "30px",
        }}>
          <div style={styles.formColumn}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>
                <Activity size={24} color="#3498db" />
                Record Vitals
              </h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Heart Rate (BPM) *</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g., 72"
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Systolic BP *</label>
                  <input
                    type="number"
                    value={bloodPressureSys}
                    onChange={(e) => setBloodPressureSys(e.target.value)}
                    placeholder="120"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Diastolic BP *</label>
                  <input
                    type="number"
                    value={bloodPressureDia}
                    onChange={(e) => setBloodPressureDia(e.target.value)}
                    placeholder="80"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Age *</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 35"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Cholesterol (mg/dL)</label>
                <input
                  type="number"
                  value={cholesterol}
                  onChange={(e) => setCholesterol(e.target.value)}
                  placeholder="e.g., 200"
                  style={styles.input}
                />
              </div>

              <button
                onClick={addReading}
                disabled={isTraining}
                style={{
                  ...styles.submitBtn,
                  opacity: isTraining ? 0.6 : 1,
                  cursor: isTraining ? "not-allowed" : "pointer",
                }}
              >
                Add Reading & Analyze
              </button>
            </div>

            {prediction && (
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>
                  <Brain size={20} color="#9b59b6" />
                  AI Health Analysis
                </h3>

                <div
                  style={{
                    ...styles.riskIndicator,
                    ...(riskLevel === "normal"
                      ? styles.riskIndicatorNormal
                      : riskLevel === "warning"
                      ? styles.riskIndicatorWarning
                      : styles.riskIndicatorDanger),
                  }}
                >
                  <div style={styles.riskHeader}>
                    {riskLevel === "normal" && <CheckCircle size={20} />}
                    {riskLevel !== "normal" && <AlertTriangle size={20} />}
                    <span style={styles.riskText}>{prediction.risk}</span>
                    <span style={styles.confidence}>
                      Confidence: {prediction.confidence}%
                    </span>
                  </div>
                </div>

                <div style={styles.riskDetails}>
                  <div style={styles.riskItem}>
                    <span>Low Risk:</span>
                    <span style={styles.lowRisk}>{prediction.details.low}%</span>
                  </div>
                  <div style={styles.riskItem}>
                    <span>Medium Risk:</span>
                    <span style={styles.mediumRisk}>
                      {prediction.details.medium}%
                    </span>
                  </div>
                  <div style={styles.riskItem}>
                    <span>High Risk:</span>
                    <span style={styles.highRisk}>
                      {prediction.details.high}%
                    </span>
                  </div>
                </div>

                <div style={styles.recommendations}>
                  <h4>Recommendations:</h4>
                  <ul style={styles.recommendationsList}>
                    {getHealthTips().map((tip, index) => (
                      <li key={index} style={styles.recommendationsItem}>
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div style={{
            ...styles.chartsSection,
            width: isMobile ? "100%" : "100%",
            maxWidth: isMobile ? "100%" : "700px",
          }}>
            <div style={{ ...styles.card, ...styles.chartCard }}>
              <h3 style={styles.sectionTitle}>
                <TrendingUp size={20} color="#27ae60" />
                Heart Rate Trends
              </h3>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={historicalData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#555' }}
                      axisLine={{ stroke: '#ccc' }}
                    />
                    <YAxis 
                      tick={{ fill: '#555' }}
                      axisLine={{ stroke: '#ccc' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        color: '#333'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#3498db"
                      strokeWidth={2}
                      fill="#3498db"
                      fillOpacity={0.3}
                      name="Heart Rate (BPM)"
                      activeDot={{ r: 6, stroke: '#2980b9', strokeWidth: 2 }}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ ...styles.card, ...styles.chartCard }}>
              <h3 style={styles.sectionTitle}>
                <BarChart3 size={20} color="#e74c3c" />
                Blood Pressure History
              </h3>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={historicalData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#555' }}
                      axisLine={{ stroke: '#ccc' }}
                    />
                    <YAxis 
                      tick={{ fill: '#555' }}
                      axisLine={{ stroke: '#ccc' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        color: '#333'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      stroke="#e74c3c"
                      strokeWidth={2}
                      name="Systolic"
                      dot={{ r: 3, fill: '#e74c3c' }}
                      activeDot={{ r: 6, stroke: '#c0392b', strokeWidth: 2 }}
                      animationDuration={1000}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="#f39c12"
                      strokeWidth={2}
                      name="Diastolic"
                      dot={{ r: 3, fill: '#f39c12' }}
                      activeDot={{ r: 6, stroke: '#d35400', strokeWidth: 2 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {readings.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>
                  <Calendar size={20} color="#8e44ad" />
                  Recent Readings
                </h3>
                <div style={styles.tableContainer}>
                  <table style={styles.readingsTable}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                          Time
                        </th>
                        <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                          Heart Rate
                        </th>
                        <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                          Blood Pressure
                        </th>
                        <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                          Cholesterol
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {readings
                        .slice(-5)
                        .reverse()
                        .map((reading) => (
                          <tr key={reading.id}>
                            <td style={styles.tableCell}>
                              {new Date(reading.timestamp).toLocaleString()}
                            </td>
                            <td style={styles.tableCell}>
                              {reading.heartRate} BPM
                            </td>
                            <td style={styles.tableCell}>
                              {reading.systolic}/{reading.diastolic}
                            </td>
                            <td style={styles.tableCell}>
                              {reading.cholesterol} mg/dL
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div style={{
          width: "100%",
          textAlign: "center",
          marginTop: "40px",
          padding: "20px 10px",
          color: "white",
          opacity: 0.7,
          display: isMobile ? "block" : "flex",
          justifyContent: isMobile ? "initial" : "center",
          alignItems: isMobile ? "initial" : "center",
        }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} CardioFola — Built by Fola 💙</p>
        </div>
      </div>
    </div>
  );
};

export default HeartTrackingApp;