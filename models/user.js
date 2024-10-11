const { v4: uuidv4 } = require("uuid");
const knex = require("knex")(require("../knexfile"));

const getProviderId = async (providerName) => {
    const provider = await knex("authentication_providers")
      .select("id")
      .where({ provider_name: providerName })
      .first();
    if (!provider) {
      throw new Error("Authentication provider not found");
    }
    return provider.id;
  };
  
  const findOrCreateUser = async (providerId, providerUserId, userEmail) => {
    const user = await knex("users")
      .where({ provider_user_id: providerUserId, provider_id: providerId })
      .first();
  
    if (!user) {
      const userId = uuidv4();
      await knex("users").insert({
        id: userId,
        provider_id: providerId,
        provider_user_id: providerUserId,
        email: userEmail,
        refresh_token_version: 1,
      });
      return { userId, refreshTokenVersion: 1 };
    } else {
      return { userId: user.id, refreshTokenVersion: user.refresh_token_version };
    }
  };

  module.exports = { getProviderId, findOrCreateUser}