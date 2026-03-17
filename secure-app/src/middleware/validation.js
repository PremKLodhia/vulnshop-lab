const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required()
});

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string().min(8).max(128).required()
});

const profileSchema = Joi.object({
  bio: Joi.string().max(500).allow('').required()
});

const supportSchema = Joi.object({
  name: Joi.string().max(80).required(),
  email: Joi.string().email().max(120).required(),
  subject: Joi.string().max(120).required(),
  message: Joi.string().max(2000).required()
});

module.exports = {
  loginSchema,
  registerSchema,
  profileSchema,
  supportSchema
};
