
import express from "express";

const app = express();

app.use(express.json({ limit: "10kb" }));

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL;

app.get("/", (_req, res) => {
  res.json({ name: "Aether API", status: "online" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  if (!apiKey || !model) {
    return res.status(503).json({
      error: "Aether's server configuration is incomplete."
    });
  }

  const message = req.body?.message;

  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 4000
  ) {
    return res.status(400).json({
      error: "Enter a message under 4,000 characters."
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are Aether, a helpful AI assistant. Be accurate and honest."
            },
            {
              role: "user",
              content: message.trim()
            }
          ]
        }),
        signal: AbortSignal.timeout(45000)
      }
    );

    if (!response.ok) {
      console.error("AI provider returned HTTP", response.status);
      return res.status(502).json({
        error: "The AI provider could not complete the request."
      });
    }

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || ""
    });
  } catch (error) {
    console.error("Aether request failed:", error.message);

    res.status(502).json({
      error: "Aether could not reach its AI provider."
    });
  }
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("Aether API started.");
});
