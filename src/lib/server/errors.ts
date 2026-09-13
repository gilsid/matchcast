export class DomainError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode = 400
	) {
		super(message);
	}
}
