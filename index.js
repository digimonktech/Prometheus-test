const express = require("express");
const promClient = require("prom-client");

const app = express();

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default metric to the registry
promClient.collectDefaultMetrics({ register });

// Define a custom metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: "http_request_duration_microseconds",
  help: "Duration of HTTP requests in microseconds",
  labelNames: ["method", "route", "code"],
});

// Register the custom metric
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request duration
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : "unknown",
      code: res.statusCode,
    });
  });
  next();
});

// Endpoint to expose metrics
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Your application routes
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
