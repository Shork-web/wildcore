/**
 * Class representing a Login entity
 * Handles login-related data and validation
 */
export default class Login {
  constructor() {
    this.initializeFields();
  }

  /**
   * Initialize all fields with default values
   * @private
   */
  initializeFields() {
    this._email = '';
    this._password = '';
    this._accountType = 'instructor';
    this._showPassword = false;
  }

  // Getters
  get email() { return this._email; }
  get password() { return this._password; }
  get accountType() { return this._accountType; }
  get showPassword() { return this._showPassword; }

  // Setters
  set email(value) { this._email = value?.trim(); }
  set password(value) { this._password = value; }
  set accountType(value) { 
    if (value === 'instructor' || value === 'admin') {
      this._accountType = value;
    }
  }
  set showPassword(value) { this._showPassword = Boolean(value); }

  /**
   * Toggle password visibility state
   * @returns {boolean} New visibility state
   */
  togglePasswordVisibility() {
    this._showPassword = !this._showPassword;
    return this._showPassword;
  }

  /**
   * Validate login credentials
   * @returns {boolean} Whether the credentials are valid
   */
  isValid() {
    return Boolean(
      this._email && 
      this._email.includes('@') && 
      this._password &&
      this._password.length >= 6
    );
  }

  /**
   * Reset all fields to their default values
   */
  reset() {
    this.initializeFields();
  }

  /**
   * Convert login data to JSON format
   * @returns {Object} JSON representation of login data
   */
  toJSON() {
    return {
      email: this._email,
      accountType: this._accountType
    };
  }
} 