class Response {
    constructor(statusCode, data, message = {}, success) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = success;
    }
}

module.exports = Response;