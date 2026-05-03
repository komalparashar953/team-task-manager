import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => async (req, res, next) => {
    try {
        const parsedBody = await schema.parseAsync(req.body);
        req.body = parsedBody;
        next();
    } catch (err) {
        next(new ApiError(400, 'Validation failed', err.errors));
    }
};
