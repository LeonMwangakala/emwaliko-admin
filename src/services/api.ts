import { API_CONFIG, API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    role_id: number;
  };
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiService {
  private token: string | null = localStorage.getItem('auth_token');

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // If endpoint is already a full URL, use it directly
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    
    console.log('API Request:', { endpoint, url, method: options.method || 'GET' });
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      console.log('API Response:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' });
    } catch (error) {
      // Even if logout fails, clear local token
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  async getUser(): Promise<any> {
    return this.request(API_ENDPOINTS.AUTH.USER);
  }

  async getScannerUsers(): Promise<any> {
    return this.request(API_ENDPOINTS.USERS.SCANNERS);
  }

  // Event management methods
  async getEvents(params?: Record<string, string | number>) {
    if (params) {
      const url = buildApiUrl(API_ENDPOINTS.EVENTS.LIST, params);
      return this.request(url);
    }
    return this.request(API_ENDPOINTS.EVENTS.LIST);
  }

  async getEvent(eventId: number) {
    return this.request(API_ENDPOINTS.EVENTS.SHOW(eventId));
  }

  async getEventByCode(eventCode: string) {
    return this.request(API_ENDPOINTS.EVENTS.SHOW_BY_CODE(eventCode));
  }

  async getEventOptions() {
    return this.request(API_ENDPOINTS.EVENTS.OPTIONS(1));
  }

  async createEvent(eventData: any) {
    return this.request(API_ENDPOINTS.EVENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId: number, eventData: any) {
    return this.request(API_ENDPOINTS.EVENTS.UPDATE(eventId), {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async updateEventStatus(eventId: number, status: string) {
    return this.request(API_ENDPOINTS.EVENTS.UPDATE_STATUS(eventId), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getEventGuests(eventId: number, page?: number, perPage?: number, search?: string) {
    const params: Record<string, string | number> = {};
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;
    if (search && search.trim()) params.search = search.trim();
    
    const url = buildApiUrl(API_ENDPOINTS.GUESTS.EVENT_GUESTS(eventId), params);
    return this.request(url);
  }

  async getAllEventGuests(eventId: number) {
    return this.request(`/events/${eventId}/guests/all`);
  }

  async generateMissingQrCodes(eventId: number) {
    return this.request(`/events/${eventId}/guests/generate-qr-codes`, {
      method: 'POST',
    });
  }

  async regenerateGuestQrCode(guestId: number) {
    return this.request(`/guests/${guestId}/regenerate-qr-code`, {
      method: 'POST',
    });
  }

  async getEventNotifications(eventId: number, page?: number, perPage?: number, search?: string) {
    const params: Record<string, string | number> = {};
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;
    if (search && search.trim()) params.search = search.trim();
    
    const url = buildApiUrl(`/events/${eventId}/notifications`, params);
    return this.request(url);
  }

  async getAvailableGuestsForNotificationType(eventId: number, notificationType: 'SMS' | 'WhatsApp') {
    const params = new URLSearchParams({ notification_type: notificationType });
    return this.request(`/events/${eventId}/notifications/available-guests?${params}`);
  }

  async sendEventNotifications(eventId: number, data: {
    message: string;
    notification_type: 'SMS' | 'WhatsApp';
    guest_ids?: number[];
  }) {
    return this.request(`/events/${eventId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(eventId: number, notificationId: number) {
    return this.request(`/events/${eventId}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async getEventScans(eventId: number) {
    return this.request(`/events/${eventId}/scans`);
  }

  async createScan(eventId: number, data: {
    guest_id: number;
    scanned_by: number;
  }) {
    return this.request(`/events/${eventId}/scans`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGuestByQrCode(eventId: number, qrCode: string) {
    return this.request(`/events/${eventId}/scans/guest-by-qr`, {
      method: 'POST',
      body: JSON.stringify({ qr_code: qrCode }),
    });
  }

  async uploadCardDesign(eventId: number, file: File) {
    // Convert file to base64
    const base64Data = await this.fileToBase64(file);
    
    return this.request(`/events/${eventId}/card-design`, {
      method: 'POST',
      body: JSON.stringify({
        card_design_base64: base64Data,
        file_name: file.name,
        file_type: file.type
      }),
    });
  }

  async getCardDesign(eventId: number) {
    return this.request(`/events/${eventId}/card-design`);
  }

  // Helper method to convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async deleteCardDesign(eventId: number) {
    return this.request(`/events/${eventId}/card-design`, {
      method: 'DELETE',
    });
  }

  // Customer management methods
  async getCustomers(page?: number, perPage?: number, search?: string) {
    const params: Record<string, string | number> = {};
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;
    if (search && search.trim()) params.search = search.trim();
    
    const url = buildApiUrl(API_ENDPOINTS.CUSTOMERS.LIST, params);
    return this.request(url);
  }

  async createCustomer(customerData: any) {
    return this.request(API_ENDPOINTS.CUSTOMERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: number, customerData: any) {
    return this.request(API_ENDPOINTS.CUSTOMERS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async toggleCustomerStatus(id: number) {
    return this.request(API_ENDPOINTS.CUSTOMERS.TOGGLE_STATUS(id), {
      method: 'PATCH',
    });
  }

  async activateCustomer(id: number) {
    return this.request(API_ENDPOINTS.CUSTOMERS.ACTIVATE(id), {
      method: 'PATCH',
    });
  }

  async deactivateCustomer(id: number) {
    return this.request(API_ENDPOINTS.CUSTOMERS.DEACTIVATE(id), {
      method: 'PATCH',
    });
  }

  // Guest management methods
  async getGuests() {
    return this.request(API_ENDPOINTS.GUESTS.LIST);
  }

  async createGuest(guestData: any) {
    return this.request(API_ENDPOINTS.GUESTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(guestData),
    });
  }

  async bulkCreateGuests(eventId: number, guests: any[]) {
    return this.request(API_ENDPOINTS.GUESTS.BULK_CREATE(eventId), {
      method: 'POST',
      body: JSON.stringify({ guests }),
    });
  }

  async updateGuest(guestId: number, guestData: any) {
    return this.request(`/guests/${guestId}`, {
      method: 'PUT',
      body: JSON.stringify(guestData),
    });
  }

  // Event Types methods
  async getEventTypes() {
    return this.request(API_ENDPOINTS.EVENT_TYPES.LIST);
  }

  async createEventType(data: { name: string }) {
    return this.request(API_ENDPOINTS.EVENT_TYPES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEventType(id: number, data: { name: string }) {
    return this.request(API_ENDPOINTS.EVENT_TYPES.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleEventTypeStatus(id: number) {
    return this.request(API_ENDPOINTS.EVENT_TYPES.TOGGLE_STATUS(id), {
      method: 'PATCH',
    });
  }

  // Card Types methods
  async getCardTypes() {
    return this.request(API_ENDPOINTS.CARD_TYPES.LIST);
  }

  async createCardType(data: { 
    name: string;
    name_position_x?: number;
    name_position_y?: number;
    qr_position_x?: number;
    qr_position_y?: number;
    card_class_position_x?: number;
    card_class_position_y?: number;
    show_guest_name?: boolean;
    show_card_class?: boolean;
  }) {
    return this.request(API_ENDPOINTS.CARD_TYPES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCardType(id: number, data: { 
    name: string;
    name_position_x?: number;
    name_position_y?: number;
    qr_position_x?: number;
    qr_position_y?: number;
    card_class_position_x?: number;
    card_class_position_y?: number;
    show_guest_name?: boolean;
    show_card_class?: boolean;
  }) {
    return this.request(API_ENDPOINTS.CARD_TYPES.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleCardTypeStatus(id: number) {
    return this.request(API_ENDPOINTS.CARD_TYPES.TOGGLE_STATUS(id), {
      method: 'PATCH',
    });
  }

  // Card Classes methods
  async getCardClasses() {
    return this.request(API_ENDPOINTS.CARD_CLASSES.LIST);
  }

  async createCardClass(data: { name: string; max_guests: number }) {
    return this.request(API_ENDPOINTS.CARD_CLASSES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCardClass(id: number, data: { name: string; max_guests: number }) {
    return this.request(API_ENDPOINTS.CARD_CLASSES.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleCardClassStatus(id: number) {
    return this.request(API_ENDPOINTS.CARD_CLASSES.TOGGLE_STATUS(id), {
      method: 'PATCH',
    });
  }

  // Packages methods
  async getPackages() {
    return this.request(API_ENDPOINTS.PACKAGES.LIST);
  }

  async createPackage(data: { name: string; amount: number; currency?: string }) {
    return this.request(API_ENDPOINTS.PACKAGES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackage(id: number, data: { name: string; amount: number; currency?: string }) {
    return this.request(API_ENDPOINTS.PACKAGES.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async togglePackageStatus(id: number) {
    return this.request(API_ENDPOINTS.PACKAGES.TOGGLE_STATUS(id), {
      method: 'PATCH',
    });
  }

  // Profile methods
  async getProfile() {
    return this.request(API_ENDPOINTS.PROFILE.SHOW);
  }

  async updateProfile(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    bio?: string;
    country: string;
    region: string;
    postal_code: string;
  }) {
    return this.request(API_ENDPOINTS.PROFILE.UPDATE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('profile_picture', file);

    return this.request(API_ENDPOINTS.PROFILE.UPDATE_PICTURE, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
    });
  }

  async updatePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) {
    return this.request('/profile/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Location methods
  async getCountries() {
    return this.request(API_ENDPOINTS.LOCATIONS.COUNTRIES);
  }

  async getRegions(countryId: number) {
    return this.request(API_ENDPOINTS.LOCATIONS.REGIONS(countryId));
  }

  async getDistricts(regionId: number) {
    return this.request(API_ENDPOINTS.LOCATIONS.DISTRICTS(regionId));
  }

  async getAllLocations() {
    return this.request(API_ENDPOINTS.LOCATIONS.ALL);
  }

  // Sales methods
  async getSales(params?: Record<string, string | number>) {
    if (params) {
      const url = buildApiUrl('/sales', params);
      return this.request(url);
    }
    return this.request('/sales');
  }

  async getEventSales(eventId: number) {
    return this.request(`/events/${eventId}/sales`);
  }

  async getEventSalesSummary(eventId: number) {
    return this.request(`/events/${eventId}/sales/summary`);
  }

  async markSalesAsInvoiced(eventId: number) {
    return this.request(`/events/${eventId}/sales/invoice`, {
      method: 'PATCH',
    });
  }

  async markSalesAsPaid(eventId: number) {
    return this.request(`/events/${eventId}/sales/pay`, {
      method: 'PATCH',
    });
  }

  async canMarkEventAsCompleted(eventId: number) {
    return this.request(`/events/${eventId}/sales/can-complete`);
  }

  async markEventAsCompleted(eventId: number) {
    return this.request(`/events/${eventId}/sales/complete`, {
      method: 'PATCH',
    });
  }

  // Invoice methods
  async getInvoices(params?: Record<string, string | number>) {
    if (params) {
      const url = buildApiUrl('/invoices', params);
      return this.request(url);
    }
    return this.request('/invoices');
  }

  async getInvoice(invoiceId: number) {
    return this.request(`/invoices/${invoiceId}`);
  }

  async getInvoiceStatistics() {
    return this.request('/invoices/statistics');
  }

  async createInvoiceFromSales(salesId: number) {
    return this.request(`/sales/${salesId}/invoice`, {
      method: 'POST',
    });
  }

  async updateInvoiceStatus(invoiceId: number, status: string) {
    return this.request(`/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async downloadInvoice(invoiceId: number) {
    return this.request(`/invoices/${invoiceId}/download`);
  }

  async deleteInvoice(invoiceId: number) {
    return this.request(`/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  }

  async getVatRate(): Promise<number> {
    const res = await this.request<{ vat_rate: number }>(`/settings/vat-rate`);
    return res.vat_rate;
  }

  async setVatRate(vatRate: number): Promise<number> {
    const res = await this.request<{ vat_rate: number }>(`/settings/vat-rate`, {
      method: 'POST',
      body: JSON.stringify({ vat_rate: vatRate }),
    });
    return res.vat_rate;
  }

  // Payment Settings methods
  async getPaymentSettings(): Promise<any> {
    return this.request('/payment-settings');
  }

  async updatePaymentSettings(settings: any): Promise<any> {
    return this.request('/payment-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // User management methods
  async getUsers(params?: Record<string, string | number>): Promise<any> {
    if (params) {
      const url = buildApiUrl('/users', params);
      return this.request(url);
    }
    return this.request('/users');
  }

  async getAllUsers(): Promise<any> {
    return this.request('/users/all');
  }

  async getUserById(userId: number): Promise<any> {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData: any): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, userData: any): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleUserStatus(userId: number): Promise<any> {
    return this.request(`/users/${userId}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async activateUser(userId: number): Promise<any> {
    return this.request(`/users/${userId}/activate`, {
      method: 'PATCH',
    });
  }

  async deactivateUser(userId: number): Promise<any> {
    return this.request(`/users/${userId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async deleteUser(userId: number): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserStatistics(): Promise<any> {
    return this.request('/users/statistics');
  }

  async getRoles(): Promise<any> {
    return this.request('/roles');
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/dashboard/stats');
  }

  // Report methods
  async getEventReports(params?: Record<string, string | number>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request(`/reports/events${queryString}`);
  }

  async getSalesReports(params?: Record<string, string | number>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request(`/reports/sales${queryString}`);
  }

  async getGuestReports(params?: Record<string, string | number>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request(`/reports/guests${queryString}`);
  }

  async getFinancialReports(params?: Record<string, string | number>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request(`/reports/financial${queryString}`);
  }

  async getNotificationReports(params?: Record<string, string | number>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request(`/reports/notifications${queryString}`);
  }

  async getScanReports(params?: Record<string, string | number>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request(`/reports/scans${queryString}`);
  }

  async getReportFilterOptions(): Promise<any> {
    return this.request('/reports/filter-options');
  }
}

export const apiService = new ApiService(); 