const router = require("express").Router();
const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const authorize = require("../middleware/authorize");
const { body, validationResult } = require("express-validator");

const validateGameInput = [
  body("gameId")
    .isString()
    .notEmpty()
    .withMessage("Game ID is required and must be a string"),
  body("gameScore")
    .isNumeric()
    .withMessage("Game score is required and must be a number"),
];

router.post("/", authorize, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { gameId, gameScore } = req.body;

  try {
    const existingEntry = await knex("games")
      .where({ user_id: req.userId, game_id: gameId })
      .first();

    if (existingEntry) {
      return res.status(409).json({ message: "Entry already exists" });
    }

    await knex("games").insert({
      id: uuidv4(),
      user_id: req.userId,
      game_id: gameId,
      score: gameScore,
    });

    res.status(201).json({ message: "Game stats saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/stats", authorize, validateGameInput, async (req, res) => {
  try {
    const games = await knex("games").select("score").where({
      user_id: req.userId,
    });

    if (games.length === 0) {
      return res.status(200).json({ wins: 0, avgScore: 0 });
    }

    const totalScore = games.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = totalScore / games.length;

    res.status(200).json({ wins: games.length, avgScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
