import apiService from "./apiService.js";

const USER_KEY = "currentUser";
const ORG_KEY = "currentOrg";

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentOrg = null;
    this.isLoggedIn = false;
    this.loadFromStorage();
  }

  /**
   * Load user + org data from localStorage if available.
   *
   * @returns {void}
   */
  loadFromStorage() {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isLoggedIn = true;
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem(USER_KEY);
      }
    }

    const orgData = localStorage.getItem(ORG_KEY);
    if (orgData) {
      try {
        this.currentOrg = JSON.parse(orgData);
      } catch (error) {
        console.error("Failed to parse org data:", error);
        localStorage.removeItem(ORG_KEY);
      }
    }
  }

  /**
   * Persist the current user to localStorage.
   *
   * @returns {void}
   */
  persistUser() {
    if (this.currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  /**
   * Persist the current org to localStorage and notify listeners (branding).
   *
   * @returns {void}
   */
  persistOrg() {
    if (this.currentOrg) {
      localStorage.setItem(ORG_KEY, JSON.stringify(this.currentOrg));
    } else {
      localStorage.removeItem(ORG_KEY);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("org:changed", { detail: this.currentOrg }),
      );
    }
  }

  /**
   * Login a `user` or `manager` within an org and store user + branding.
   *
   * @async
   * @param {number} orgId - Org the member belongs to
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - The full login response
   * @throws {Error} - If login fails
   */
  async login(orgId, email, password) {
    try {
      const response = await apiService.login(orgId, email, password);

      if (!response.user) {
        throw new Error("Login response missing user data.");
      }

      this.setSession(response.user, response.org);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      this.isLoggedIn = false;
      throw error;
    }
  }

  /**
   * Store the session (user + org) and persist it.
   *
   * @param {Object} user - User object from the API
   * @param {Object|null} org - Org object from the API (null for admins)
   * @returns {void}
   */
  setSession(user, org) {
    this.currentUser = {
      id: user.id,
      orgId: user.orgId ?? null,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    this.currentOrg = org
      ? {
          id: org.id,
          name: org.name,
          accentColor: org.accentColor ?? null,
          status: org.status ?? "active",
        }
      : null;
    this.isLoggedIn = true;
    this.persistUser();
    this.persistOrg();
  }

  /**
   * Update only the org branding/status (e.g. after editing or reactivating).
   *
   * @param {Object} org - Org fields to merge in
   * @returns {void}
   */
  updateOrg(org) {
    if (!org) return;
    this.currentOrg = {
      ...(this.currentOrg || {}),
      ...org,
    };
    this.persistOrg();
  }

  /**
   * Logout the current user, clearing all local session state.
   *
   * @async
   * @returns {Promise<Object>}
   */
  async logout() {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearSession();
    }
    return { message: "Logged out successfully" };
  }

  /**
   * Clear all local session state.
   *
   * @returns {void}
   */
  clearSession() {
    this.currentUser = null;
    this.currentOrg = null;
    this.isLoggedIn = false;
    localStorage.removeItem(USER_KEY);
    this.persistOrg();
  }

  /**
   * Check if user is authenticated (client-side only).
   *
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.isLoggedIn && this.currentUser !== null;
  }

  /**
   * Validate session with the server, refreshing the token if needed.
   *
   * @async
   * @returns {Promise<boolean>}
   */
  async isLoggedInWithTokenCheck() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      if (await this.verifyAuthentication()) {
        return true;
      }
    } catch (error) {
      console.log("Token validation failed, attempting refresh...", error);
      try {
        await this.refreshToken();
        if (await this.verifyAuthentication()) {
          return true;
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }

    this.clearSession();
    return false;
  }

  /**
   * Verify authentication with the server and refresh local user state.
   * The profile includes `orgId` (null for platform admins).
   *
   * @async
   * @returns {Promise<boolean>}
   * @throws {Error}
   */
  async verifyAuthentication() {
    try {
      const userData = await apiService.getProfile();

      if (userData && userData.id) {
        this.currentUser = {
          id: userData.id,
          orgId: userData.orgId ?? null,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        };
        this.isLoggedIn = true;
        this.persistUser();
        return true;
      }

      this.clearSession();
      return false;
    } catch (error) {
      console.error("Authentication verification failed:", error);
      throw error;
    }
  }

  /**
   * Get current user data.
   *
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get the org the user is currently logged into (branding + status).
   *
   * @returns {Object|null}
   */
  getOrg() {
    return this.currentOrg;
  }

  /**
   * Get the current org status (`active` / `inactive` / `pending_payment`).
   *
   * @returns {string|null}
   */
  getOrgStatus() {
    return this.currentOrg?.status ?? null;
  }

  /**
   * Whether the org is in read-only (inactive) mode.
   *
   * @returns {boolean}
   */
  isReadOnly() {
    return this.currentOrg?.status === "inactive";
  }

  /** @returns {string|null} The current user's role. */
  getRole() {
    return this.currentUser?.role ?? null;
  }

  /** @returns {boolean} True if the user is an org manager. */
  isManager() {
    return this.getRole() === "manager";
  }

  /** @returns {boolean} True if the user is a platform admin. */
  isAdmin() {
    return this.getRole() === "admin";
  }

  /** @returns {boolean} True if the user is a regular org user. */
  isUser() {
    return this.getRole() === "user";
  }

  /**
   * Refresh access token.
   *
   * @async
   * @returns {Promise<Object>}
   * @throws {Error}
   */
  async refreshToken() {
    try {
      return await apiService.refreshAccessToken();
    } catch (error) {
      console.error("Token refresh failed:", error);
      await this.logout();
      throw error;
    }
  }
}

export default new AuthService();
