export default class User {
  constructor() {
    this._firstName = '';
    this._lastName = '';
    this._email = '';
    this._password = '';
    this._confirmPassword = '';
    this._idNumber = '';
    this._phoneNumber = '';
    this._accountType = 'instructor';
    this._adminKey = '';
  }

  // Getters
  get firstName() { return this._firstName; }
  get lastName() { return this._lastName; }
  get email() { return this._email; }
  get password() { return this._password; }
  get confirmPassword() { return this._confirmPassword; }
  get idNumber() { return this._idNumber; }
  get phoneNumber() { return this._phoneNumber; }
  get accountType() { return this._accountType; }
  get adminKey() { return this._adminKey; }

  // Setters
  set firstName(value) { this._firstName = value; }
  set lastName(value) { this._lastName = value; }
  set email(value) { this._email = value; }
  set password(value) { this._password = value; }
  set confirmPassword(value) { this._confirmPassword = value; }
  set idNumber(value) { this._idNumber = value; }
  set phoneNumber(value) { this._phoneNumber = value; }
  set accountType(value) { this._accountType = value; }
  set adminKey(value) { this._adminKey = value; }

  // Methods
  toJSON() {
    return {
      firstName: this._firstName,
      lastName: this._lastName,
      email: this._email,
      idNumber: this._idNumber,
      phoneNumber: this._phoneNumber,
      role: this._accountType,
      adminKeyVerified: this._accountType === 'admin'
    };
  }

  validatePasswords() {
    return this._password === this._confirmPassword;
  }

  validateAdminKey() {
    return this._accountType !== 'admin' || this._adminKey === 'NLOADMIN_24!!';
  }

  isValid() {
    return (
      this._firstName &&
      this._lastName &&
      this._email &&
      this._password &&
      this._confirmPassword &&
      this._idNumber &&
      this._phoneNumber &&
      this.validatePasswords() &&
      this.validateAdminKey()
    );
  }
} 