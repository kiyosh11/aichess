import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const { fen, moves, difficulty } = await request.json();

    if (!fen || !Array.isArray(moves) || !difficulty) {
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let prompt = `
      You are a chess engine playing as Black, aiming to win. The current position is given in FEN: "${fen}". 
      List all legal moves: ${moves.join(", ")}.
      Analyze the position and suggest the best move in UCI format (e.g., "e2e4"). 
      Provide a brief explanation of why this move is strong.
      If multiple moves are equally good, choose one strategically to maximize winning chances.
    `;

    if (difficulty === "easy") {
      prompt += " Play at a beginner level, choosing a reasonable but not optimal move.";
    } else if (difficulty === "medium") {
      prompt += " Play at an intermediate level, choosing a strong but not necessarily the best move.";
    } else {
      prompt += " Play at an advanced level, choosing the strongest move possible.";
    }

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxTokens: 200,
    });

    const botMove = text.match(/[a-h][1-8][a-h][1-8]/)?.[0];
    if (!botMove) {
      return new Response(JSON.stringify({ error: "No valid move returned" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ move: botMove }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: "Failed to get bot move" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
