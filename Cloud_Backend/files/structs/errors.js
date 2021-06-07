module.exports = {
    create(code, numericCode, message, service, intent, vars) {
        return {
            errorCode: code,
            errorMessage: message,
            messageVars: vars || undefined,
            numericErrorCode: numericCode,
            originatingService: service,
            intent: intent || "prod"
        }
    },

    method(service, intent) {
        return this.create(
            "errors.com.epicgames.common.method_not_allowed", 1009,
            "Sorry the resource you were trying to access cannot be accessed with the HTTP method you used.",
            service, intent || "prod"
        )
    },

    permission(permission, type, service, intent) {
        return this.create(
            "errors.com.epicgames.common.missing_permission", 1023,
            `Sorry your login does not posses the permissions '${permission} ${type}' needed to perform the requested operation`,
            service, intent || "prod", [permission, type]
        )
    }
}