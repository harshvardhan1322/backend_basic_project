class ApiResponse {
    constructor(
        statusCode,
        data,
        message = "Success")
        {
            this.statusCode = statusCode
            this.data = data
            this.message = message // correct spelling so the response JSON has a "message" field
            this.success = statusCode < 400
        }
}

export {ApiResponse}