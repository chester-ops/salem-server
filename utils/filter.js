module.exports =
  (...fields) =>
  (req, res, next) => {
    // New request body
    const newBody = {};
    // Filter fields from request
    Object.keys(req.body).forEach((el) => {
      if (fields.includes(el)) newBody[el] = req.body[el];
    });
    req.body = newBody;
    next();
  };
