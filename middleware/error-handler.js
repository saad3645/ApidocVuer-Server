'use strict';

const winston = require('winston');
const Logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: 'server.log'})
  ]
})

module.exports = (options = {}) => {
  return async function handleError(ctx, next) {
    try {
      await next();
    }
    catch (error) {
      const log = (!error.status || error.status === 500 ||
        (typeof error.log === 'boolean' && error.log) ||
        (typeof error.log === 'string' && typeof options.env === 'string' && error.log === options.env) || options.logAll);

      if (log) {
        Logger.error(error.message);
      }

      ctx.status = error.statusCode || error.status || 500;

      if (error.headers) {
        ctx.set(error.headers);
      }

      const expose = (typeof error.expose === 'boolean' && error.expose) ||
        (typeof error.expose === 'string' && typeof options.env === 'string' && error.expose === options.env) ||
        (Array.isArray(error.expose) && typeof options.env === 'string' && error.expose.indexOf(options.env) !== -1) ||
        (typeof options.expose === 'boolean' && options.expose) ||
        (typeof options.expose === 'string' && typeof options.env === 'string' && options.expose === options.env) ||
        (Array.isArray(options.expose) && typeof options.env === 'string' && options.expose.indexOf(options.env) !== -1);

      if (expose) {
        if (error.errors && Array.isArray(error.errors)) {
          ctx.body = {errors: error.errors};
        }
        else if (error.items && Array.isArray(error.items)) {
          ctx.body = {errors: error.items};
        }
        else {
          const errorBody = Object.assign({}, error);
          if (typeof errorBody.status !== 'undefined') {
            delete errorBody.status;
          }
          if (typeof errorBody.statusCode !== 'undefined') {
            delete errorBody.statusCode;
          }
          if (typeof errorBody.name !== 'undefined') {
            delete errorBody.name;
          }
          if (typeof errorBody.headers !== 'undefined') {
            delete errorBody.headers;
          }
          if (typeof errorBody.log !== 'undefined') {
            delete errorBody.log;
          }
          if (typeof errorBody.expose !== 'undefined') {
            delete errorBody.expose;
          }

          if (!errorBody.code) {
            errorBody.code = error.code || 'ERROR';
          }
          if (!errorBody.message) {
            errorBody.message = error.message || 'An error has occurred';
          }

          ctx.body = {errors: [errorBody]};
        }
      }
    }
  };
};
