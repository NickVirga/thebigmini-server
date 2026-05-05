const router = require("express").Router();
const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const authorize = require("../middleware/authorize");
const { body, validationResult } = require("express-validator");
const { gamesLimiter } = require("../middleware/rate-limiters");

const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

const validateGameInput = [
  body("gameDate")
    .notEmpty()
    .withMessage("Game date is required and must be a string"),
  body("gameScore")
    .notEmpty()
    .withMessage("Game score is required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Game score must be a number between 0 and 100"),
];

router.post("/", authorize, gamesLimiter, validateGameInput, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { gameDate, gameScore } = req.body;

  if (gameDate !== today) {
    return res.status(401).json({ message: "Game date is invalid" });
  }

  const userId = req.userId;

  try {
    const existingEntry = await knex("games")
      .where({ user_id: userId, game_date: gameDate })
      .first();

    if (existingEntry) {
      return res.status(409).json({ message: "Entry already exists" });
    }

    const data = await knex.transaction(async (trx) => {
      await trx("games").insert({
        id: uuidv4(),
        user_id: userId,
        game_date: gameDate,
        score: gameScore,
      });

      await trx("users").where({ id: userId }).increment({
        score_accum: gameScore,
        num_games_completed: 1,
      });

      return await trx("users").where({ id: userId }).first();
    });

    res.status(201).json({
      message: "Game stats saved successfully",
      wins: data.num_games_completed,
      scoreAccum: data.score_accum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/stats", authorize, gamesLimiter, async (req, res) => {
  try {
    const gameStats = await knex("users")
      .select(["score_accum", "num_games_completed"])
      .where({ id: req.userId })
      .first();

    if (!gameStats) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      wins: gameStats.num_games_completed,
      scoreAccum: gameStats.score_accum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
