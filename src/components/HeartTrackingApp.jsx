import React, { useState, useEffect } from "react";
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

  // Sample historical data for visualization
  const [historicalData] = useState([
    { date: "2025-06-08", heartRate: 72, systolic: 120, diastolic: 80 },
    { date: "2025-06-09", heartRate: 75, systolic: 118, diastolic: 78 },
    { date: "2025-06-10", heartRate: 68, systolic: 122, diastolic: 82 },
    { date: "2025-06-11", heartRate: 70, systolic: 125, diastolic: 85 },
    { date: "2025-06-12", heartRate: 73, systolic: 119, diastolic: 79 },
    { date: "2025-06-13", heartRate: 76, systolic: 121, diastolic: 81 },
    { date: "2025-06-14", heartRate: 71, systolic: 123, diastolic: 83 },
  ]);

  // Initialize and train a simple neural network
  useEffect(() => {
    initializeModel();
  }, []);

  const initializeModel = async () => {
    setIsTraining(true);

    // Create a simple neural network for heart health prediction
    const neuralModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 16, activation: "relu" }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 8, activation: "relu" }),
        tf.layers.dense({ units: 3, activation: "softmax" }), // 3 risk levels: low, medium, high
      ],
    });

    neuralModel.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    // Generate synthetic training data
    const trainingData = generateTrainingData();
    const xs = tf.tensor2d(trainingData.inputs);
    const ys = tf.tensor2d(trainingData.outputs);

    // Train the model
    await neuralModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
    });

    setModel(neuralModel);
    setIsTraining(false);
  };

  const generateTrainingData = () => {
    const inputs = [];
    const outputs = [];

    // Generate synthetic data for training
    for (let i = 0; i < 1000; i++) {
      const age = Math.random() * 60 + 20; // 20-80 years
      const heartRate = Math.random() * 80 + 60; // 60-140 bpm
      const systolic = Math.random() * 60 + 90; // 90-150 mmHg
      const cholesterol = Math.random() * 150 + 150; // 150-300 mg/dL

      inputs.push([age, heartRate, systolic, cholesterol]);

      // Simple risk calculation for training
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
    if (!heartRate || !bloodPressureSys || !bloodPressureDia || !age) {
      alert("Please fill in all required fields");
      return;
    }

    const newReading = {
      id: Date.now(),
      heartRate: parseInt(heartRate),
      systolic: parseInt(bloodPressureSys),
      diastolic: parseInt(bloodPressureDia),
      age: parseInt(age),
      cholesterol: parseInt(cholesterol) || 200,
      timestamp: new Date().toLocaleString(),
      date: new Date().toISOString().split("T")[0],
    };

    setReadings([...readings, newReading]);

    // Make prediction using the neural network
    if (model) {
      await makePrediction(newReading);
    }

    // Clear form
    setHeartRate("");
    setBloodPressureSys("");
    setBloodPressureDia("");
    setCholesterol("");
  };

  const makePrediction = async (reading) => {
    if (!model) return;

    const inputData = tf.tensor2d([
      [reading.age, reading.heartRate, reading.systolic, reading.cholesterol],
    ]);

    const predictionResult = model.predict(inputData);
    const predictionArray = await predictionResult.data();

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

  // Inline styles
  const styles = {
    app: {
      minHeight: "100vh",
      width: "210vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px 0",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 20px",
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
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
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

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Heart size={48} color="#e74c3c" />
            <h1 style={styles.headerTitleH1}>CardioFola</h1>
          </div>
          <p style={styles.headerSubtitle}>
            Enhanced Heart Tracking with AI-Powered Health Predictions
          </p>
          {isTraining && (
            <div style={styles.trainingIndicator}>
              <Brain size={20} color="#3498db" />
              <span>Training AI model...</span>
            </div>
          )}
        </div>

        <div style={styles.mainContent}>
          {/* Input Form */}
          <div>
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

            {/* AI Prediction Results */}
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
                    <span style={styles.lowRisk}>
                      {prediction.details.low}%
                    </span>
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

          {/* Charts and Analytics */}
          <div style={styles.chartsSection}>
            {/* Historical Trends */}
            <div style={{ ...styles.card, ...styles.chartCard }}>
              <h3 style={styles.sectionTitle}>
                <TrendingUp size={20} color="#27ae60" />
                Heart Rate Trends
              </h3>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#3498db"
                      fill="#3498db"
                      fillOpacity={0.3}
                      name="Heart Rate (BPM)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Blood Pressure Chart */}
            <div style={{ ...styles.card, ...styles.chartCard }}>
              <h3 style={styles.sectionTitle}>
                <BarChart3 size={20} color="#e74c3c" />
                Blood Pressure History
              </h3>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      stroke="#e74c3c"
                      strokeWidth={2}
                      name="Systolic"
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="#f39c12"
                      strokeWidth={2}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Readings */}
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
                        <th
                          style={{ ...styles.tableCell, ...styles.tableHeader }}
                        >
                          Time
                        </th>
                        <th
                          style={{ ...styles.tableCell, ...styles.tableHeader }}
                        >
                          Heart Rate
                        </th>
                        <th
                          style={{ ...styles.tableCell, ...styles.tableHeader }}
                        >
                          Blood Pressure
                        </th>
                        <th
                          style={{ ...styles.tableCell, ...styles.tableHeader }}
                        >
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
                              {reading.timestamp}
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
            <div style={{ textAlign: "center", marginTop: "40px", color: "white", opacity: 0.7, marginRight:"300px"}}>
  <p>© {new Date().getFullYear()} CardioFola — Built by Fola 💙</p>
</div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartTrackingApp;
