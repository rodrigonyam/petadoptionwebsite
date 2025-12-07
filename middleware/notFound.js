const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        suggestion: 'Please check the API documentation for available endpoints'
    });
};

module.exports = { notFound };